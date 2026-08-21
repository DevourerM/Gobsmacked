const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const {
  emptyRecord, normalizeRecord, parseLegacyDiary
} = require('../src/domain.cjs');

function parseArguments(argv) {
  const result = { apply: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--apply') result.apply = true;
    else if (value === '--source') result.source = argv[++index];
    else if (value === '--year') result.year = argv[++index];
    else if (value === '--vault') result.vault = argv[++index];
    else if (value === '--library') result.library = argv[++index];
    else if (value === '--report') result.report = argv[++index];
    else throw new Error(`未知参数：${value}`);
  }
  for (const key of ['source', 'year', 'vault', 'library']) {
    if (!result[key]) throw new Error(`缺少 --${key}`);
  }
  result.source = path.resolve(result.source);
  result.vault = path.resolve(result.vault);
  result.library = path.resolve(result.library);
  result.report = path.resolve(result.report || path.join(process.cwd(), `${result.year}日记-导入报告.json`));
  return result;
}

function stableId(prefix, value) {
  return `${prefix}_${crypto.createHash('sha256').update(value).digest('hex').slice(0, 20)}`;
}

function dateCreatedAt(date) {
  return new Date(`${date}T23:00:00+08:00`).toISOString();
}

async function exists(file) {
  try { await fsp.access(file); return true; } catch { return false; }
}

async function readJson(file) {
  return JSON.parse(await fsp.readFile(file, 'utf8'));
}

async function atomicJson(file, value) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fsp.writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fsp.rename(temp, file);
}

async function hashFile(file) {
  const hash = crypto.createHash('sha256');
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(file);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', resolve);
  });
  return hash.digest('hex');
}

function recordFile(vault, date) {
  return path.join(vault, 'records', 'day', date.slice(0, 4), `${date}.gob`);
}

function paragraph(sourceHash, date, text) {
  return {
    id: stableId('paragraph', `${sourceHash}:${date}`),
    type: 'paragraph',
    text,
    voices: [],
    images: []
  };
}

function hasMedia(block) {
  return (block.voices?.length || 0) > 0 || (block.images?.length || 0) > 0;
}

function mergeEntry(existing, entry, sourceHash) {
  const incoming = paragraph(sourceHash, entry.date, entry.text);
  if (!existing) {
    const record = emptyRecord('day', entry.date);
    record.createdAt = dateCreatedAt(entry.date);
    record.blocks = [incoming];
    return { action: 'created', record: normalizeRecord(record, 'day', entry.date) };
  }

  const record = normalizeRecord(existing, 'day', entry.date);
  const importedIndex = record.blocks.findIndex((block) => block.type === 'paragraph' && block.id === incoming.id);
  if (importedIndex >= 0) {
    if (record.blocks[importedIndex].text.trim() === entry.text.trim()) return { action: 'unchanged', record: existing };
    record.blocks[importedIndex] = incoming;
    return { action: 'corrected', record: normalizeRecord(record, 'day', entry.date) };
  }
  const sameText = record.blocks.some((block) => block.type === 'paragraph' && block.text.trim() === entry.text.trim());
  if (sameText) return { action: 'unchanged', record: existing };

  const meaningful = record.blocks.filter((block) => block.type !== 'paragraph' || block.text.trim() || hasMedia(block));
  record.blocks = meaningful.length === 0 ? [incoming] : [...record.blocks, incoming];
  return { action: meaningful.length === 0 ? 'filledBlank' : 'merged', record: normalizeRecord(record, 'day', entry.date) };
}

async function chooseArchivePath(library, source, sourceHash) {
  const directory = path.join(library, '日记原稿');
  const extension = path.extname(source);
  const stem = path.basename(source, extension);
  for (let index = 1; ; index += 1) {
    const name = index === 1 ? `${stem}${extension}` : `${stem} (${index})${extension}`;
    const destination = path.join(directory, name);
    if (!await exists(destination)) return { destination, alreadyArchived: false };
    if (await hashFile(destination) === sourceHash) return { destination, alreadyArchived: true };
  }
}

async function buildPlan(options) {
  const content = await fsp.readFile(options.source, 'utf8');
  const sourceHash = await hashFile(options.source);
  const entries = parseLegacyDiary(content, options.year).filter((entry) => entry.text.trim());
  if (entries.length === 0) throw new Error('没有识别到可导入的日期记录');
  const dates = entries.map((entry) => entry.date);
  if (new Set(dates).size !== dates.length) throw new Error('源日记中存在重复日期，请先整理后再导入');

  const writes = [];
  const counts = { created: 0, filledBlank: 0, merged: 0, corrected: 0, unchanged: 0 };
  for (const entry of entries) {
    const destination = recordFile(options.vault, entry.date);
    const existing = await exists(destination) ? await readJson(destination) : null;
    const result = mergeEntry(existing, entry, sourceHash);
    counts[result.action] += 1;
    if (result.action !== 'unchanged') writes.push({ destination, record: result.record, existed: Boolean(existing), action: result.action });
  }
  const archive = await chooseArchivePath(options.library, options.source, sourceHash);
  return {
    sourceHash,
    entries,
    writes,
    counts,
    archive,
    range: [entries[0].date, entries.at(-1).date]
  };
}

async function backupExisting(vault, writes) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const root = path.join(vault, '_migration-backups', `before-diary-${timestamp}`);
  let count = 0;
  for (const item of writes) {
    if (!item.existed) continue;
    const target = path.join(root, path.relative(vault, item.destination));
    await fsp.mkdir(path.dirname(target), { recursive: true });
    await fsp.copyFile(item.destination, target);
    count += 1;
  }
  return { root: count ? root : null, count };
}

async function applyPlan(options, plan) {
  const backup = await backupExisting(options.vault, plan.writes);
  for (const item of plan.writes) await atomicJson(item.destination, item.record);
  if (!plan.archive.alreadyArchived) {
    await fsp.mkdir(path.dirname(plan.archive.destination), { recursive: true });
    await fsp.copyFile(options.source, plan.archive.destination);
  }
  return {
    backup,
    archive: plan.archive.destination,
    archiveCopied: !plan.archive.alreadyArchived
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (!await exists(options.source)) throw new Error(`源文件不存在：${options.source}`);
  if (!await exists(path.join(options.vault, 'manifest.json'))) throw new Error(`目标不是 Gobsmacked 资料库：${options.vault}`);
  const plan = await buildPlan(options);
  const applied = options.apply ? await applyPlan(options, plan) : null;
  const report = {
    schema: 'cn.dxr.gobsmacked-diary-import-report',
    version: 1,
    generatedAt: new Date().toISOString(),
    mode: options.apply ? 'applied' : 'dry-run',
    source: options.source,
    sourceSha256: plan.sourceHash,
    vault: options.vault,
    library: options.library,
    summary: {
      entries: plan.entries.length,
      range: plan.range,
      ...plan.counts,
      writes: plan.writes.length
    },
    applied
  };
  await atomicJson(options.report, report);
  console.log(JSON.stringify({ ...report.summary, mode: report.mode, report: options.report, applied }, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exitCode = 1;
});
