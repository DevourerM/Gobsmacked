const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { Transform, Writable } = require('node:stream');
const { pipeline } = require('node:stream/promises');

const MAGIC = Buffer.from('GOBSEAL1');
const NONCE_BYTES = 12;
const TAG_BYTES = 16;
const HEADER_BYTES = MAGIC.length + NONCE_BYTES;
const OBJECT_AAD = Buffer.from('cn.dxr.gobsmacked.sealed-object.v1');
const MANIFEST_AAD = Buffer.from('cn.dxr.gobsmacked.sealed-manifest.v1');

function assertKey(key) {
  if (!Buffer.isBuffer(key) || key.length !== 32) throw new Error('封存密钥无效');
}

function normalizeVirtualPath(value = '') {
  const normalized = String(value).replaceAll('\\', '/').split('/').filter(Boolean).join('/');
  if (!normalized) return '';
  if (normalized.split('/').some((part) => part === '.' || part === '..' || part.includes('\0'))) throw new Error('档案路径无效');
  return normalized;
}

function blankManifest() {
  return {
    schema: 'cn.dxr.gobsmacked-sealed-library',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    entries: []
  };
}

async function writeAll(handle, buffer) {
  let offset = 0;
  while (offset < buffer.length) {
    const { bytesWritten } = await handle.write(buffer, offset, buffer.length - offset, null);
    if (!bytesWritten) throw new Error('封存写入中断');
    offset += bytesWritten;
  }
}

function encryptBuffer(input, key, aad) {
  assertKey(key);
  const nonce = crypto.randomBytes(NONCE_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(input), cipher.final()]);
  return Buffer.concat([MAGIC, nonce, ciphertext, cipher.getAuthTag()]);
}

