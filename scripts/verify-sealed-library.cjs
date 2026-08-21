const { app, safeStorage } = require('electron');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const {
  loadManifest, decryptObject, manifestSummary, listChildren
} = require('../src/sealed-library.cjs');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');

function argument(name) {
  const index = process.argv.indexOf(name);
  if (index < 0 || !process.argv[index + 1]) throw new Error(`缺少 ${name}`);
  return path.resolve(process.argv[index + 1]);
}

async function run() {
  const archive = argument('--archive');
  const keyFile = argument('--key-file');
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Windows 账户保护不可用');
  const key = Buffer.from(safeStorage.decryptString(await fsp.readFile(keyFile)), 'base64');
  if (key.length !== 32) throw new Error('封存密钥无效');
  const manifest = await loadManifest(archive, key);
  const files = manifest.entries.filter((entry) => entry.type === 'file');
  const samples = [files.find((entry) => entry.size === 0), files.find((entry) => entry.size > 0 && entry.size < 1024 * 1024)].filter(Boolean);
  const temporary = await fsp.mkdtemp(path.join(os.tmpdir(), 'Gobsmacked-verify-'));
  try {
    for (let index = 0; index < samples.length; index += 1) {
      await decryptObject(archive, samples[index].objectId, path.join(temporary, `sample-${index}`), key, samples[index]);
    }
  } finally {
    await fsp.rm(temporary, { recursive: true, force: true });
    key.fill(0);
  }
  const objectNames = (await fsp.readdir(path.join(archive, 'objects'))).filter((name) => name.endsWith('.gse'));
  if (objectNames.some((name) => !/^[a-f0-9]{64}\.gse$/.test(name))) throw new Error('密文对象目录含有可疑名称');
  console.log(JSON.stringify({
    verified: true,
    ...manifestSummary(manifest),
    encryptedObjects: objectNames.length,
    rootEntries: listChildren(manifest, '').length,
    sampleDecryptions: samples.length,
    manifestEncrypted: fs.existsSync(path.join(archive, 'manifest.gobseal'))
  }, null, 2));
}

app.whenReady().then(run).then(() => app.quit()).catch((error) => {
  console.error(error?.stack || String(error));
  app.exit(1);
});
