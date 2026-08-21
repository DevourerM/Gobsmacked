const { app, BrowserWindow, dialog, ipcMain, protocol, net, shell, safeStorage } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const crypto = require('node:crypto');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const archiver = require('archiver');
const topojson = require('topojson-client');
const worldTopology = require('world-atlas/countries-110m.json');
const {
  SCHEMA, VERSION, uid, isValidDateKey, emptyRecord, normalizeRecord,
  plainText, parseLegacyDiary
} = require('./domain.cjs');
const { isDeviceTrusted, addTrustedDevice, removeTrustedDevice } = require('./trust.cjs');
const {
  normalizeVirtualPath, loadManifest, saveManifest, encryptFile, decryptObject,
  manifestSummary, listChildren
} = require('./sealed-library.cjs');

protocol.registerSchemesAsPrivileged([
  { scheme: 'gob-media', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }
]);

let mainWindow;
let vaultRoot;
let libraryRoot;
let archiveKeyFile;
let archiveKey = null;
let libraryTempRoot;
let securityFile;
let trustedDeviceFile;
let mainUnlocked = false;
let innerUnlocked = false;
let failedAuthCount = 0;
let nextAuthAt = 0;
let constellationQueue = Promise.resolve();
let geocodeQueue = Promise.resolve();
let lastGeocodeAt = 0;
let librarySummaryCache = null;
let libraryQueue = Promise.resolve();
const earthOutlines = {
  land: topojson.mesh(worldTopology, worldTopology.objects.land).coordinates,
  countries: topojson.mesh(worldTopology, worldTopology.objects.countries, (a, b) => a !== b).coordinates
};

function requireMain() {
  if (!mainUnlocked) throw new Error('身份会话未解锁');
}

function requireInner() {
  requireMain();
  if (!innerUnlocked) throw new Error('过去资料库尚未通过二次验证');
}

const jsonRead = async (file, fallback) => {
  try { return JSON.parse(await fsp.readFile(file, 'utf8')); } catch { return fallback; }
};

async function atomicJson(file, value) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fsp.writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fsp.rename(temp, file);
}

function recordPath(kind, dateKey) {
  if (!['day', 'year'].includes(kind) || !isValidDateKey(kind, dateKey)) throw new Error('非法记录地址');
  return kind === 'day'
    ? path.join(vaultRoot, 'records', 'day', dateKey.slice(0, 4), `${dateKey}.gob`)
    : path.join(vaultRoot, 'records', 'year', `${dateKey}.gob`);
}

function metadataPath(name) {
  if (!['annotations', 'constellation', 'events', 'geocode-cache'].includes(name)) throw new Error('非法元数据');
  return path.join(vaultRoot, 'metadata', `${name}.json`);
}

function defaultConstellation() {
  return Array.from({ length: 12 }, (_, index) => ({
    id: `star-${index}`,
    lit: false, firstLitAt: null, changedAt: null
  }));
}

async function initializeVault() {
  vaultRoot = path.join(app.getPath('userData'), 'vault');
  const programRoot = app.isPackaged ? path.dirname(process.execPath) : path.resolve(__dirname, '..');
  libraryRoot = path.resolve(process.env.GOBSMACKED_ARCHIVE_ROOT || path.join(path.dirname(programRoot), 'Gobsmacked.Archive'));
  archiveKeyFile = path.join(app.getPath('userData'), 'sealed-archive-key.bin');
  libraryTempRoot = path.join(app.getPath('temp'), `Gobsmacked-Sealed-${process.pid}`);
  securityFile = path.join(app.getPath('userData'), 'security.json');
  trustedDeviceFile = path.join(app.getPath('userData'), 'trusted-device.json');
  await Promise.all([
    fsp.mkdir(path.join(vaultRoot, 'records', 'day'), { recursive: true }),
    fsp.mkdir(path.join(vaultRoot, 'records', 'year'), { recursive: true }),
    fsp.mkdir(path.join(vaultRoot, 'assets'), { recursive: true }),
    fsp.mkdir(path.join(vaultRoot, 'metadata'), { recursive: true }),
    fsp.mkdir(libraryRoot, { recursive: true }),
    fsp.mkdir(libraryTempRoot, { recursive: true })
  ]);
  const manifestFile = path.join(vaultRoot, 'manifest.json');
  if (!fs.existsSync(manifestFile)) {
    await atomicJson(manifestFile, {
      schema: 'cn.dxr.gobsmacked-vault', version: 1,
      createdAt: new Date().toISOString(), appVersion: app.getVersion()
    });
  }
}

