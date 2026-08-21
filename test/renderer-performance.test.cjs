const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const renderer = fs.readFileSync(path.join(root, 'src', 'renderer', 'app.js'), 'utf8');
const markup = fs.readFileSync(path.join(root, 'src', 'renderer', 'index.html'), 'utf8');

test('历史刻度使用单画布虚拟绘制，不创建逐日 DOM 节点', () => {
  assert.match(markup, /id="timeline-scale-canvas"/);
  assert.doesNotMatch(markup, /id="timeline-ticks"/);
  assert.doesNotMatch(renderer, /createElement\(['"]button['"]\)[\s\S]{0,200}timeline-tick/);
});

test('程序化星空只绘制静态帧，不保留永久动画循环', () => {
  assert.doesNotMatch(renderer, /requestAnimationFrame\(paint\)/);
  assert.doesNotMatch(renderer, /function createCosmosPainter\([^)]*fps/);
});

test('历史拖动不依赖原生超长滚动层', () => {
  assert.doesNotMatch(renderer, /chronology['"]\)\.addEventListener\(['"]scroll/);
  assert.doesNotMatch(renderer, /chronology['"]\)\.scrollTop/);
});
