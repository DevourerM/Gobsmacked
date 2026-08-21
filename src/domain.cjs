const crypto = require('node:crypto');

const SCHEMA = 'cn.dxr.gobsmacked-record';
const VERSION = 1;
const DAY_RE = /^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/;
const YEAR_RE = /^(19|20|21)\d{2}$/;

function uid(prefix = 'block') {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(6).toString('hex')}`;
}

function isValidDateKey(kind, value) {
  if (kind === 'year') return YEAR_RE.test(String(value));
  if (!DAY_RE.test(String(value))) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function weekdayTag(dateKey) {
  if (!isValidDateKey('day', dateKey)) return '';
  const labels = ['金曜日', '木曜日', '水曜日', '火曜日', '土曜日', '日曜日', '月曜日'];
  return labels[new Date(`${dateKey}T12:00:00Z`).getUTCDay()];
}

function defaultTitle(kind, dateKey) {
  if (kind === 'year') return `${dateKey} 年度回望`;
  const [year, month, day] = dateKey.split('-').map(Number);
  return `${year}年${month}月${day}日`;
}

function emptyRecord(kind, dateKey) {
  if (!['day', 'year'].includes(kind) || !isValidDateKey(kind, dateKey)) {
    throw new Error('无效的记录类型或日期');
  }
  const now = new Date().toISOString();
  return {
    schema: SCHEMA,
    version: VERSION,
    id: `${kind}:${dateKey}`,
    kind,
    date: dateKey,
    title: defaultTitle(kind, dateKey),
    tags: kind === 'day' ? [weekdayTag(dateKey)] : ['年度总结'],
    location: null,
    blocks: [{ id: uid('paragraph'), type: 'paragraph', text: '', voices: [], images: [] }],
    createdAt: now,
    updatedAt: now
  };
}

function normalizeRecord(input, expectedKind, expectedDate) {
  const base = emptyRecord(expectedKind, expectedDate);
  const allowedBlocks = Array.isArray(input?.blocks) ? input.blocks.slice(0, 1000) : base.blocks;
  const blocks = allowedBlocks.map((block) => {
    if (block?.type === 'image' || block?.type === 'audio') {
      return {
        id: String(block.id || uid(block.type)).slice(0, 100),
        type: block.type,
        assetId: String(block.assetId || '').slice(0, 200),
        fileName: String(block.fileName || '').slice(0, 300),
        caption: String(block.caption || '').slice(0, 1000)
      };
    }
    const text = String(block?.text || '').slice(0, 2_000_000);
    const voices = (Array.isArray(block?.voices) ? block.voices : []).slice(0, 200).map((voice) => ({
      id: String(voice?.id || uid('voice')).slice(0, 100),
      assetId: String(voice?.assetId || '').slice(0, 200),
      fileName: String(voice?.fileName || '').slice(0, 300),
      label: String(voice?.label || '').trim().slice(0, 40),
      offset: Math.max(0, Math.min(text.length, Number.isInteger(voice?.offset) ? voice.offset : Number.parseInt(voice?.offset, 10) || 0)),
      durationMs: Math.max(0, Math.min(86_400_000, Number.isFinite(Number(voice?.durationMs)) ? Math.round(Number(voice.durationMs)) : 0))
    })).filter((voice) => voice.assetId && voice.label)
      .sort((left, right) => left.offset - right.offset);
    const images = (Array.isArray(block?.images) ? block.images : []).slice(0, 200).map((image) => ({
      id: String(image?.id || uid('image')).slice(0, 100),
      assetId: String(image?.assetId || '').slice(0, 200),
      fileName: String(image?.fileName || '').slice(0, 300),
      label: String(image?.label || '').trim().slice(0, 40),
      offset: Math.max(0, Math.min(text.length, Number.isInteger(image?.offset) ? image.offset : Number.parseInt(image?.offset, 10) || 0))
    })).filter((image) => image.assetId && image.label)
      .sort((left, right) => left.offset - right.offset);
    return {
      id: String(block?.id || uid('paragraph')).slice(0, 100),
      type: 'paragraph',
      text,
      voices,
      images
    };
  }).filter((block) => block.type === 'paragraph' || block.assetId);

  const tags = [...new Set((Array.isArray(input?.tags) ? input.tags : base.tags)
    .map((tag) => String(tag).trim().slice(0, 40)).filter(Boolean))].slice(0, 30);
  let location = null;
  if (input?.location && String(input.location.name || '').trim()) {
    location = { name: String(input.location.name).trim().slice(0, 100) };
    if (Number.isFinite(Number(input.location.latitude)) && Number.isFinite(Number(input.location.longitude))) {
      location.latitude = Math.max(-90, Math.min(90, Number(input.location.latitude)));
      location.longitude = Math.max(-180, Math.min(180, Number(input.location.longitude)));
    }
  }
  return {
    ...base,
    createdAt: typeof input?.createdAt === 'string' ? input.createdAt : base.createdAt,
    title: String(input?.title || base.title).trim().slice(0, 200),
    tags,
    location,
    blocks: blocks.length ? blocks : base.blocks,
    updatedAt: new Date().toISOString()
  };
}

function plainText(record) {
  return (record?.blocks || []).filter((block) => block.type === 'paragraph')
    .map((block) => block.text).join('\n').trim();
}

function parseLegacyDiary(text, yearHint) {
  const year = String(yearHint);
  if (!YEAR_RE.test(year)) throw new Error('旧日记年份无效');
  const lines = String(text).replace(/^\uFEFF/, '').split(/\r\n|\n|\r/);
  const entries = [];
  let current = null;
  const heading = /^\s*(1[0-2]|[1-9])[.．](3[01]|[12]\d|0?[1-9])(?:\s*[!！]\s*|\s+|$)/;
  for (const line of lines) {
    const match = line.match(heading);
    if (match) {
      if (current) entries.push(current);
      const month = String(Number(match[1])).padStart(2, '0');
      const day = String(Number(match[2])).padStart(2, '0');
      current = { date: `${year}-${month}-${day}`, lines: [] };
      const remainder = line.slice(match[0].length).trim();
      if (remainder) current.lines.push(remainder);
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) entries.push(current);
  return entries.filter((entry) => isValidDateKey('day', entry.date)).map((entry) => ({
    date: entry.date,
    text: entry.lines.join('\n').trim()
  }));
}

module.exports = {
  SCHEMA, VERSION, uid, isValidDateKey, weekdayTag, defaultTitle,
  emptyRecord, normalizeRecord, plainText, parseLegacyDiary
};