async function uniqueChildPath(parent, requestedName) {
  const parsed = path.parse(path.basename(requestedName));
  let target = path.join(parent, parsed.base);
  for (let index = 2; fs.existsSync(target); index += 1) {
    target = path.join(parent, `${parsed.name} (${index})${parsed.ext}`);
  }
  return target;
}

function assertExternalTransferPath(source) {
  const resolved = path.resolve(source);
  const root = path.resolve(libraryRoot);
  if (resolved === root || resolved.startsWith(`${root}${path.sep}`) || root.startsWith(`${resolved}${path.sep}`)) {
    throw new Error('不能在资料仓库内部重复导入，也不能导入包含资料仓库的上级目录');
  }
}

async function getArchiveKey() {
  if (archiveKey) return archiveKey;
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Windows 账户保护当前不可用');
  if (fs.existsSync(archiveKeyFile)) {
    const encoded = safeStorage.decryptString(await fsp.readFile(archiveKeyFile));
    const key = Buffer.from(encoded, 'base64');
    if (key.length !== 32) throw new Error('封存密钥已损坏');
    archiveKey = key;
    return archiveKey;
  }
  const key = crypto.randomBytes(32);
  const protectedKey = safeStorage.encryptString(key.toString('base64'));
  const temporary = `${archiveKeyFile}.${process.pid}.tmp`;
  await fsp.writeFile(temporary, protectedKey);
  await fsp.rename(temporary, archiveKeyFile);
  archiveKey = key;
  return archiveKey;
}

function lockArchiveKey() {
  archiveKey?.fill(0);
  archiveKey = null;
}

async function getLibraryManifest() {
  return loadManifest(libraryRoot, await getArchiveKey());
}

function uniqueVirtualPath(manifest, parent, requestedName) {
  const baseParent = normalizeVirtualPath(parent);
  const parsed = path.parse(path.basename(requestedName));
  const used = new Set(manifest.entries.map((entry) => entry.path.toLocaleLowerCase('zh-CN')));
  for (let index = 1; ; index += 1) {
    const name = index === 1 ? parsed.base : `${parsed.name} (${index})${parsed.ext}`;
    const candidate = normalizeVirtualPath(baseParent ? `${baseParent}/${name}` : name);
    if (!used.has(candidate.toLocaleLowerCase('zh-CN'))) return candidate;
  }
}

async function currentLibrarySummary() {
  if (librarySummaryCache) return librarySummaryCache;
  librarySummaryCache = manifestSummary(await getLibraryManifest());
  return librarySummaryCache;
}

async function addSourceToManifest(manifest, source, virtualPath) {
  const stat = await fsp.stat(source);
  if (stat.isDirectory()) {
    manifest.entries.push({ path: virtualPath, type: 'directory', modifiedAt: stat.mtime.toISOString() });
    const children = await fsp.readdir(source, { withFileTypes: true });
    for (const child of children.sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))) {
      await addSourceToManifest(manifest, path.join(source, child.name), `${virtualPath}/${child.name}`);
    }
    return;
  }
  if (!stat.isFile()) return;
  const encrypted = await encryptFile(source, libraryRoot, await getArchiveKey());
  manifest.entries.push({
    path: virtualPath,
    type: 'file',
    size: encrypted.size,
    sha256: encrypted.sha256,
    objectId: encrypted.objectId,
    modifiedAt: stat.mtime.toISOString()
  });
}

function libraryEntry(manifest, relative) {
  const normalized = normalizeVirtualPath(relative);
  return manifest.entries.find((entry) => entry.path === normalized) || null;
}

