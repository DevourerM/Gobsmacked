const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const {
  blankManifest, loadManifest, saveManifest, encryptFile, decryptObject, rekeyObject,
  manifestSummary, listChildren
} = require('../src/sealed-library.cjs');
const { ARCHIVE_KEY_MODE, ARCHIVE_KEY_CONTEXT, deriveArchiveKey } = require('../src/archive-key.cjs');

test('封存资料使用密文对象并可完整解密', async (context) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'gobsmacked-seal-'));
  context.after(() => fs.rm(root, { recursive: true, force: true }));
  const key = crypto.randomBytes(32);
  const source = path.join(root, 'source.txt');
  const restored = path.join(root, 'restored.txt');
  await fs.writeFile(source, '不能从密文直接读取的内容', 'utf8');
  const encrypted = await encryptFile(source, path.join(root, 'archive'), key);
  const raw = await fs.readFile(path.join(root, 'archive', 'objects', encrypted.objectId));
  assert.equal(raw.includes(Buffer.from('不能从密文直接读取的内容')), false);
  let progressed = 0;
  await decryptObject(path.join(root, 'archive'), encrypted.objectId, restored, key, encrypted, (bytes) => { progressed += bytes; });
  assert.equal(progressed, encrypted.size);
  assert.equal(await fs.readFile(restored, 'utf8'), '不能从密文直接读取的内容');
});

test('封存清单本身加密并支持虚拟目录浏览', async (context) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'gobsmacked-manifest-'));
  context.after(() => fs.rm(root, { recursive: true, force: true }));
  const key = crypto.randomBytes(32);
  const manifest = blankManifest();
  manifest.entries = [
    { path: '示例档案', type: 'directory', modifiedAt: new Date(0).toISOString() },
    { path: '示例档案/记录.txt', type: 'file', size: 8, sha256: 'a', objectId: `${'a'.repeat(64)}.gse`, modifiedAt: new Date(0).toISOString() }
  ];
  await saveManifest(root, key, manifest);
  const raw = await fs.readFile(path.join(root, 'manifest.gobseal'));
  assert.equal(raw.includes(Buffer.from('示例档案')), false);
  const loaded = await loadManifest(root, key);
  assert.deepEqual(manifestSummary(loaded), { files: 1, directories: 1, bytes: 8 });
  assert.deepEqual(listChildren(loaded, '').map((entry) => entry.path), ['示例档案']);
  assert.deepEqual(listChildren(loaded, '示例档案').map((entry) => entry.path), ['示例档案/记录.txt']);
});

test('封存与校验兼容空文件', async (context) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'gobsmacked-empty-'));
  context.after(() => fs.rm(root, { recursive: true, force: true }));
  const key = crypto.randomBytes(32);
  const source = path.join(root, 'empty.bin');
  const restored = path.join(root, 'restored.bin');
  await fs.writeFile(source, Buffer.alloc(0));
  const encrypted = await encryptFile(source, path.join(root, 'archive'), key);
  assert.equal(encrypted.size, 0);
  await decryptObject(path.join(root, 'archive'), encrypted.objectId, restored, key, encrypted);
  assert.equal((await fs.stat(restored)).size, 0);
});

test('历史密匙与固定地理上下文派生 256 位档案密钥', () => {
  const key = deriveArchiveKey('示例历史密匙', 'a'.repeat(48));
  assert.equal(key.length, 32);
  assert.equal(ARCHIVE_KEY_CONTEXT, '中国河南省焦作市|LAT=35.25|LON=113.23|0722');
  key.fill(0);
});

test('换钥过程不落盘明文并可以新密钥复原', async (context) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'gobsmacked-rekey-'));
  context.after(() => fs.rm(root, { recursive: true, force: true }));
  const oldRoot = path.join(root, 'old'); const nextRoot = path.join(root, 'next');
  const source = path.join(root, 'source.bin'); const restored = path.join(root, 'restored.bin');
  const oldKey = crypto.randomBytes(32); const newKey = crypto.randomBytes(32);
  await fs.writeFile(source, crypto.randomBytes(1024 * 128 + 7));
  const oldEntry = await encryptFile(source, oldRoot, oldKey);
  const nextEntry = await rekeyObject(oldRoot, nextRoot, oldEntry.objectId, oldKey, newKey, oldEntry);
  assert.notEqual(nextEntry.objectId, oldEntry.objectId);
  await decryptObject(nextRoot, nextEntry.objectId, restored, newKey, nextEntry);
  assert.deepEqual(await fs.readFile(restored), await fs.readFile(source));
  const manifest = blankManifest();
  manifest.keyProtection = ARCHIVE_KEY_MODE;
  manifest.entries = [{ path: 'sample.bin', type: 'file', ...nextEntry }];
  await saveManifest(nextRoot, newKey, manifest);
  const info = JSON.parse(await fs.readFile(path.join(nextRoot, 'archive.info'), 'utf8'));
  assert.equal(info.keyProtection, ARCHIVE_KEY_MODE);
});
