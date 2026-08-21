const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const {
  blankManifest, loadManifest, saveManifest, encryptFile, decryptObject,
  manifestSummary, listChildren
} = require('../src/sealed-library.cjs');

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
  await decryptObject(path.join(root, 'archive'), encrypted.objectId, restored, key, encrypted);
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