async function extractLibraryEntry(manifest, entry, destination) {
  const key = await getArchiveKey();
  if (entry.type === 'file') {
    await decryptObject(libraryRoot, entry.objectId, destination, key, entry);
    await fsp.utimes(destination, new Date(entry.modifiedAt), new Date(entry.modifiedAt)).catch(() => undefined);
    return;
  }
  await fsp.mkdir(destination, { recursive: true });
  const prefix = `${entry.path}/`;
  for (const child of manifest.entries.filter((item) => item.path.startsWith(prefix))) {
    const relative = child.path.slice(prefix.length).split('/').join(path.sep);
    const target = path.join(destination, relative);
    if (child.type === 'directory') await fsp.mkdir(target, { recursive: true });
    else await extractLibraryEntry(manifest, child, target);
  }
}

async function currentDeviceTrust(config) {
  const device = await jsonRead(trustedDeviceFile, null);
  return { device, trusted: isDeviceTrusted(config, device) };
}

function deriveSecret(secret, salt) {
  return crypto.scryptSync(String(secret), Buffer.from(salt, 'hex'), 64).toString('hex');
}

function safeAssetName(value) {
  const name = path.basename(String(value));
  return /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]{1,10}$/.test(name) ? name : null;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: '#030711',
    titleBarStyle: 'hiddenInset',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault();
  });
  mainWindow.on('closed', () => { mainWindow = null; });
  await mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.show();
  mainWindow.focus();
}

