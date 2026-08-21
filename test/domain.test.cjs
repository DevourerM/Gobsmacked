const test = require('node:test');
const assert = require('node:assert/strict');
const {
  SCHEMA, isValidDateKey, weekdayTag, emptyRecord,
  normalizeRecord, plainText, parseLegacyDiary
} = require('../src/domain.cjs');

test('日期键执行真实日历校验', () => {
  assert.equal(isValidDateKey('day', '2024-02-29'), true);
  assert.equal(isValidDateKey('day', '2025-02-29'), false);
  assert.equal(isValidDateKey('day', '2025-13-01'), false);
  assert.equal(isValidDateKey('year', '2025'), true);
  assert.equal(isValidDateKey('year', '25'), false);
});

test('工作日标签按日期生成', () => {
  assert.deepEqual(
    ['2026-08-16','2026-08-17','2026-08-18','2026-08-19','2026-08-20','2026-08-21','2026-08-22'].map(weekdayTag),
    ['金曜日','木曜日','水曜日','火曜日','土曜日','日曜日','月曜日']
  );
});

test('空白记录具有版本化块式结构', () => {
  const record = emptyRecord('day', '2026-08-20');
  assert.equal(record.schema, SCHEMA);
  assert.equal(record.id, 'day:2026-08-20');
  assert.equal(record.schema, 'cn.dxr.gobsmacked-record');
  assert.equal(record.blocks[0].type, 'paragraph');
  assert.deepEqual(record.blocks[0].images, []);
  assert.deepEqual(record.tags, ['土曜日']);
});

test('记录规范化限制类型、重复标签和坐标', () => {
  const record = normalizeRecord({
    title: ' 测试 ', tags: ['星', '星', '  '],
    location: { name: '远方', latitude: 120, longitude: -220 },
    blocks: [{ type: 'unknown', text: '文字' }, { type: 'image', assetId: 'a.jpg', caption: '图' }]
  }, 'day', '2026-08-20');
  assert.equal(record.title, '测试');
  assert.deepEqual(record.tags, ['星']);
  assert.equal(record.location.latitude, 90);
  assert.equal(record.location.longitude, -180);
  assert.equal(record.blocks[0].type, 'paragraph');
  assert.equal(plainText(record), '文字');
});

test('地点允许只保存地址而不写入经纬度', () => {
  const record = normalizeRecord({
    location: { name: '旧居门前' },
    blocks: [{ type: 'paragraph', text: '' }]
  }, 'day', '2026-08-20');
  assert.deepEqual(record.location, { name: '旧居门前' });
});

test('段落保留带文本位置的录音标签', () => {
  const record = normalizeRecord({
    blocks: [{
      type: 'paragraph', text: '窗外下雨', voices: [
        { id: 'voice_1', assetId: 'rain.webm', fileName: 'rain.webm', label: '雨声', offset: 2, durationMs: 2750 },
        { id: 'voice_bad', assetId: '', label: '无效', offset: 99 }
      ]
    }]
  }, 'day', '2026-08-20');
  assert.deepEqual(record.blocks[0].voices, [{ id: 'voice_1', assetId: 'rain.webm', fileName: 'rain.webm', label: '雨声', offset: 2, durationMs: 2750 }]);
  assert.equal(plainText(record), '窗外下雨');
});

test('段落保留带文本位置的图片标签', () => {
  const record = normalizeRecord({
    blocks: [{
      type: 'paragraph', text: '抬头看见星空', images: [
        { id: 'image_1', assetId: 'sky.png', fileName: 'sky.png', label: '星空', offset: 4 },
        { id: 'image_bad', assetId: '', label: '无效', offset: 99 }
      ]
    }]
  }, 'day', '2026-08-21');
  assert.deepEqual(record.blocks[0].images, [{ id: 'image_1', assetId: 'sky.png', fileName: 'sky.png', label: '星空', offset: 4 }]);
  assert.equal(plainText(record), '抬头看见星空');
});

test('旧日记解析支持月.日分段和闰日过滤', () => {
  const source = '1.1\n第一天\n继续\n\n1.2\n第二天\n2.29\n闰日\n12.31\n最后一天';
  const entries = parseLegacyDiary(source, '2024');
  assert.equal(entries.length, 4);
  assert.equal(entries[0].date, '2024-01-01');
  assert.equal(entries[0].text, '第一天\n继续');
  assert.equal(entries[1].date, '2024-01-02');
  assert.equal(entries[3].date, '2024-12-31');
  assert.equal(parseLegacyDiary(source, '2025').length, 3);
});

test('旧日记解析兼容仅使用回车符的文本', () => {
  const entries = parseLegacyDiary('1.1\r第一天\r1.2\r第二天', '2026');
  assert.deepEqual(entries.map((entry) => entry.date), ['2026-01-01', '2026-01-02']);
  assert.equal(entries[1].text, '第二天');
});

test('旧日记解析兼容日期后的感叹号', () => {
  const entries = parseLegacyDiary('8.16\n前一天\n8.17！\n这一天\n8.18\n后一天', '2026');
  assert.deepEqual(entries.map((entry) => entry.date), ['2026-08-16', '2026-08-17', '2026-08-18']);
  assert.equal(entries[1].text, '这一天');
});