function decryptBuffer(input, key, aad) {
  assertKey(key);
  if (input.length < HEADER_BYTES + TAG_BYTES || !input.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error('密文格式无效');
  const nonce = input.subarray(MAGIC.length, HEADER_BYTES);
  const tag = input.subarray(input.length - TAG_BYTES);
  const ciphertext = input.subarray(HEADER_BYTES, input.length - TAG_BYTES);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAAD(aad);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

async function atomicBuffer(file, buffer) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fsp.writeFile(temporary, buffer);
  await fsp.rename(temporary, file);
}

async function loadManifest(root, key) {
  const file = path.join(root, 'manifest.gobseal');
  try {
    const parsed = JSON.parse(decryptBuffer(await fsp.readFile(file), key, MANIFEST_AAD).toString('utf8'));
    if (parsed?.schema !== 'cn.dxr.gobsmacked-sealed-library' || parsed.version !== 1 || !Array.isArray(parsed.entries)) {
      throw new Error('封存清单结构无效');
    }
    parsed.entries = parsed.entries.map((entry) => ({ ...entry, path: normalizeVirtualPath(entry.path) }));
    return parsed;
  } catch (error) {
    if (error?.code === 'ENOENT') return blankManifest();
    throw error;
  }
}

async function saveManifest(root, key, manifest) {
  const normalized = {
    ...manifest,
    schema: 'cn.dxr.gobsmacked-sealed-library',
    version: 1,
    updatedAt: new Date().toISOString(),
    entries: [...manifest.entries].sort((left, right) => left.path.localeCompare(right.path, 'zh-CN'))
  };
  const encrypted = encryptBuffer(Buffer.from(`${JSON.stringify(normalized)}\n`, 'utf8'), key, MANIFEST_AAD);
  await atomicBuffer(path.join(root, 'manifest.gobseal'), encrypted);
  const files = normalized.entries.filter((entry) => entry.type === 'file');
  const publicInfo = {
    schema: 'cn.dxr.gobsmacked-sealed-library-info',
    version: 1,
    encryption: 'AES-256-GCM',
    keyProtection: normalized.keyProtection || 'windows-user-dpapi-v1',
    ...(normalized.kdf ? { kdf: normalized.kdf } : {}),
    files: files.length,
    directories: normalized.entries.filter((entry) => entry.type === 'directory').length,
    bytes: files.reduce((sum, entry) => sum + Number(entry.size || 0), 0),
    updatedAt: normalized.updatedAt
  };
  await atomicBuffer(path.join(root, 'archive.info'), Buffer.from(`${JSON.stringify(publicInfo, null, 2)}\n`, 'utf8'));
  return normalized;
}

async function rekeyObject(sourceRoot, destinationRoot, objectId, oldKey, newKey, expected = {}) {
  assertKey(oldKey); assertKey(newKey);
  if (!/^[a-f0-9]{64}\.gse$/.test(String(objectId))) throw new Error('密文对象编号无效');
  if (!/^[a-f0-9]{64}$/.test(String(expected.sha256)) || !Number.isFinite(expected.size)) {
    throw new Error('换钥清单缺少完整性信息');
  }
  const newObjectId = `${crypto.createHmac('sha256', newKey).update(expected.sha256).digest('hex')}.gse`;
  const destinationObjects = path.join(destinationRoot, 'objects');
  const destination = path.join(destinationObjects, newObjectId);
  await fsp.mkdir(destinationObjects, { recursive: true });
  if (fs.existsSync(destination)) {
    await decryptObject(destinationRoot, newObjectId, null, newKey, expected);
    return { objectId: newObjectId, sha256: expected.sha256, size: expected.size, resumed: true };
  }

  const source = path.join(sourceRoot, 'objects', objectId);
  const stat = await fsp.stat(source);
  if (stat.size < HEADER_BYTES + TAG_BYTES) throw new Error('密文对象已损坏');
  const handle = await fsp.open(source, 'r');
  const header = Buffer.alloc(HEADER_BYTES); const tag = Buffer.alloc(TAG_BYTES);
  await handle.read(header, 0, header.length, 0);
  await handle.read(tag, 0, tag.length, stat.size - TAG_BYTES);
  await handle.close();
  if (!header.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error('密文对象格式无效');

  const oldDecipher = crypto.createDecipheriv('aes-256-gcm', oldKey, header.subarray(MAGIC.length));
  oldDecipher.setAAD(OBJECT_AAD); oldDecipher.setAuthTag(tag);
  const newNonce = crypto.randomBytes(NONCE_BYTES);
  const newCipher = crypto.createCipheriv('aes-256-gcm', newKey, newNonce);
  newCipher.setAAD(OBJECT_AAD);
  const hash = crypto.createHash('sha256'); let size = 0;
  const meter = new Transform({ transform(chunk, _encoding, callback) { hash.update(chunk); size += chunk.length; callback(null, chunk); } });
  const temporary = path.join(destinationObjects, `.pending-${crypto.randomUUID()}`);
  let output;
  try {
    output = await fsp.open(temporary, 'wx');
    await writeAll(output, Buffer.concat([MAGIC, newNonce]));
    await output.close(); output = null;
    const ciphertextBytes = stat.size - HEADER_BYTES - TAG_BYTES;
    if (ciphertextBytes === 0) {
      const plainFinal = oldDecipher.final();
      if (plainFinal.length) { hash.update(plainFinal); size += plainFinal.length; }
      const encrypted = Buffer.concat([newCipher.update(plainFinal), newCipher.final(), newCipher.getAuthTag()]);
      await fsp.appendFile(temporary, encrypted);
    } else {
      await pipeline(
        fs.createReadStream(source, { start: HEADER_BYTES, end: stat.size - TAG_BYTES - 1 }),
        oldDecipher, meter, newCipher,
        fs.createWriteStream(temporary, { flags: 'a' })
      );
      await fsp.appendFile(temporary, newCipher.getAuthTag());
    }
    const sha256 = hash.digest('hex');
    if (sha256 !== expected.sha256 || size !== expected.size) throw new Error('换钥后完整性校验失败');
    await fsp.rename(temporary, destination);
    return { objectId: newObjectId, sha256, size, resumed: false };
  } catch (error) {
    await output?.close().catch(() => undefined);
    await fsp.rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
}

async function encryptFile(source, root, key) {
  assertKey(key);
  const objects = path.join(root, 'objects');
  await fsp.mkdir(objects, { recursive: true });
  const temporary = path.join(objects, `.pending-${crypto.randomUUID()}`);
  const nonce = crypto.randomBytes(NONCE_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
  cipher.setAAD(OBJECT_AAD);
  const hash = crypto.createHash('sha256');
  let size = 0;
  let handle;
  try {
    handle = await fsp.open(temporary, 'wx');
    await writeAll(handle, Buffer.concat([MAGIC, nonce]));
    for await (const chunk of fs.createReadStream(source)) {
      hash.update(chunk); size += chunk.length;
      const encrypted = cipher.update(chunk);
      if (encrypted.length) await writeAll(handle, encrypted);
    }
    const final = cipher.final();
    if (final.length) await writeAll(handle, final);
    await writeAll(handle, cipher.getAuthTag());
    await handle.sync(); await handle.close(); handle = null;
    const sha256 = hash.digest('hex');
    const objectId = `${crypto.createHmac('sha256', key).update(sha256).digest('hex')}.gse`;
    const destination = path.join(objects, objectId);
    if (fs.existsSync(destination)) await fsp.rm(temporary, { force: true });
    else await fsp.rename(temporary, destination);
    return { objectId, sha256, size };
  } catch (error) {
    await handle?.close().catch(() => undefined);
    await fsp.rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
}

async function decryptObject(root, objectId, destination, key, expected = {}, onProgress = null) {
  assertKey(key);
  if (!/^[a-f0-9]{64}\.gse$/.test(String(objectId))) throw new Error('密文对象编号无效');
  const source = path.join(root, 'objects', objectId);
  const stat = await fsp.stat(source);
  if (stat.size < HEADER_BYTES + TAG_BYTES) throw new Error('密文对象已损坏');
  const handle = await fsp.open(source, 'r');
  const header = Buffer.alloc(HEADER_BYTES);
  const tag = Buffer.alloc(TAG_BYTES);
  await handle.read(header, 0, header.length, 0);
  await handle.read(tag, 0, tag.length, stat.size - TAG_BYTES);
  await handle.close();
  if (!header.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error('密文对象格式无效');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, header.subarray(MAGIC.length));
  decipher.setAAD(OBJECT_AAD); decipher.setAuthTag(tag);
  const hash = crypto.createHash('sha256'); let size = 0;
  const meter = new Transform({ transform(chunk, _encoding, callback) { hash.update(chunk); size += chunk.length; onProgress?.(chunk.length); callback(null, chunk); } });
  const temporary = destination ? `${destination}.${process.pid}.${Date.now()}.tmp` : null;
  if (temporary) await fsp.mkdir(path.dirname(destination), { recursive: true });
  try {
    const ciphertextBytes = stat.size - HEADER_BYTES - TAG_BYTES;
    if (ciphertextBytes === 0) {
      const final = decipher.final();
      if (final.length) { hash.update(final); size += final.length; onProgress?.(final.length); }
      if (temporary) await fsp.writeFile(temporary, final, { flag: 'wx' });
    } else {
      const sink = temporary
        ? fs.createWriteStream(temporary, { flags: 'wx' })
        : new Writable({ write(_chunk, _encoding, callback) { callback(); } });
      await pipeline(fs.createReadStream(source, { start: HEADER_BYTES, end: stat.size - TAG_BYTES - 1 }), decipher, meter, sink);
    }
    const sha256 = hash.digest('hex');
    if (expected.sha256 && sha256 !== expected.sha256) throw new Error('解密哈希不匹配');
    if (Number.isFinite(expected.size) && size !== expected.size) throw new Error('解密大小不匹配');
    if (temporary) await fsp.rename(temporary, destination);
    return { sha256, size };
  } catch (error) {
    if (temporary) await fsp.rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
}

function manifestSummary(manifest) {
  const files = manifest.entries.filter((entry) => entry.type === 'file');
  return {
    files: files.length,
    directories: manifest.entries.filter((entry) => entry.type === 'directory').length,
    bytes: files.reduce((sum, entry) => sum + Number(entry.size || 0), 0)
  };
}

function listChildren(manifest, relative = '', query = '') {
  const parent = normalizeVirtualPath(relative);
  const prefix = parent ? `${parent}/` : '';
  const lowered = String(query || '').trim().toLocaleLowerCase('zh-CN');
  return manifest.entries.filter((entry) => {
    if (!entry.path.startsWith(prefix)) return false;
    const remainder = entry.path.slice(prefix.length);
    if (!remainder || remainder.includes('/')) return false;
    return !lowered || remainder.toLocaleLowerCase('zh-CN').includes(lowered);
  }).sort((left, right) => Number(right.type === 'directory') - Number(left.type === 'directory') || left.path.localeCompare(right.path, 'zh-CN'));
}

module.exports = {
  blankManifest, normalizeVirtualPath, loadManifest, saveManifest,
  encryptFile, decryptObject, rekeyObject, manifestSummary, listChildren
};
