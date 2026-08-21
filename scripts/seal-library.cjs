const { app, safeStorage } = require('electron');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const {
  blankManifest, loadManifest, saveManifest, encryptFile, decryptObject, manifestSummary
} = require('../src/sealed-library.cjs');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');

function parseArguments(argv) {
  const options = { apply: false, deleteSource: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--apply') options.apply = true;
    else if (value === '--delete-source') options.deleteSource = true;
    else if (/seal-library\.cjs$/i.test(value) || value.startsWith('--disable-gpu') || value === '--disable-software-rasterizer') continue;
    else if (value === '--source') options.source = path.resolve(argv[++index]);
    else if (value === '--archive') options.archive = path.resolve(argv[++index]);
    else if (value === '--key-file') options.keyFile = path.resolve(argv[++index]);
    else if (value === '--report') options.report = path.resolve(argv[++index]);
    else throw new Error(`未知参数：${value}`);
  }
  for (const key of ['source', 'archive', 'keyFile', 'report']) if (!options[key]) throw new Error(`缺少 --${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`);
  return options;
}

async function atomicBuffer(file, buffer) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fsp.writeFile(temporary, buffer);
  await fsp.rename(temporary, file);
}

async function getOrCreateKey(file, allowCreate) {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Windows 账户保护不可用，已停止封存');
  if (fs.existsSync(file)) {
    const key = Buffer.from(safeStorage.decryptString(await fsp.readFile(file)), 'base64');
    if (key.length !== 32) throw new Error('现有封存密钥无效');
    return key;
  }
  if (!allowCreate) return null;
  const key = crypto.randomBytes(32);
  await atomicBuffer(file, safeStorage.encryptString(key.toString('base64')));
  return key;
}

async function walk(root) {
  const output = [];
  const pending = [{ absolute: root, relative: '' }];
  while (pending.length) {
    const current = pending.pop();
    const children = await fsp.readdir(current.absolute, { withFileTypes: true });
    for (const child of children.sort((left, right) => right.name.localeCompare(left.name, 'zh-CN'))) {
      const absolute = path.join(current.absolute, child.name);
      const relative = current.relative ? `${current.relative}/${child.name}` : child.name;
      const stat = await fsp.stat(absolute);
      if (child.isDirectory()) {
        output.push({ absolute, relative, type: 'directory', modifiedAt: stat.mtime.toISOString() });
        pending.push({ absolute, relative });
      } else if (child.isFile()) {
        output.push({ absolute, relative, type: 'file', size: stat.size, modifiedAt: stat.mtime.toISOString() });
      }
    }
  }
  return output.sort((left, right) => left.relative.localeCompare(right.relative, 'zh-CN'));
}

async function hashFile(file) {
  const hash = crypto.createHash('sha256'); let size = 0;
  for await (const chunk of fs.createReadStream(file)) { hash.update(chunk); size += chunk.length; }
  return { sha256: hash.digest('hex'), size };
}

function progress(stage, done, total, bytes, totalBytes) {
  process.stdout.write(`${JSON.stringify({ stage, done, total, bytes, totalBytes, percent: totalBytes ? Number((bytes / totalBytes * 100).toFixed(2)) : 100 })}\n`);
}

async function writeReport(options, report) {
  await atomicBuffer(options.report, Buffer.from(`${JSON.stringify(report, null, 2)}\n`, 'utf8'));
}