function registerIpc() {
  ipcMain.handle('auth:status', async () => {
    const config = await jsonRead(securityFile, null);
    const trust = await currentDeviceTrust(config);
    return { configured: Boolean(config?.hash), innerConfigured: Boolean(config?.innerHash), identity: config?.identity || '', trusted: trust.trusted };
  });
  ipcMain.handle('auth:setup', async (_event, payload) => {
    if (fs.existsSync(securityFile)) throw new Error('身份已经创建');
    const identity = String(payload?.identity || '').trim().slice(0, 50);
    const secret = String(payload?.secret || '');
    if (!identity || secret.length < 4) throw new Error('身份名不能为空，口令至少 4 位');
    const salt = crypto.randomBytes(24).toString('hex');
    await atomicJson(securityFile, { version: 2, identity, salt, hash: deriveSecret(secret, salt) });
    mainUnlocked = true;
    return { ok: true, identity };
  });
  ipcMain.handle('auth:setupInner', async (_event, payload) => {
    requireMain();
    const config = await jsonRead(securityFile, null);
    if (!config?.hash) throw new Error('请先创建启动身份');
    if (config.innerHash) throw new Error('历史密钥已经设置');
    const secret = String(payload?.secret || '');
    if (secret.length < 4) throw new Error('历史密钥至少 4 位');
    const proposedMain = Buffer.from(deriveSecret(secret, config.salt), 'hex');
    const currentMain = Buffer.from(config.hash, 'hex');
    if (proposedMain.length === currentMain.length && crypto.timingSafeEqual(proposedMain, currentMain)) {
      throw new Error('历史密钥不能与启动密钥相同');
    }
    const innerSalt = crypto.randomBytes(24).toString('hex');
    await atomicJson(securityFile, { ...config, version: 2, innerSalt, innerHash: deriveSecret(secret, innerSalt) });
    innerUnlocked = true;
    return { ok: true };
  });
  ipcMain.handle('auth:verify', async (_event, payload) => {
    if (Date.now() < nextAuthAt) return { ok: false, retryAfterMs: nextAuthAt - Date.now() };
    const secret = typeof payload === 'string' ? payload : payload?.secret;
    const purpose = typeof payload === 'object' && payload?.purpose === 'inner' ? 'inner' : 'main';
    const claimedIdentity = typeof payload === 'object' ? String(payload?.identity || '').trim() : '';
    const config = await jsonRead(securityFile, null);
    if (!config?.hash) return { ok: false };
    if (purpose === 'inner' && !config.innerHash) return { ok: false, needsSetup: true };
    const salt = purpose === 'inner' ? config.innerSalt : config.salt;
    const storedHash = purpose === 'inner' ? config.innerHash : config.hash;
    const actual = Buffer.from(deriveSecret(secret, salt), 'hex');
    const expected = Buffer.from(storedHash, 'hex');
    const identityMatches = purpose === 'inner' || claimedIdentity === config.identity;
    const ok = identityMatches && actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
    if (ok) {
      failedAuthCount = 0; nextAuthAt = 0;
      if (purpose === 'main') mainUnlocked = true;
      if (purpose === 'inner') innerUnlocked = true;
    } else {
      failedAuthCount += 1;
      nextAuthAt = Date.now() + Math.min(5000, Math.max(350, 250 * (2 ** Math.min(failedAuthCount, 5))));
    }
    return { ok, identity: config.identity, retryAfterMs: ok ? 0 : nextAuthAt - Date.now() };
  });
  ipcMain.handle('auth:trustedEnter', async () => {
    const config = await jsonRead(securityFile, null);
    const trust = await currentDeviceTrust(config);
    if (!config?.hash || !trust.trusted) return { ok: false };
    mainUnlocked = true;
    failedAuthCount = 0; nextAuthAt = 0;
    return { ok: true, identity: config.identity };
  });
  ipcMain.handle('auth:setDeviceTrust', async (_event, enabled) => {
    requireMain();
    const config = await jsonRead(securityFile, null);
    if (!config?.hash) throw new Error('身份尚未创建');
    const existing = await jsonRead(trustedDeviceFile, null);
    if (enabled) {
      const device = {
        version: 1,
        id: existing?.id || crypto.randomUUID(),
        token: crypto.randomBytes(32).toString('hex')
      };
      await atomicJson(securityFile, addTrustedDevice(config, device, os.hostname()));
      await atomicJson(trustedDeviceFile, device);
      return { trusted: true };
    }
    const nextConfig = removeTrustedDevice(config, existing?.id);
    await atomicJson(securityFile, nextConfig);
    await fsp.rm(trustedDeviceFile, { force: true });
    return { trusted: false };
  });
  ipcMain.handle('auth:lockInner', async () => {
    innerUnlocked = false;
    lockArchiveKey();
    await fsp.rm(libraryTempRoot, { recursive: true, force: true }).catch(() => undefined);
    await fsp.mkdir(libraryTempRoot, { recursive: true });
    return { ok: true };
  });

  ipcMain.handle('record:get', async (_event, { kind, date }) => {
    requireMain();
    const file = recordPath(kind, date);
    const stored = await jsonRead(file, null);
    return stored ? normalizeRecord(stored, kind, date) : emptyRecord(kind, date);
  });
  ipcMain.handle('record:save', async (_event, payload) => {
    requireMain();
    const record = normalizeRecord(payload, payload?.kind, payload?.date);
    const file = recordPath(record.kind, record.date);
    await atomicJson(file, record);
    return { ok: true, updatedAt: record.updatedAt };
  });
  ipcMain.handle('record:index', async () => {
    requireInner();
    const days = [];
    const years = [];
    const dayRoot = path.join(vaultRoot, 'records', 'day');
    for (const yearEntry of await fsp.readdir(dayRoot, { withFileTypes: true })) {
      if (!yearEntry.isDirectory()) continue;
      const folder = path.join(dayRoot, yearEntry.name);
      for (const file of await fsp.readdir(folder, { withFileTypes: true })) {
        if (!file.isFile() || path.extname(file.name) !== '.gob') continue;
        const key = path.basename(file.name, '.gob');
        if (isValidDateKey('day', key)) days.push(key);
      }
    }
    const yearRoot = path.join(vaultRoot, 'records', 'year');
    for (const file of await fsp.readdir(yearRoot, { withFileTypes: true })) {
      if (!file.isFile() || path.extname(file.name) !== '.gob') continue;
      const key = path.basename(file.name, '.gob');
      if (isValidDateKey('year', key)) years.push(key);
    }
    return { days: days.sort(), years: years.sort() };
  });
  ipcMain.handle('record:recent', async (_event, limit = 12) => {
    requireMain();
    const root = path.join(vaultRoot, 'records', 'day');
    const years = await fsp.readdir(root, { withFileTypes: true }).catch(() => []);
    const files = [];
    for (const year of years.filter((item) => item.isDirectory())) {
      const dir = path.join(root, year.name);
      const names = await fsp.readdir(dir).catch(() => []);
      for (const name of names.filter((item) => item.endsWith('.gob'))) files.push(path.join(dir, name));
    }
    const records = await Promise.all(files.map((file) => jsonRead(file, null)));
    return records.filter(Boolean).sort((a, b) => b.date.localeCompare(a.date)).slice(0, Math.min(100, Number(limit) || 12))
      .map((record) => ({ date: record.date, title: record.title, tags: record.tags || [], excerpt: plainText(record).slice(0, 140) }));
  });
  ipcMain.handle('record:calendar', async (_event, monthKey) => {
    requireMain();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(monthKey))) throw new Error('非法月份');
    const dir = path.join(vaultRoot, 'records', 'day', monthKey.slice(0, 4));
    const files = await fsp.readdir(dir).catch(() => []);
    return files.filter((file) => file.startsWith(monthKey) && file.endsWith('.gob')).map((file) => file.slice(0, 10));
  });

  ipcMain.handle('asset:import', async (_event, type) => {
    requireMain();
    if (!['image', 'audio'].includes(type)) throw new Error('不支持的媒体类型');
    const filters = type === 'image'
      ? [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] }]
      : [{ name: '音频', extensions: ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac'] }];
    const picked = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters });
    if (picked.canceled || !picked.filePaths[0]) return null;
    const source = picked.filePaths[0];
    const ext = path.extname(source).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 11) || '.bin';
    const id = uid('asset');
    const storedName = `${id}${ext}`;
    await fsp.copyFile(source, path.join(vaultRoot, 'assets', storedName));
    return { assetId: storedName, fileName: path.basename(source), url: `gob-media://${storedName}` };
  });
  ipcMain.handle('asset:saveRecording', async (_event, payload) => {
    requireMain();
    const bytes = payload?.bytes;
    if (!(bytes instanceof Uint8Array) || bytes.byteLength < 1 || bytes.byteLength > 100 * 1024 * 1024) {
      throw new Error('录音数据无效或超过 100 MB');
    }
    const mimeType = String(payload?.mimeType || '').toLowerCase();
    const extension = mimeType.includes('ogg') ? '.ogg' : mimeType.includes('mp4') || mimeType.includes('m4a') ? '.m4a' : '.webm';
    const id = uid('recording');
    const storedName = `${id}${extension}`;
    await fsp.writeFile(path.join(vaultRoot, 'assets', storedName), Buffer.from(bytes));
    return { assetId: storedName, fileName: `recording-${new Date().toISOString().replace(/[:.]/g, '-')}${extension}` };
  });

  ipcMain.handle('earth:outlines', async () => { requireMain(); return earthOutlines; });
  ipcMain.handle('earth:geocode', async (_event, rawQuery) => {
    requireMain();
    const query = String(rawQuery || '').trim().slice(0, 200);
    if (query.length < 2) throw new Error('请写下更完整的地点');
    const cacheFile = metadataPath('geocode-cache');
    const cache = await jsonRead(cacheFile, {});
    const cacheKey = query.toLocaleLowerCase('zh-CN');
    if (cache[cacheKey]) return { ...cache[cacheKey], cached: true };
    geocodeQueue = geocodeQueue.catch(() => undefined).then(async () => {
      const waitMs = Math.max(0, 1000 - (Date.now() - lastGeocodeAt));
      if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
      const endpoint = process.env.GOBSMACKED_GEOCODER_URL || 'https://nominatim.openstreetmap.org/search';
      const url = new URL(endpoint);
      if (url.protocol !== 'https:') throw new Error('地理编码服务必须使用 HTTPS');
      url.searchParams.set('q', query); url.searchParams.set('format', 'jsonv2'); url.searchParams.set('limit', '1');
      url.searchParams.set('addressdetails', '0');
      lastGeocodeAt = Date.now();
      const response = await net.fetch(url.toString(), {
        headers: { 'User-Agent': `Gobsmacked/${app.getVersion()} personal-chronicle`, 'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.5' }
      });
      if (!response.ok) throw new Error(`定位服务暂时不可用（${response.status}）`);
      const matches = await response.json();
      if (!Array.isArray(matches) || !matches[0]) return { found: false };
      const result = {
        found: true,
        latitude: Number(matches[0].lat), longitude: Number(matches[0].lon),
        displayName: String(matches[0].display_name || query).slice(0, 300), cachedAt: new Date().toISOString()
      };
      if (!Number.isFinite(result.latitude) || !Number.isFinite(result.longitude)) return { found: false };
      const latestCache = await jsonRead(cacheFile, {});
      latestCache[cacheKey] = result;
      const keys = Object.keys(latestCache);
      if (keys.length > 200) keys.sort((a, b) => String(latestCache[a].cachedAt).localeCompare(String(latestCache[b].cachedAt))).slice(0, keys.length - 200).forEach((key) => delete latestCache[key]);
      await atomicJson(cacheFile, latestCache);
      return result;
    });
    return geocodeQueue;
  });

  ipcMain.handle('annotations:list', async () => { requireMain(); return jsonRead(metadataPath('annotations'), []); });
  ipcMain.handle('annotations:save', async (_event, input) => {
    requireMain();
    const date = String(input?.date || '');
    if (!isValidDateKey('day', date)) throw new Error('非法标注日期');
    const annotations = await jsonRead(metadataPath('annotations'), []);
    const annotation = {
      id: uid('annotation'), date, monthDay: date.slice(5),
      scope: input?.scope === 'annual' ? 'annual' : 'once',
      text: String(input?.text || '').trim().slice(0, 300), createdAt: new Date().toISOString()
    };
    if (!annotation.text) throw new Error('标注内容不能为空');
    annotations.push(annotation);
    await atomicJson(metadataPath('annotations'), annotations);
    return annotation;
  });
  ipcMain.handle('annotations:delete', async (_event, id) => {
    requireMain();
    const annotations = await jsonRead(metadataPath('annotations'), []);
    await atomicJson(metadataPath('annotations'), annotations.filter((item) => item.id !== id));
    return { ok: true };
  });

  ipcMain.handle('constellation:get', async () => {
    requireMain();
    const file = metadataPath('constellation');
    const stored = await jsonRead(file, null);
    if (Array.isArray(stored) && stored.length === 12) {
      const silentStars = stored.map(({ name: _discardedName, ...star }) => star);
      if (stored.some((star) => Object.hasOwn(star, 'name'))) await atomicJson(file, silentStars);
      return silentStars;
    }
    const initial = defaultConstellation();
    await atomicJson(file, initial);
    return initial;
  });
  ipcMain.handle('constellation:update', (_event, input) => {
    requireMain();
    constellationQueue = constellationQueue.catch(() => undefined).then(async () => {
      const stars = await jsonRead(metadataPath('constellation'), defaultConstellation());
      stars.forEach((star) => { delete star.name; });
      const star = stars.find((item) => item.id === input?.id);
      if (!star) throw new Error('星位不存在');
      if (input?.remember === true) {
        star.lit = true;
        star.changedAt = new Date().toISOString();
        if (!star.firstLitAt) star.firstLitAt = star.changedAt;
        const events = await jsonRead(metadataPath('events'), []);
        events.push({ id: uid('event'), type: 'remembrance', starId: star.id, at: star.changedAt });
        await atomicJson(metadataPath('events'), events);
      }
      await atomicJson(metadataPath('constellation'), stars);
      return stars;
    });
    return constellationQueue;
  });

  ipcMain.handle('legacy:select', async () => {
    requireInner();
    const picked = await dialog.showOpenDialog(mainWindow, {
      title: '选择旧版日记文本', properties: ['openFile'], filters: [{ name: '文本日记', extensions: ['txt'] }]
    });
    if (picked.canceled || !picked.filePaths[0]) return null;
    const file = picked.filePaths[0];
    const guessed = path.basename(file).match(/(19|20|21)\d{2}/)?.[0] || String(new Date().getFullYear());
    const text = await fsp.readFile(file, 'utf8');
    const entries = parseLegacyDiary(text, guessed);
    return { file, year: guessed, count: entries.length, sample: entries.slice(0, 3), entries };
  });
  ipcMain.handle('legacy:import', async (_event, payload) => {
    requireInner();
    const year = String(payload?.year || '');
    const entries = parseLegacyDiary(String(payload?.text || ''), year);
    let imported = 0; let skipped = 0;
    for (const entry of entries) {
      const file = recordPath('day', entry.date);
      if (fs.existsSync(file)) { skipped += 1; continue; }
      const record = emptyRecord('day', entry.date);
      record.blocks[0].text = entry.text;
      await atomicJson(file, record);
      imported += 1;
    }
    return { imported, skipped };
  });
  ipcMain.handle('legacy:importEntries', async (_event, payload) => {
    requireInner();
    const entries = Array.isArray(payload?.entries) ? payload.entries : [];
    let imported = 0; let skipped = 0;
    for (const entry of entries) {
      if (!isValidDateKey('day', entry?.date)) continue;
      const file = recordPath('day', entry.date);
      if (fs.existsSync(file)) { skipped += 1; continue; }
      const record = emptyRecord('day', entry.date);
      record.blocks[0].text = String(entry.text || '').slice(0, 2_000_000);
      await atomicJson(file, record);
      imported += 1;
    }
    return { imported, skipped };
  });

  ipcMain.handle('library:status', async () => {
    requireInner();
    return { sealed: true, ...(await currentLibrarySummary()) };
  });
  ipcMain.handle('library:list', async (_event, input = {}) => {
    requireInner();
    const relative = normalizeVirtualPath(input.relative || '');
    const manifest = await getLibraryManifest();
    if (relative) {
      const selected = libraryEntry(manifest, relative);
      if (!selected || selected.type !== 'directory') throw new Error('资料目录不存在');
    }
    const all = listChildren(manifest, relative, input.query || '');
    const visible = all.slice(0, 1200);
    const entries = visible.map((entry) => ({
      name: entry.path.split('/').at(-1),
      relative: entry.path,
      directory: entry.type === 'directory',
      size: entry.type === 'file' ? entry.size : null,
      modifiedAt: entry.modifiedAt,
      extension: entry.type === 'file' ? path.extname(entry.path).toLowerCase() : ''
    }));
    return { relative, entries, total: all.length, truncated: all.length > visible.length, sealed: true };
  });
  ipcMain.handle('library:importFiles', async (_event, relative = '') => {
    requireInner();
    const picked = await dialog.showOpenDialog(mainWindow, { title: '导入资料', properties: ['openFile', 'multiSelections'] });
    if (picked.canceled || !picked.filePaths.length) return null;
    libraryQueue = libraryQueue.catch(() => undefined).then(async () => {
      const manifest = await getLibraryManifest();
      const imported = [];
      for (const source of picked.filePaths) {
        assertExternalTransferPath(source);
        const target = uniqueVirtualPath(manifest, relative, path.basename(source));
        await addSourceToManifest(manifest, source, target);
        imported.push(target);
      }
      await saveManifest(libraryRoot, await getArchiveKey(), manifest);
      librarySummaryCache = null;
      return { imported };
    });
    return libraryQueue;
  });
  ipcMain.handle('library:importFolder', async (_event, relative = '') => {
    requireInner();
    const picked = await dialog.showOpenDialog(mainWindow, { title: '导入文件夹', properties: ['openDirectory'] });
    if (picked.canceled || !picked.filePaths[0]) return null;
    const source = picked.filePaths[0];
    assertExternalTransferPath(source);
    libraryQueue = libraryQueue.catch(() => undefined).then(async () => {
      const manifest = await getLibraryManifest();
      const target = uniqueVirtualPath(manifest, relative, path.basename(source));
      await addSourceToManifest(manifest, source, target);
      await saveManifest(libraryRoot, await getArchiveKey(), manifest);
      librarySummaryCache = null;
      return { imported: [target] };
    });
    return libraryQueue;
  });
  ipcMain.handle('library:open', async (_event, relative) => {
    requireInner();
    const manifest = await getLibraryManifest();
    const entry = libraryEntry(manifest, relative);
    if (!entry || entry.type !== 'file') throw new Error('请选择需要打开的文件');
    const target = await uniqueChildPath(libraryTempRoot, path.basename(entry.path));
    await extractLibraryEntry(manifest, entry, target);
    const error = await shell.openPath(target);
    if (error) throw new Error(error);
    return { ok: true };
  });
  ipcMain.handle('library:reveal', async (_event, relative) => {
    requireInner();
    if (!relative) throw new Error('请选择资料');
    throw new Error('封存资料没有可定位的明文文件，请使用打开或提取');
  });
  ipcMain.handle('library:export', async (_event, relative) => {
    requireInner();
    const manifest = await getLibraryManifest();
    const entry = libraryEntry(manifest, relative);
    if (!entry) throw new Error('请选择需要提取的文件或文件夹');
    const picked = await dialog.showOpenDialog(mainWindow, { title: '选择提取位置', properties: ['openDirectory', 'createDirectory'] });
    if (picked.canceled || !picked.filePaths[0]) return null;
    const destinationDirectory = path.resolve(picked.filePaths[0]);
    const root = path.resolve(libraryRoot);
    if (destinationDirectory === root || destinationDirectory.startsWith(`${root}${path.sep}`)) throw new Error('提取位置不能位于资料仓库内部');
    const target = await uniqueChildPath(destinationDirectory, path.basename(entry.path));
    await extractLibraryEntry(manifest, entry, target);
    return { path: target, directory: entry.type === 'directory' };
  });

  ipcMain.handle('vault:export', async () => {
    requireInner();
    const picked = await dialog.showSaveDialog(mainWindow, {
      title: '导出 Gobsmacked 资料库',
      defaultPath: `Gobsmacked-Vault-${new Date().toISOString().slice(0, 10)}.zip`,
      filters: [{ name: 'ZIP 压缩包', extensions: ['zip'] }]
    });
    if (picked.canceled || !picked.filePath) return null;
    const checksums = {};
    async function walk(dir, prefix = '') {
      const result = [];
      for (const entry of await fsp.readdir(dir, { withFileTypes: true })) {
        const absolute = path.join(dir, entry.name);
        const relative = path.posix.join(prefix, entry.name);
        if (entry.isDirectory()) result.push(...await walk(absolute, relative));
        else result.push({ absolute, relative });
      }
      return result;
    }
    const files = await walk(vaultRoot);
    async function hashFile(file) {
      const hash = crypto.createHash('sha256');
      for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
      return hash.digest('hex');
    }
    for (const file of files) {
      checksums[file.relative] = await hashFile(file.absolute);
    }
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(picked.filePath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      output.on('close', resolve); archive.on('error', reject);
      archive.pipe(output);
      for (const file of files) archive.file(file.absolute, { name: `vault/${file.relative}` });
      archive.append(`${JSON.stringify({ algorithm: 'sha256', files: checksums }, null, 2)}\n`, { name: 'checksums.json' });
      archive.append('Gobsmacked 资料库导出包。恢复时请保留 vault 目录结构，并先核对 checksums.json。\n', { name: 'README.txt' });
      archive.finalize();
    });
    return { filePath: picked.filePath, fileCount: files.length };
  });
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    await initializeVault();
    const currentSession = require('electron').session.defaultSession;
    const isMainFrameAudioRequest = (webContents, permission, details = {}) => {
      if (!webContents || webContents !== mainWindow?.webContents || permission !== 'media') return false;
      if (details.requestingUrl && !details.requestingUrl.startsWith('file://')) return false;
      if (Array.isArray(details.mediaTypes)) return details.mediaTypes.includes('audio') && !details.mediaTypes.includes('video');
      return details.mediaType === 'audio' || details.mediaType === undefined;
    };
    currentSession.setPermissionCheckHandler((webContents, permission, _origin, details) => isMainFrameAudioRequest(webContents, permission, details));
    currentSession.setPermissionRequestHandler((webContents, permission, callback, details) => callback(isMainFrameAudioRequest(webContents, permission, details)));
    protocol.handle('gob-media', (request) => {
      if (!mainUnlocked) return new Response('Locked', { status: 403 });
      const url = new URL(request.url);
      const candidate = safeAssetName(decodeURIComponent(url.hostname || url.pathname.replace(/^\//, '')));
      if (!candidate) return new Response('Not found', { status: 404 });
      return net.fetch(pathToFileURL(path.join(vaultRoot, 'assets', candidate)).toString());
    });
    registerIpc();
    await createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
      else { mainWindow?.show(); mainWindow?.focus(); }
    });
  }).catch((error) => {
    dialog.showErrorBox('Gobsmacked 无法启动', error?.stack || String(error));
    app.quit();
  });
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => {
  lockArchiveKey();
  if (libraryTempRoot) fs.rmSync(libraryTempRoot, { recursive: true, force: true });
});
