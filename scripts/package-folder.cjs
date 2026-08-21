const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const stageRoot = path.join(projectRoot, '.gobsmacked-build');
const builtFolder = path.join(stageRoot, 'win-unpacked');
const manifestPath = path.join(projectRoot, '.gobsmacked-runtime-files.json');

function assertDirectChild(target, exactName) {
  if (path.dirname(target) !== projectRoot || path.basename(target) !== exactName) {
    throw new Error(`拒绝操作未通过路径校验的目录：${target}`);
  }
}

function resolveRuntimeFile(relative) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative)) {
    throw new Error(`非法运行文件路径：${relative}`);
  }
  const target = path.resolve(projectRoot, relative);
  if (!target.startsWith(`${projectRoot}${path.sep}`)) {
    throw new Error(`运行文件超出项目目录：${relative}`);
  }
  return target;
}

function listFiles(folder, base = folder) {
  const files = [];
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const absolute = path.join(folder, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(absolute, base));
    else if (entry.isFile()) files.push(path.relative(base, absolute).split(path.sep).join('/'));
  }
  return files;
}

function readPreviousFiles() {
  if (!fs.existsSync(manifestPath)) return [];
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest?.schema !== 'cn.dxr.gobsmacked-runtime-files' || !Array.isArray(manifest.files)) {
    throw new Error('旧运行文件清单无效，已停止更新以保护项目文件。');
  }
  return manifest.files;
}

assertDirectChild(stageRoot, '.gobsmacked-build');
fs.rmSync(stageRoot, { recursive: true, force: true });

const builderCli = require.resolve('electron-builder/cli.js');
const result = spawnSync(process.execPath, [builderCli, '--dir'], { cwd: projectRoot, stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0 || !fs.existsSync(path.join(builtFolder, 'Gobsmacked.exe'))) {
  fs.rmSync(stageRoot, { recursive: true, force: true });
  process.exit(result.status || 1);
}

const previousFiles = readPreviousFiles();
const previousSet = new Set(previousFiles);
const nextFiles = listFiles(builtFolder);

for (const relative of nextFiles) {
  const target = resolveRuntimeFile(relative);
  if (fs.existsSync(target) && !previousSet.has(relative)) {
    throw new Error(`运行文件与项目中的既有文件冲突，已停止覆盖：${relative}`);
  }
}

for (const relative of previousFiles) {
  const target = resolveRuntimeFile(relative);
  if (fs.existsSync(target) && fs.statSync(target).isFile()) fs.rmSync(target, { force: true });
}

const oldDirectories = [...new Set(previousFiles.map((relative) => path.dirname(relative)).filter((value) => value !== '.'))]
  .sort((a, b) => b.split(/[\\/]/).length - a.split(/[\\/]/).length);
for (const relative of oldDirectories) {
  const target = resolveRuntimeFile(relative);
  try { fs.rmdirSync(target); } catch (error) { if (error.code !== 'ENOENT' && error.code !== 'ENOTEMPTY') throw error; }
}

for (const relative of nextFiles) {
  const source = path.join(builtFolder, ...relative.split('/'));
  const target = resolveRuntimeFile(relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

const manifest = {
  schema: 'cn.dxr.gobsmacked-runtime-files',
  version: 1,
  generatedAt: new Date().toISOString(),
  files: nextFiles
};
const temporaryManifest = `${manifestPath}.tmp`;
fs.writeFileSync(temporaryManifest, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.renameSync(temporaryManifest, manifestPath);
fs.rmSync(stageRoot, { recursive: true, force: true });
console.log(`\nGobsmacked 已生成：${path.join(projectRoot, 'Gobsmacked.exe')}`);