async function run() {
  const options = parseArguments(process.argv.slice(2));
  const source = path.resolve(options.source);
  const archive = path.resolve(options.archive);
  if (!fs.existsSync(source) || !(await fsp.stat(source)).isDirectory()) throw new Error(`明文资料目录不存在：${source}`);
  if (archive === source || archive.startsWith(`${source}${path.sep}`) || source.startsWith(`${archive}${path.sep}`)) throw new Error('明文目录与密文仓库必须完全分离');
  const inventory = await walk(source);
  const files = inventory.filter((entry) => entry.type === 'file');
  const directories = inventory.filter((entry) => entry.type === 'directory');
  const totalBytes = files.reduce((sum, entry) => sum + entry.size, 0);
  const baseReport = {
    schema: 'cn.dxr.gobsmacked-sealing-report', version: 1,
    generatedAt: new Date().toISOString(), source, archive,
    encryption: 'AES-256-GCM', keyProtection: 'Windows current user (safeStorage)',
    inventory: { files: files.length, directories: directories.length, bytes: totalBytes }
  };
  if (!options.apply) {
    await writeReport(options, { ...baseReport, mode: 'dry-run', verified: false, sourceDeleted: false });
    console.log(JSON.stringify({ mode: 'dry-run', ...baseReport.inventory }, null, 2));
    return;
  }

  await fsp.mkdir(archive, { recursive: true });
  const key = await getOrCreateKey(options.keyFile, true);
  const existing = await loadManifest(archive, key);
  let manifest;
  if (existing.entries.length) {
    const summary = manifestSummary(existing);
    const complete = summary.files === files.length && summary.directories === directories.length && summary.bytes === totalBytes
      && files.every((file) => existing.entries.some((entry) => entry.type === 'file' && entry.path === file.relative && entry.size === file.size));
    if (!complete) throw new Error('现有密文清单与明文盘点不一致，已停止以避免覆盖');
    manifest = existing;
    progress('resume', files.length, files.length, totalBytes, totalBytes);
  } else {
    manifest = blankManifest();
    manifest.entries.push(...directories.map((entry) => ({ path: entry.relative, type: 'directory', modifiedAt: entry.modifiedAt })));
    let encryptedBytes = 0;
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const encrypted = await encryptFile(file.absolute, archive, key);
      manifest.entries.push({ path: file.relative, type: 'file', modifiedAt: file.modifiedAt, ...encrypted });
      encryptedBytes += file.size;
      if ((index + 1) % 200 === 0 || encryptedBytes === totalBytes) progress('encrypt', index + 1, files.length, encryptedBytes, totalBytes);
    }
    await saveManifest(archive, key, manifest);
  }

  let verifiedBytes = 0;
  for (let index = 0; index < files.length; index += 1) {
    const sourceEntry = files[index];
    const sealedEntry = manifest.entries.find((entry) => entry.path === sourceEntry.relative && entry.type === 'file');
    if (!sealedEntry) throw new Error(`封存清单缺失：${sourceEntry.relative}`);
    const current = await hashFile(sourceEntry.absolute);
    if (current.size !== sealedEntry.size || current.sha256 !== sealedEntry.sha256) throw new Error(`明文在封存期间发生变化：${sourceEntry.relative}`);
    await decryptObject(archive, sealedEntry.objectId, null, key, sealedEntry);
    verifiedBytes += sealedEntry.size;
    if ((index + 1) % 200 === 0 || verifiedBytes === totalBytes) progress('verify', index + 1, files.length, verifiedBytes, totalBytes);
  }

  const reopened = await loadManifest(archive, key);
  const summary = manifestSummary(reopened);
  if (summary.files !== files.length || summary.directories !== directories.length || summary.bytes !== totalBytes) throw new Error('封存清单复核不一致');
  let sourceDeleted = false;
  if (options.deleteSource) {
    if (path.basename(source) !== 'Gobsmacked.Library') throw new Error('删除目标名称校验失败');
    const parent = path.dirname(source);
    if (source !== path.join(parent, 'Gobsmacked.Library')) throw new Error('删除目标路径校验失败');
    await fsp.rm(source, { recursive: true, force: false, maxRetries: 3, retryDelay: 500 });
    sourceDeleted = !fs.existsSync(source);
    if (!sourceDeleted) throw new Error('明文资料目录未能删除');
  }
  await writeReport(options, {
    ...baseReport, mode: 'applied', verified: true, verifiedAt: new Date().toISOString(),
    sealed: summary, sourceDeleted, keyFile: options.keyFile
  });
  key.fill(0);
  console.log(JSON.stringify({ mode: 'applied', verified: true, sourceDeleted, ...summary, report: options.report }, null, 2));
}

app.whenReady().then(run).then(() => app.quit()).catch((error) => {
  console.error(error?.stack || String(error));
  app.exit(1);
});
