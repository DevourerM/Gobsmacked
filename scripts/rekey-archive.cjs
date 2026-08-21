const { app, BrowserWindow, ipcMain, safeStorage } = require('electron');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const {
  loadManifest, saveManifest, decryptObject, rekeyObject, manifestSummary
} = require('../src/sealed-library.cjs');
const {
  ARCHIVE_KEY_MODE, ARCHIVE_KEY_CONTEXT, deriveArchiveKey, usesHistoryPassphrase
} = require('../src/archive-key.cjs');

const appDataRoot = app.getPath('appData');
const gobsmackedUserData = path.join(appDataRoot, 'gobsmacked');
app.setName('gobsmacked');
// The original one-time sealing process used Electron's default userData for
// safeStorage while writing the protected blob into Gobsmacked's userData.
app.setPath('userData', path.join(appDataRoot, 'Electron'));
app.disableHardwareAcceleration();
let window; let running = false;

async function jsonRead(file, fallback = null) {
  try { return JSON.parse(await fsp.readFile(file, 'utf8')); } catch { return fallback; }
}

async function atomicJson(file, value) {
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fsp.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fsp.rename(temporary, file);
}

function assertMigrationPaths(archive, pending, backup) {
  const parent = path.dirname(archive);
  if (path.basename(archive) !== 'Archive') throw new Error('档案路径名称校验失败');
  if (pending !== path.join(parent, 'Archive.rekey-pending')) throw new Error('临时路径校验失败');
  if (backup !== path.join(parent, 'Archive.rekey-backup')) throw new Error('备份路径校验失败');
  if (archive === parent || pending === parent || backup === parent) throw new Error('拒绝对上级目录操作');
}

