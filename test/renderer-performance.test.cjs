const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const renderer = fs.readFileSync(path.join(root, 'src', 'renderer', 'app.js'), 'utf8');
const markup = fs.readFileSync(path.join(root, 'src', 'renderer', 'index.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'src', 'renderer', 'styles.css'), 'utf8');

test('历史年份与月日刻度使用双画布虚拟绘制，不创建逐日 DOM 节点', () => {
  assert.match(markup, /id="timeline-scale-canvas"/);
  assert.match(markup, /id="year-scale-canvas"/);
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

test('文字输入合并同步，不在每次按键递归扫描整段记录', () => {
  assert.match(renderer, /addEventListener\(['"]input['"], \(\) => \{ queueParagraphSync\(editor, block\); markDirty\(\); \}\)/);
  assert.doesNotMatch(renderer, /addEventListener\(['"]input['"], \(\) => \{ readParagraphEditor/);
  assert.match(renderer, /editor\.spellcheck = false/);
  assert.match(renderer, /flushPendingParagraphEditors\(\);\s*if \(state\.saving\)/);
});

test('历史布局将年份置于上方整行，月日置于左侧', () => {
  assert.match(markup, /class="glass year-timeline-panel"/);
  assert.match(markup, /class="glass month-timeline-panel"/);
  assert.match(styles, /\.year-timeline-panel[^}]*grid-column: 1 \/ -1/);
  assert.match(styles, /\.month-timeline-panel[^}]*grid-column: 1/);
});

test('图片悬浮预览完整包含纵向图片', () => {
  assert.match(styles, /\.image-popover-open img[^}]*width: 100%[^}]*height: 100%[^}]*object-fit: contain/);
});

test('全屏图片查看器支持缩放、复位与拖动', () => {
  assert.match(markup, /id="image-viewer-stage"/);
  assert.match(markup, /id="image-zoom-out"/);
  assert.match(markup, /id="image-zoom-in"/);
  assert.match(markup, /id="image-reset"/);
  assert.match(renderer, /imageStage\.addEventListener\('wheel'/);
  assert.match(renderer, /imageStage\.addEventListener\('pointerdown', beginImageViewerPan\)/);
  assert.match(renderer, /setImageViewerZoom/);
  assert.match(renderer, /fitImageViewer/);
  assert.match(styles, /\.image-viewer-stage[^}]*touch-action: none/);
});

test('图片拖动只更新合成层，不触发页面布局滚动', () => {
  assert.match(renderer, /translate3d\(\$\{imageViewer\.x\}px, \$\{imageViewer\.y\}px, 0\)/);
  assert.match(renderer, /scale3d\(\$\{imageViewer\.zoom\}/);
  assert.match(styles, /\.image-viewer-transform[^}]*will-change: transform/);
  assert.doesNotMatch(renderer, /imageStage\.addEventListener\('pointermove'[\s\S]{0,300}(?:scrollTop|style\.left|style\.top)/);
});