function verifyHistoricalSecret(secret, config) {
  if (!config?.innerSalt || !config?.innerHash) throw new Error('历史密匙尚未设置');
  const actual = crypto.scryptSync(String(secret), Buffer.from(config.innerSalt, 'hex'), 64);
  const expected = Buffer.from(config.innerHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function send(stage, done, total, bytes, totalBytes, detail = '') {
  const basis = totalBytes || total || 1;
  const current = totalBytes ? bytes : done;
  window?.webContents.send('rekey:progress', {
    stage, done, total, bytes, totalBytes, detail,
    percent: Math.min(100, Number((current / basis * 100).toFixed(2)))
  });
}

async function migrate(secret) {
  const projectRoot = path.resolve(__dirname, '..');
  const archive = path.join(path.dirname(projectRoot), 'Archive');
  const pending = `${archive}.rekey-pending`;
  const backup = `${archive}.rekey-backup`;
  assertMigrationPaths(archive, pending, backup);
  const userData = gobsmackedUserData;
  const securityFile = path.join(userData, 'security.json');
  const keyFile = path.join(userData, 'sealed-archive-key.bin');
  const reportFile = path.join(userData, 'archive-rekey-report.json');
  const config = await jsonRead(securityFile);
  if (!verifyHistoricalSecret(secret, config)) throw new Error('历史密匙不正确');
  const newKey = deriveArchiveKey(secret, config.innerSalt);
  let oldKey;
  try {
    send('prepare', 0, 1, 0, 1);
    const currentInfo = await jsonRead(path.join(archive, 'archive.info'));
    if (usesHistoryPassphrase(currentInfo)) {
      await loadManifest(archive, newKey);
      await fsp.rm(keyFile, { force: true });
      if (fs.existsSync(backup)) await fsp.rm(backup, { recursive: true, force: false, maxRetries: 3, retryDelay: 500 });
      return { already: true };
    }
    if (fs.existsSync(backup)) throw new Error('发现未处理的换钥备份，已停止以保护档案');
    if (!fs.existsSync(keyFile) || !safeStorage.isEncryptionAvailable()) throw new Error('旧档案密钥不可用');
    oldKey = Buffer.from(safeStorage.decryptString(await fsp.readFile(keyFile)), 'base64');
    if (oldKey.length !== 32) throw new Error('旧档案密钥已损坏');
    const manifest = await loadManifest(archive, oldKey);
    const summary = manifestSummary(manifest);
    const files = manifest.entries.filter((entry) => entry.type === 'file');
    const unique = [...new Map(files.map((entry) => [entry.objectId, entry])).values()];
    const uniqueBytes = unique.reduce((sum, entry) => sum + entry.size, 0);
    await fsp.mkdir(pending, { recursive: true });
    const objectMap = new Map(); let changedBytes = 0;
    for (let index = 0; index < unique.length; index += 1) {
      const entry = unique[index];
      const result = await rekeyObject(archive, pending, entry.objectId, oldKey, newKey, entry);
      objectMap.set(entry.objectId, result.objectId); changedBytes += entry.size;
      if ((index + 1) % 25 === 0 || index + 1 === unique.length) send('rekey', index + 1, unique.length, changedBytes, uniqueBytes);
    }
    const nextManifest = {
      ...manifest,
      keyProtection: ARCHIVE_KEY_MODE,
      kdf: { name: 'scrypt', N: 131072, r: 8, p: 1, context: ARCHIVE_KEY_CONTEXT },
      rekeyedAt: new Date().toISOString(),
      entries: manifest.entries.map((entry) => entry.type === 'file' ? { ...entry, objectId: objectMap.get(entry.objectId) } : entry)
    };
    await saveManifest(pending, newKey, nextManifest);

    let verifiedBytes = 0;
    const nextUnique = [...new Map(nextManifest.entries.filter((entry) => entry.type === 'file').map((entry) => [entry.objectId, entry])).values()];
    for (let index = 0; index < nextUnique.length; index += 1) {
      const entry = nextUnique[index];
      await decryptObject(pending, entry.objectId, null, newKey, entry); verifiedBytes += entry.size;
      if ((index + 1) % 25 === 0 || index + 1 === nextUnique.length) send('verify', index + 1, nextUnique.length, verifiedBytes, uniqueBytes);
    }
    const pendingSummary = manifestSummary(await loadManifest(pending, newKey));
    if (JSON.stringify(pendingSummary) !== JSON.stringify(summary)) throw new Error('新档案清单统计不一致');
    const objectNames = (await fsp.readdir(path.join(pending, 'objects'))).filter((name) => name.endsWith('.gse'));
    if (objectNames.length !== nextUnique.length) throw new Error('新档案对象数量不一致');

    send('swap', 0, 1, 0, 1);
    await fsp.rename(archive, backup);
    try {
      await fsp.rename(pending, archive);
      await loadManifest(archive, newKey);
    } catch (error) {
      if (fs.existsSync(archive)) await fsp.rename(archive, pending).catch(() => undefined);
      if (fs.existsSync(backup) && !fs.existsSync(archive)) await fsp.rename(backup, archive);
      throw error;
    }
    await fsp.rm(keyFile, { force: true });
    await fsp.rm(backup, { recursive: true, force: false, maxRetries: 3, retryDelay: 500 });
    const report = {
      schema: 'cn.dxr.gobsmacked-archive-rekey-report', version: 1,
      completedAt: new Date().toISOString(), verified: true,
      encryption: 'AES-256-GCM', keyProtection: ARCHIVE_KEY_MODE,
      kdf: nextManifest.kdf, ...summary, encryptedObjects: nextUnique.length,
      legacyKeyRemoved: !fs.existsSync(keyFile), legacyArchiveRemoved: !fs.existsSync(backup)
    };
    await atomicJson(reportFile, report);
    send('done', 1, 1, 1, 1);
    return { already: false, report };
  } finally {
    oldKey?.fill(0); newKey.fill(0);
  }
}

async function createWindow() {
  window = new BrowserWindow({
    width: 650, height: 570, resizable: false, backgroundColor: '#03060a', autoHideMenuBar: true,
    title: 'Gobsmacked 档案换钥', show: false, alwaysOnTop: true,
    webPreferences: { preload: path.join(__dirname, 'rekey-preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.on('closed', () => { window = null; if (!running) app.quit(); });
  await window.loadFile(path.join(__dirname, 'rekey-archive.html'));
  window.center(); window.show(); window.focus();
}

ipcMain.handle('rekey:start', async (_event, secret) => {
  if (running) throw new Error('换钥正在进行');
  running = true;
  window?.setAlwaysOnTop(false);
  try { return await migrate(String(secret || '')); }
  finally { running = false; secret = ''; }
});

app.whenReady().then(createWindow).catch((error) => { console.error(error?.stack || error); app.exit(1); });
app.on('window-all-closed', () => { if (!running) app.quit(); });
