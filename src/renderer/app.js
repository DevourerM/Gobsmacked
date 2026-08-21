const api = window.gobsmacked;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const messages = {
  zh: {
    identity: '识别名称', secret: '密钥', enter: '进入', archiveSubtitle: '个人记录', trustDevice: '信任', trustedDevice: '已信任', trustEnabled: '本机已加入信任名单', trustDisabled: '本机已移出信任名单', trustFailed: '信任设置失败：{message}', trustedEnterFailed: '信任已失效，请输入密钥',
    todayMode: '今日记录', yearMode: '年度总结', saved: '已保存', pastArchive: '历史记录',
    calendar: '日历',
    addTag: '＋ 添加标签', addContent: '添加内容', textBlock: '¶ 文本', image: '▧ 图片', recordAudio: '● 录音', environment: '环境', currentLocation: '当前位置', clear: '清除',
    noLocation: '尚未记录地点', setLocation: '设置地点', todaySummary: '今日概览', textCount: '文字数', mediaCount: '媒体数',
    protectedArchive: '独立保护', verifyPast: '验证访问', verify: '验证', setupHistoryAccess: '设置历史密钥', saveAndEnter: '保存并进入', historySecret: '历史密钥', archive: '历史', archiveReview: '历史记录', importLegacy: '导入旧记录', exportContent: '导出内容', exportMigration: '迁移备份', returnPresent: '返回今天', recordArchive: '记录', fileArchive: '资料',
    chronology: '时间轴', yearScale: '年份', dayScale: '记录日', dragChronology: '滚动或拖动刻度', filterFiles: '筛选当前目录', importFiles: '导入文件', importFolder: '导入文件夹', openFile: '打开', extractFile: '提取', libraryEmpty: '当前目录为空', sealedArchive: '加密档案', voiceRecord: '录音', recording: '正在录音', recordingActive: '正在录音', stopRecording: '停止', insertRecording: '插入标签',
    voiceLabel: '录音标签', voiceLabelPlaceholder: '例如：雨声', imageLabel: '图片标签', imageLabelPlaceholder: '例如：星空', insertImageTag: '插入标签', previewRecording: '试听录音', play: '播放', pause: '暂停',
    calendarMark: '日期标注', markContent: '标注内容', markPlaceholder: '纪念日、约定或事件', displayScope: '显示范围', once: '仅此日期', onceDesc: '只在这一年的这一天显示', annual: '每年重复', annualDesc: '每年的同一日期显示', saveMark: '保存标注', place: '地点', placePlaceholder: '地点名称或地址', saveAddress: '保存', locateSave: '定位',
    waitingSave: '等待自动保存…', saving: '正在保存…', savedAt: '已保存 · {time}', saveFailed: '保存失败，稍后重试', reading: '正在读取…', readFailed: '读取失败',
    paragraphPlaceholder: '写下今天的记录……', captionPlaceholder: '说明（可选）',
    historyLoading: '正在读取…', historyEmpty: '这一天没有记录。', historyReadFailed: '读取失败：{message}', noDayRecords: '当前没有日记录，仅显示年份。',
    recordError: '记录失败：{message}', authFailed: '识别名称或密钥不正确', verifyFailed: '历史密钥不正确', historySecretSame: '历史密钥不能与启动密钥相同',
    recordingReady: '录音已停止。填写标签后即可插入。', recordingDenied: '无法使用麦克风：{message}', recordingSaved: '录音标签已插入。', recordingSaveFailed: '录音保存失败：{message}',
    yearReview: '{year} 年度总结', calendarMonth: '{year} 年 {month} 月', delete: '删除', moveUp: '上移', moveDown: '下移'
  },
  en: {
    identity: 'Identity', secret: 'Passkey', enter: 'Enter', archiveSubtitle: 'LIFE ARCHIVE', trustDevice: 'Trust', trustedDevice: 'Trusted', trustEnabled: 'This device is now trusted', trustDisabled: 'This device is no longer trusted', trustFailed: 'Trust setting failed: {message}', trustedEnterFailed: 'Trust expired; enter your passkey',
    todayMode: 'Today', yearMode: 'Year Review', saved: 'Saved', pastArchive: 'Archive',
    calendar: 'CALENDAR',
    addTag: '+ Add tag', addContent: 'Add content', textBlock: '¶ Text', image: '▧ Image', recordAudio: '● Record', environment: 'ENVIRONMENT', currentLocation: 'Current Place', clear: 'Clear',
    noLocation: 'No place recorded', setLocation: 'Set Place', todaySummary: 'TODAY', textCount: 'Characters', mediaCount: 'Media',
    protectedArchive: 'SEPARATE ACCESS', verifyPast: 'Verify Access', verify: 'Verify', setupHistoryAccess: 'Set History Passkey', saveAndEnter: 'Save and Enter', historySecret: 'History passkey', archive: 'ARCHIVE', archiveReview: 'Past Records', importLegacy: 'Import Records', exportContent: 'Export Content', exportMigration: 'Migration Copy', returnPresent: 'Return to Present', recordArchive: 'Records', fileArchive: 'Files',
    chronology: 'TIMELINE', yearScale: 'Years', dayScale: 'Recorded days', dragChronology: 'Scroll or drag the scale', filterFiles: 'Filter this folder', importFiles: 'Import Files', importFolder: 'Import Folder', openFile: 'Open', extractFile: 'Extract', libraryEmpty: 'This folder is empty', sealedArchive: 'Encrypted Archive', voiceRecord: 'RECORDING', recording: 'Recording', recordingActive: 'Recording', stopRecording: 'Stop', insertRecording: 'Insert Tag',
    voiceLabel: 'Recording label', voiceLabelPlaceholder: 'For example: Rain', imageLabel: 'Image label', imageLabelPlaceholder: 'For example: Night sky', insertImageTag: 'Insert Tag', previewRecording: 'Preview recording', play: 'Play', pause: 'Pause',
    calendarMark: 'DATE MARK', markContent: 'Description', markPlaceholder: 'Anniversary, appointment, or event', displayScope: 'Display scope', once: 'This date only', onceDesc: 'Show only on this date in this year', annual: 'Repeat yearly', annualDesc: 'Show on the same date every year', saveMark: 'Save Mark', place: 'Place', placePlaceholder: 'Place or address', saveAddress: 'Save', locateSave: 'Locate',
    waitingSave: 'Autosave pending…', saving: 'Saving…', savedAt: 'Saved · {time}', saveFailed: 'Save failed; retrying', reading: 'Loading…', readFailed: 'Load failed',
    paragraphPlaceholder: 'Record the environment, facts, and feelings of this moment…', captionPlaceholder: 'Description (optional)',
    historyLoading: 'Loading archive…', historyEmpty: 'No record exists at this moment.', historyReadFailed: 'Archive read failed: {message}', noDayRecords: 'No daily records exist; only year markers are shown.',
    recordError: 'Recording failed: {message}', authFailed: 'Identity or passkey is incorrect', verifyFailed: 'Incorrect history passkey', historySecretSame: 'The history passkey must differ from the launch passkey',
    recordingReady: 'Recording stopped. Preview or insert it.', recordingDenied: 'Microphone unavailable: {message}', recordingSaved: 'Recording inserted into the current record.', recordingSaveFailed: 'Could not save recording: {message}',
    yearReview: '{year} Year Review', calendarMonth: '{month}/{year}', delete: 'Delete', moveUp: 'Move up', moveDown: 'Move down'
  }
};

const state = {
  kind: 'day',
  date: localDateKey(new Date()),
  record: null,
  calendarMonth: startOfMonth(new Date()),
  calendarRecords: new Set(),
  annotations: [],
  stars: [],
  earthData: null,
  earthRotation: { longitude: 104, latitude: 18 },
  dirty: false,
  saving: false,
  editVersion: 0,
  savePromise: null,
  saveTimer: null,
  loadSerial: 0,
  historyUnlocked: false,
  historyIndex: { days: [], years: [] },
  timelineSelection: null,
  archiveMode: 'records',
  libraryPath: '',
  libraryEntries: [],
  librarySelected: null,
  libraryStatus: null,
  libraryQuery: '',
  language: localStorage.getItem('gobsmacked-language') === 'en' ? 'en' : 'zh',
  recorder: null,
  recordingStream: null,
  recordingChunks: [],
  recordingBlob: null,
  recordingUrl: '',
  recordingStartedAt: 0,
  recordingTimer: null,
  recordingDurationMs: 0,
  activeParagraphId: null,
  activeParagraphOffset: 0,
  recordingTarget: null,
  pendingImageAsset: null,
  pendingImageTarget: null,
  voicePlayerKnownDuration: 0,
  innerConfigured: false,
  deviceTrusted: false,
  skyRevealed: false,
  exportBusy: false
};

function t(key, variables = {}) {
  let value = messages[state.language]?.[key] ?? messages.zh[key] ?? key;
  Object.entries(variables).forEach(([name, replacement]) => { value = value.replaceAll(`{${name}}`, String(replacement)); });
  return value;
}

function applyLanguage() {
  document.documentElement.lang = state.language === 'zh' ? 'zh-CN' : 'en';
  $$('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
  $$('[data-i18n-placeholder]').forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
  const weekdays = state.language === 'zh' ? ['日','一','二','三','四','五','六'] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  $$('[data-weekday]').forEach((node) => { node.textContent = weekdays[Number(node.dataset.weekday)]; });
  $$('.language-toggle').forEach((button) => { button.textContent = state.language === 'zh' ? 'EN' : '中'; });
  $('#annotate-button').ariaLabel = state.language === 'zh' ? '添加日期标注' : 'Add date mark';
  $('#set-location').ariaLabel = t('setLocation');
  $('#clear-location').ariaLabel = state.language === 'zh' ? '清除地点' : 'Clear place';
  renderDeviceTrust();
  if (!$('#history-gate').classList.contains('hidden')) configureHistoryGate();
  if (state.record) { $('#header-date').textContent = displayDate(state.date); renderRecord(); refreshCalendarData(); }
  if (state.historyUnlocked) {
    renderChronology();
    if (state.timelineSelection) loadHistoryRecord(state.timelineSelection.kind, state.timelineSelection.key);
    if (state.archiveMode === 'library') loadLibrary(state.libraryPath, state.libraryQuery);
  }
}

function renderDeviceTrust() {
  const button = $('#trust-device');
  if (!button) return;
  button.textContent = t(state.deviceTrusted ? 'trustedDevice' : 'trustDevice');
  button.classList.toggle('active', state.deviceTrusted);
  button.setAttribute('aria-pressed', state.deviceTrusted ? 'true' : 'false');
}

function toggleLanguage() {
  state.language = state.language === 'zh' ? 'en' : 'zh';
  localStorage.setItem('gobsmacked-language', state.language);
  applyLanguage();
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function startOfMonth(date) { return new Date(date.getFullYear(), date.getMonth(), 1, 12); }
function addDays(date, count) { const next = new Date(date); next.setDate(next.getDate() + count); return next; }
function dayNumber(date) { return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000); }
function fromDayNumber(value) { const date = new Date(Number(value) * 86400000); return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12); }
function displayDate(key) {
  if (/^\d{4}$/.test(key)) return t('yearReview', { year: key });
  const date = dateFromKey(key);
  return new Intl.DateTimeFormat(state.language === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: state.language === 'zh' ? 'long' : 'short', day: 'numeric', weekday: 'long' }).format(date);
}
function mediaUrl(assetId) { return `gob-media://${assetId}`; }
function escapeText(value) { const node = document.createElement('span'); node.textContent = String(value ?? ''); return node.innerHTML; }

function voiceDisplayLabel(voice) {
  return String(voice?.label || voice?.caption || voice?.fileName || t('voiceRecord')).replace(/\.[^.]+$/, '').slice(0, 40);
}

function imageDisplayLabel(image) {
  return String(image?.label || image?.caption || image?.fileName || t('image')).replace(/\.[^.]+$/, '').slice(0, 40);
}

function createVoiceToken(voice, className = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `inline-media-token voice-token ${className}`.trim();
  button.contentEditable = 'false';
  button.dataset.voiceId = voice.id || '';
  button.textContent = `〘${voiceDisplayLabel(voice)}〙`;
  button.title = `${t('play')} · ${voiceDisplayLabel(voice)}`;
  button.addEventListener('mousedown', (event) => event.preventDefault());
  button.addEventListener('click', () => openVoicePlayer(voice, button));
  return button;
}

function createImageToken(image, className = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `inline-media-token image-token ${className}`.trim();
  button.contentEditable = 'false';
  button.dataset.imageId = image.id || '';
  button.textContent = `〘${imageDisplayLabel(image)}〙`;
  button.title = imageDisplayLabel(image);
  button.addEventListener('mousedown', (event) => event.preventDefault());
  button.addEventListener('click', () => openImagePopover(image, button));
  return button;
}

function renderInlineMedia(container, block) {
  const media = [
    ...(block.voices || []).map((item) => ({ kind: 'voice', item })),
    ...(block.images || []).map((item) => ({ kind: 'image', item }))
  ].sort((left, right) => (left.item.offset - right.item.offset) || left.kind.localeCompare(right.kind) || String(left.item.id).localeCompare(String(right.item.id)));
  let offset = 0;
  media.forEach(({ kind, item }) => {
    const mediaOffset = Math.max(offset, Math.min(block.text.length, Number(item.offset) || 0));
    if (mediaOffset > offset) container.append(document.createTextNode(block.text.slice(offset, mediaOffset)));
    container.append(kind === 'voice' ? createVoiceToken(item) : createImageToken(item));
    offset = mediaOffset;
  });
  if (offset < block.text.length) container.append(document.createTextNode(block.text.slice(offset)));
}

function contentLength(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue.length;
  if (node.nodeType !== Node.ELEMENT_NODE || node.classList?.contains('inline-media-token')) return 0;
  if (node.tagName === 'BR') return 1;
  return [...node.childNodes].reduce((sum, child) => sum + contentLength(child), 0);
}

function selectionOffsetIn(editor) {
  const selection = getSelection();
  if (!selection?.rangeCount || !editor.contains(selection.anchorNode)) return null;
  const target = selection.anchorNode; const targetOffset = selection.anchorOffset;
  let total = 0; let answer = null;
  function visit(node) {
    if (node === target) {
      if (node.nodeType === Node.TEXT_NODE) answer = total + Math.min(targetOffset, node.nodeValue.length);
      else answer = total + [...node.childNodes].slice(0, targetOffset).reduce((sum, child) => sum + contentLength(child), 0);
      return true;
    }
    if (node.nodeType === Node.TEXT_NODE) { total += node.nodeValue.length; return false; }
    if (node.nodeType !== Node.ELEMENT_NODE || node.classList?.contains('inline-media-token')) return false;
    if (node.tagName === 'BR') { total += 1; return false; }
    return [...node.childNodes].some(visit);
  }
  visit(editor);
  return answer;
}

function rememberParagraphCaret(editor, block) {
  const offset = selectionOffsetIn(editor);
  state.activeParagraphId = block.id;
  if (offset !== null) state.activeParagraphOffset = offset;
}

function readParagraphEditor(editor, block) {
  const knownVoices = new Map((block.voices || []).map((voice) => [voice.id, voice]));
  const knownImages = new Map((block.images || []).map((image) => [image.id, image]));
  let text = ''; const voices = []; const images = [];
  function visit(node) {
    if (node.nodeType === Node.TEXT_NODE) { text += node.nodeValue; return; }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.classList.contains('voice-token')) {
      const voice = knownVoices.get(node.dataset.voiceId);
      if (voice) voices.push({ ...voice, offset: text.length });
      return;
    }
    if (node.classList.contains('image-token')) {
      const image = knownImages.get(node.dataset.imageId);
      if (image) images.push({ ...image, offset: text.length });
      return;
    }
    if (node.tagName === 'BR') { text += '\n'; return; }
    [...node.childNodes].forEach(visit);
  }
  [...editor.childNodes].forEach(visit);
  block.text = text.slice(0, 2_000_000);
  block.voices = voices;
  block.images = images;
  rememberParagraphCaret(editor, block);
}

function insertPlainText(text) {
  const selection = getSelection();
  if (!selection?.rangeCount) return;
  const range = selection.getRangeAt(0); range.deleteContents();
  const node = document.createTextNode(text); range.insertNode(node);
  range.setStartAfter(node); range.collapse(true); selection.removeAllRanges(); selection.addRange(range);
  node.parentElement?.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
}

let toastTimer;
function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 2600);
}

function showModal(id) { $(`#${id}`).classList.remove('hidden'); }
function hideModal(id) { $(`#${id}`).classList.add('hidden'); }

function placePopover(popover, anchor, gap = 10) {
  if (!popover || !anchor) return;
  popover.classList.remove('hidden');
  const anchorBounds = anchor.getBoundingClientRect();
  const bounds = popover.getBoundingClientRect();
  const margin = 12;
  const left = Math.max(margin, Math.min(innerWidth - bounds.width - margin, anchorBounds.left + anchorBounds.width / 2 - bounds.width / 2));
  let top = anchorBounds.top - bounds.height - gap;
  if (top < margin) top = Math.min(innerHeight - bounds.height - margin, anchorBounds.bottom + gap);
  popover.style.left = `${Math.round(left)}px`;
  popover.style.top = `${Math.round(Math.max(margin, top))}px`;
}

function closeImagePopover() {
  $('#image-popover').classList.add('hidden');
  $('#image-popover-preview').removeAttribute('src');
}

function openImagePopover(image, anchor) {
  closeVoicePlayer();
  const source = mediaUrl(image.assetId);
  $('#image-popover-label').textContent = imageDisplayLabel(image);
  $('#image-popover-preview').src = source;
  $('#image-popover-open').dataset.source = source;
  $('#image-popover-open').dataset.label = imageDisplayLabel(image);
  placePopover($('#image-popover'), anchor);
}

function openFullImage(source, label = '') {
  closeImagePopover();
  $('#image-preview').src = source;
  $('#image-preview').alt = label || t('image');
  showModal('image-modal');
}

function setSkyRevealed(revealed) {
  state.skyRevealed = Boolean(revealed);
  document.body.style.setProperty('--sky-progress', state.skyRevealed ? '1' : '0');
  document.body.classList.toggle('sky-revealed', state.skyRevealed);
  $('#sky').setAttribute('aria-hidden', state.skyRevealed ? 'false' : 'true');
  if (state.skyRevealed) dispatchEvent(new Event('resize'));
}

let skyDrag = null;

function beginSkyDrag(event, opening) {
  if ($('#app').classList.contains('hidden') || !$('#history').classList.contains('hidden')) return;
  if ($('.overlay:not(.hidden), .image-modal:not(.hidden)')) return;
  if (!opening && event.target.closest('button, .star-node')) return;
  skyDrag = { pointerId: event.pointerId, startY: event.clientY, opening, progress: opening ? 0 : 1 };
  event.currentTarget.setPointerCapture?.(event.pointerId);
  document.body.classList.add('sky-dragging');
  event.preventDefault();
}

function moveSkyDrag(event) {
  if (!skyDrag || event.pointerId !== skyDrag.pointerId) return;
  const delta = event.clientY - skyDrag.startY;
  const progress = skyDrag.opening ? delta / 260 : 1 + delta / 260;
  skyDrag.progress = Math.max(0, Math.min(1, progress));
  document.body.style.setProperty('--sky-progress', String(skyDrag.progress));
  event.preventDefault();
}

function finishSkyDrag(event) {
  if (!skyDrag || (event.pointerId !== undefined && event.pointerId !== skyDrag.pointerId)) return;
  const reveal = skyDrag.opening ? skyDrag.progress >= .3 : skyDrag.progress >= .7;
  skyDrag = null; document.body.classList.remove('sky-dragging'); setSkyRevealed(reveal);
}

function updateExportProgress(value = {}) {
  const panel = $('#export-progress');
  const labels = state.language === 'zh'
    ? { records: '导出记录', files: '解密资料', system: '复制系统', archive: '复制档案', userData: '复制记录', finishing: '完成校验', done: '已完成' }
    : { records: 'Exporting records', files: 'Decrypting files', system: 'Copying system', archive: 'Copying archive', userData: 'Copying records', finishing: 'Finalizing', done: 'Complete' };
  const percent = Math.max(0, Math.min(100, Number(value.percent || 0)));
  panel.classList.remove('hidden');
  $('#export-progress-label').textContent = labels[value.stage] || value.stage || '';
  $('#export-progress-bar').style.width = `${percent}%`;
  $('#export-progress-percent').textContent = `${percent.toFixed(1)}%`;
  panel.classList.toggle('complete', value.stage === 'done');
}

async function runHistoryExport(type) {
  if (state.exportBusy || !state.historyUnlocked) return;
  state.exportBusy = true;
  $('#history').classList.add('exporting');
  const buttons = [$('#export-content'), $('#export-migration')]; buttons.forEach((button) => { button.disabled = true; });
  updateExportProgress({ stage: type === 'content' ? 'records' : 'system', percent: 0 });
  try {
    const result = type === 'content' ? await api.exportContent() : await api.exportMigration();
    if (!result) { $('#export-progress').classList.add('hidden'); return; }
    updateExportProgress({ stage: 'done', percent: 100 });
    toast(state.language === 'zh' ? `已导出到 ${result.path}` : `Exported to ${result.path}`);
    setTimeout(() => $('#export-progress').classList.add('hidden'), 2200);
  } catch (error) {
    $('#export-progress').classList.add('hidden');
    toast(`${state.language === 'zh' ? '导出失败' : 'Export failed'}: ${error.message}`);
  } finally {
    state.exportBusy = false; $('#history').classList.remove('exporting'); buttons.forEach((button) => { button.disabled = false; });
  }
}

function setSaveState(text, className = '') {
  const element = $('#save-state');
  element.textContent = text;
  element.className = `save-state ${className}`.trim();
}

function markDirty() {
  if (!state.record) return;
  state.dirty = true;
  state.editVersion += 1;
  setSaveState(t('waitingSave'), 'saving');
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(saveCurrent, 850);
  updateStats();
}

async function saveCurrent() {
  clearTimeout(state.saveTimer);
  if (state.saving) return state.savePromise;
  if (!state.record || !state.dirty) return;
  const recordToSave = structuredClone(state.record);
  const versionToSave = state.editVersion;
  state.saving = true;
  setSaveState(t('saving'), 'saving');
  state.savePromise = (async () => {
    try {
      const result = await api.saveRecord(recordToSave);
      if (state.record?.id === recordToSave.id) {
        state.record.updatedAt = result.updatedAt;
        if (state.editVersion === versionToSave) {
          state.dirty = false;
          setSaveState(t('savedAt', { time: new Date().toLocaleTimeString(state.language === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' }) }));
        }
      }
      refreshCalendarData();
    } catch (error) {
      setSaveState(t('saveFailed'), 'error');
      toast(`${state.language === 'zh' ? '保存失败' : 'Save failed'}: ${error.message}`);
    } finally {
      state.saving = false;
      state.savePromise = null;
      if (state.dirty) state.saveTimer = setTimeout(saveCurrent, 500);
    }
  })();
  return state.savePromise;
}

async function flushCurrent() {
  let attempts = 0;
  while ((state.dirty || state.saving) && attempts < 5) {
    await saveCurrent();
    attempts += 1;
  }
}

async function loadRecord(kind, date) {
  const currentDate = kind === 'day' ? localDateKey(new Date()) : String(new Date().getFullYear());
  if (date !== currentDate) return;
  const serial = ++state.loadSerial;
  await flushCurrent();
  setSaveState(t('reading'), 'saving');
  try {
    const record = await api.getRecord(kind, date);
    if (serial !== state.loadSerial) return;
    state.kind = kind;
    state.date = date;
    state.record = record;
    state.dirty = false;
    $$('.mode-switch [data-mode]').forEach((button) => button.classList.toggle('active', button.dataset.mode === kind));
    $('#header-date').textContent = displayDate(date);
    renderRecord();
    setSaveState(t('saved'));
    if (kind === 'day') {
      state.calendarMonth = startOfMonth(dateFromKey(date));
      await refreshCalendarData();
    }
  } catch (error) {
    setSaveState(t('readFailed'), 'error');
    toast(`${state.language === 'zh' ? '无法读取记录' : 'Could not load record'}: ${error.message}`);
  }
}

function renderRecord() {
  if (!state.record) return;
  $('#record-title').value = state.record.title;
  renderTags();
  renderBlocks();
  renderLocation();
  updateStats();
}

function renderTags() {
  const container = $('#tags');
  container.replaceChildren();
  state.record.tags.forEach((tag, index) => {
    const item = document.createElement('span');
    item.className = 'tag';
    const label = document.createElement('span');
    label.textContent = tag;
    const remove = document.createElement('button');
    remove.type = 'button'; remove.textContent = '×'; remove.ariaLabel = `${t('delete')} ${tag}`;
    remove.addEventListener('click', () => { state.record.tags.splice(index, 1); renderTags(); markDirty(); });
    item.append(label, remove); container.append(item);
  });
}

function blockTools(index) {
  const tools = document.createElement('div'); tools.className = 'block-tools';
  const actions = [
    ['↑', t('moveUp'), () => moveBlock(index, -1)],
    ['↓', t('moveDown'), () => moveBlock(index, 1)],
    ['×', t('delete'), () => removeBlock(index)]
  ];
  actions.forEach(([text, label, action]) => {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = text; button.title = label; button.addEventListener('click', action); tools.append(button);
  });
  return tools;
}

function renderBlocks() {
  const container = $('#editor-blocks');
  container.replaceChildren();
  state.record.blocks.forEach((block, index) => {
    const wrapper = document.createElement('section');
    wrapper.className = `block ${block.type === 'paragraph' ? 'paragraph-block' : 'media-block'}`;
    wrapper.dataset.blockId = block.id;
    wrapper.append(blockTools(index));
    if (block.type === 'paragraph') {
      block.voices ||= [];
      block.images ||= [];
      const editor = document.createElement('div');
      editor.className = 'paragraph-editor'; editor.contentEditable = 'true'; editor.spellcheck = true;
      editor.dataset.placeholder = t('paragraphPlaceholder'); editor.setAttribute('aria-label', t('textBlock'));
      renderInlineMedia(editor, block);
      editor.addEventListener('focus', () => rememberParagraphCaret(editor, block));
      editor.addEventListener('keyup', () => rememberParagraphCaret(editor, block));
      editor.addEventListener('mouseup', () => rememberParagraphCaret(editor, block));
      editor.addEventListener('input', () => { readParagraphEditor(editor, block); markDirty(); });
      editor.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); insertPlainText('\n'); } });
      editor.addEventListener('paste', (event) => { event.preventDefault(); insertPlainText(event.clipboardData.getData('text/plain')); });
      wrapper.append(editor); container.append(wrapper);
    } else {
      if (block.type === 'image') {
        wrapper.append(createImageToken({ ...block, label: imageDisplayLabel(block) }, 'legacy-image-token'));
      } else {
        wrapper.append(createVoiceToken({ ...block, label: voiceDisplayLabel(block) }, 'legacy-voice-token'));
      }
      container.append(wrapper);
    }
  });
}

function moveBlock(index, offset) {
  const target = index + offset;
  if (target < 0 || target >= state.record.blocks.length) return;
  [state.record.blocks[index], state.record.blocks[target]] = [state.record.blocks[target], state.record.blocks[index]];
  renderBlocks(); markDirty();
}

function removeBlock(index) {
  state.record.blocks.splice(index, 1);
  if (!state.record.blocks.length) state.record.blocks.push({ id: cryptoId('paragraph'), type: 'paragraph', text: '', voices: [], images: [] });
  renderBlocks(); markDirty();
}

function cryptoId(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`; }

function addParagraph() {
  state.record.blocks.push({ id: cryptoId('paragraph'), type: 'paragraph', text: '', voices: [], images: [] });
  renderBlocks(); markDirty();
  requestAnimationFrame(() => { const inputs = $$('.paragraph-editor'); inputs.at(-1)?.focus(); $('#editor-blocks').scrollTop = $('#editor-blocks').scrollHeight; });
}

async function beginImageInsert() {
  try {
    state.pendingImageTarget = inlineInsertionTarget();
    const asset = await api.importAsset('image');
    if (!asset) return;
    state.pendingImageAsset = asset;
    $('#image-label-input').value = String(asset.fileName || '').replace(/\.[^.]+$/, '').slice(0, 40);
    placePopover($('#image-label-popover'), $('#add-image'));
    setTimeout(() => { $('#image-label-input').focus(); $('#image-label-input').select(); }, 30);
  } catch (error) { toast(`${state.language === 'zh' ? '图片导入失败' : 'Image import failed'}: ${error.message}`); }
}

function cancelImageInsert() {
  $('#image-label-popover').classList.add('hidden');
  state.pendingImageAsset = null;
  state.pendingImageTarget = null;
  $('#image-label-input').value = '';
}

function insertImageReference(event) {
  event.preventDefault();
  const label = $('#image-label-input').value.trim();
  if (!state.pendingImageAsset || !state.record || !label) return;
  const target = state.record.blocks.find((block) => block.type === 'paragraph' && block.id === state.pendingImageTarget?.blockId)
    || [...state.record.blocks].reverse().find((block) => block.type === 'paragraph');
  if (!target) return;
  target.images ||= [];
  target.images.push({
    id: cryptoId('image'), assetId: state.pendingImageAsset.assetId, fileName: state.pendingImageAsset.fileName,
    label, offset: Math.min(target.text.length, state.pendingImageTarget?.offset ?? target.text.length)
  });
  renderBlocks(); markDirty(); cancelImageInsert();
  document.querySelector(`[data-block-id="${CSS.escape(target.id)}"]`)?.scrollIntoView({ block: 'nearest' });
}

function recordingMimeType() {
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'].find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

function releaseRecordingStream() {
  state.recordingStream?.getTracks().forEach((track) => track.stop());
  state.recordingStream = null;
  clearInterval(state.recordingTimer); state.recordingTimer = null;
}

function resetRecordingPreview() {
  if (state.recordingUrl) URL.revokeObjectURL(state.recordingUrl);
  state.recordingUrl = ''; state.recordingBlob = null; state.recordingChunks = []; state.recordingDurationMs = 0;
  const preview = $('#recording-preview'); preview.pause(); preview.removeAttribute('src'); preview.load();
  $('#recording-label').value = ''; $('#recording-label-field').classList.add('hidden');
  $('#recording-preview-dial').classList.add('hidden'); $('#recording-preview-time').classList.add('hidden');
  $('#preview-recording').textContent = '▶'; $('#recording-preview-progress').style.strokeDashoffset = '100';
  $('#recording-preview-current').textContent = '00:00'; $('#recording-preview-duration').textContent = '00:00';
  $('#recording-orb').classList.remove('hidden'); $('#recording-time').classList.remove('hidden');
}

function inlineInsertionTarget() {
  let block = state.record?.blocks.find((item) => item.type === 'paragraph' && item.id === state.activeParagraphId);
  if (!block) block = [...(state.record?.blocks || [])].reverse().find((item) => item.type === 'paragraph');
  if (!block) {
    block = { id: cryptoId('paragraph'), type: 'paragraph', text: '', voices: [], images: [] };
    state.record.blocks.push(block);
  }
  return { blockId: block.id, offset: block.id === state.activeParagraphId ? Math.min(block.text.length, state.activeParagraphOffset || 0) : block.text.length };
}

function updateRecordingInsertState() {
  $('#use-recording').disabled = !state.recordingBlob || !$('#recording-label').value.trim();
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    toast(t('recordingDenied', { message: 'MediaRecorder unavailable' })); return;
  }
  state.recordingTarget = inlineInsertionTarget();
  resetRecordingPreview();
  state.recordingCancelled = false;
  $('#recording-title').textContent = t('recording');
  $('#recording-status').textContent = t('recordingActive');
  $('#recording-time').textContent = '00:00';
  $('#recording-orb').classList.add('active');
  $('#stop-recording').disabled = false; $('#use-recording').disabled = true;
  showModal('recording-modal');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
    state.recordingStream = stream;
    const mimeType = recordingMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    state.recorder = recorder; state.recordingStartedAt = Date.now();
    recorder.addEventListener('dataavailable', (event) => { if (event.data.size) state.recordingChunks.push(event.data); });
    recorder.addEventListener('stop', () => {
      releaseRecordingStream(); $('#recording-orb').classList.remove('active'); $('#stop-recording').disabled = true;
      if (state.recordingCancelled) { resetRecordingPreview(); return; }
      const blob = new Blob(state.recordingChunks, { type: recorder.mimeType || 'audio/webm' });
      if (!blob.size) { resetRecordingPreview(); toast(t('recordingDenied', { message: 'empty recording' })); return; }
      state.recordingDurationMs = Math.max(1, Date.now() - state.recordingStartedAt);
      state.recordingBlob = blob; state.recordingUrl = URL.createObjectURL(blob);
      const preview = $('#recording-preview'); preview.src = state.recordingUrl; preview.load();
      $('#recording-orb').classList.add('hidden'); $('#recording-time').classList.add('hidden');
      $('#recording-label-field').classList.remove('hidden'); $('#recording-preview-dial').classList.remove('hidden'); $('#recording-preview-time').classList.remove('hidden');
      syncAudioRing(preview, 'recording-preview', state.recordingDurationMs / 1000);
      $('#recording-status').textContent = t('recordingReady');
      updateRecordingInsertState(); setTimeout(() => $('#recording-label').focus(), 30);
    }, { once: true });
    recorder.start(250);
    state.recordingTimer = setInterval(() => {
      const seconds = Math.floor((Date.now() - state.recordingStartedAt) / 1000);
      $('#recording-time').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }, 250);
  } catch (error) {
    releaseRecordingStream(); hideModal('recording-modal');
    toast(t('recordingDenied', { message: error.message }));
  }
}

function stopRecording() {
  if (state.recorder?.state && state.recorder.state !== 'inactive') state.recorder.stop();
}

function cancelRecording() {
  state.recordingCancelled = true;
  if (state.recorder?.state && state.recorder.state !== 'inactive') state.recorder.stop(); else releaseRecordingStream();
  resetRecordingPreview(); hideModal('recording-modal');
}

function toggleRecordingPreview() {
  const audio = $('#recording-preview');
  if (!audio.src) return;
  if (audio.paused) audio.play(); else audio.pause();
}

async function useRecording() {
  const label = $('#recording-label').value.trim();
  if (!state.recordingBlob || !state.record || !label) return;
  const button = $('#use-recording'); button.disabled = true;
  try {
    const bytes = new Uint8Array(await state.recordingBlob.arrayBuffer());
    const asset = await api.saveRecording(bytes, state.recordingBlob.type);
    const target = state.record.blocks.find((block) => block.type === 'paragraph' && block.id === state.recordingTarget?.blockId)
      || [...state.record.blocks].reverse().find((block) => block.type === 'paragraph');
    target.voices ||= [];
    target.voices.push({ id: cryptoId('voice'), assetId: asset.assetId, fileName: asset.fileName, label, offset: Math.min(target.text.length, state.recordingTarget?.offset ?? target.text.length), durationMs: state.recordingDurationMs });
    renderBlocks(); markDirty(); cancelRecording();
    document.querySelector(`[data-block-id="${CSS.escape(target.id)}"]`)?.scrollIntoView({ block: 'nearest' });
    toast(t('recordingSaved'));
  } catch (error) { button.disabled = false; toast(t('recordingSaveFailed', { message: error.message })); }
}

function formatAudioTime(value) {
  const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function effectiveAudioDuration(audio, knownDuration = 0) {
  const nativeDuration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
  const seekableDuration = audio.seekable?.length ? audio.seekable.end(audio.seekable.length - 1) : 0;
  return Math.max(nativeDuration, Number.isFinite(seekableDuration) ? seekableDuration : 0, knownDuration, audio.currentTime || 0);
}

function syncAudioRing(audio, prefix, knownDuration = 0) {
  const duration = effectiveAudioDuration(audio, knownDuration);
  const progress = duration > 0 ? Math.max(0, Math.min(100, audio.currentTime / duration * 100)) : 0;
  $(`#${prefix}-current`).textContent = formatAudioTime(audio.currentTime);
  $(`#${prefix}-duration`).textContent = formatAudioTime(duration);
  $(`#${prefix}-progress`).style.strokeDashoffset = String(100 - progress);
}

function seekAudioRing(audio, dial, event, knownDuration = 0) {
  if (event.target.closest('button')) return;
  const duration = effectiveAudioDuration(audio, knownDuration); if (!duration) return;
  const bounds = dial.getBoundingClientRect();
  const x = event.clientX - (bounds.left + bounds.width / 2); const y = event.clientY - (bounds.top + bounds.height / 2);
  let ratio = (Math.atan2(y, x) + Math.PI / 2) / (Math.PI * 2); if (ratio < 0) ratio += 1;
  audio.currentTime = ratio * duration; syncAudioRing(audio, dial.id.replace('-dial', ''), knownDuration);
}

function probeAudioDuration(audio, knownDuration, onReady) {
  const finish = () => onReady();
  if (knownDuration > 0 || (Number.isFinite(audio.duration) && audio.duration > 0)) { finish(); return; }
  const originalTime = audio.currentTime;
  const restore = () => { audio.currentTime = originalTime; finish(); };
  audio.addEventListener('durationchange', restore, { once: true });
  try { audio.currentTime = 1e101; } catch { finish(); }
}

function openVoicePlayer(voice, anchor) {
  closeImagePopover();
  const audio = $('#voice-player-audio'); audio.pause();
  state.voicePlayerKnownDuration = Math.max(0, Number(voice.durationMs) || 0) / 1000;
  audio.src = mediaUrl(voice.assetId); $('#voice-player-label').textContent = voiceDisplayLabel(voice);
  $('#voice-player-current').textContent = '00:00'; $('#voice-player-duration').textContent = '00:00';
  $('#voice-player-progress').style.strokeDashoffset = '100'; $('#voice-player-toggle').textContent = '▶';
  placePopover($('#voice-player-popover'), anchor);
}

function closeVoicePlayer() {
  const audio = $('#voice-player-audio'); audio.pause(); audio.removeAttribute('src'); audio.load(); $('#voice-player-popover').classList.add('hidden');
}

function toggleVoicePlayer() {
  const audio = $('#voice-player-audio');
  if (!audio.src) return;
  if (audio.paused) audio.play(); else audio.pause();
}

function updateStats() {
  if (!state.record) return;
  const text = state.record.blocks.filter((block) => block.type === 'paragraph').map((block) => block.text).join('');
  $('#word-count').textContent = text.replace(/\s/g, '').length.toLocaleString('zh-CN');
  $('#media-count').textContent = state.record.blocks.filter((block) => block.type !== 'paragraph').length
    + state.record.blocks.filter((block) => block.type === 'paragraph').reduce((sum, block) => sum + (block.voices?.length || 0) + (block.images?.length || 0), 0);
}

function annotationsFor(dateKey) {
  return state.annotations.filter((item) => item.date === dateKey || (item.scope === 'annual' && item.monthDay === dateKey.slice(5)));
}

async function refreshCalendarData() {
  const monthKey = localDateKey(state.calendarMonth).slice(0, 7);
  try {
    const [records, annotations] = await Promise.all([api.calendarRecords(monthKey), api.listAnnotations()]);
    state.calendarRecords = new Set(records); state.annotations = annotations; renderCalendar();
  } catch (error) { toast(`${state.language === 'zh' ? '日历读取失败' : 'Calendar load failed'}: ${error.message}`); }
}

function renderCalendar() {
  const year = state.calendarMonth.getFullYear(); const month = state.calendarMonth.getMonth();
  $('#calendar-title').textContent = t('calendarMonth', { year, month: month + 1 });
  const grid = $('#calendar-grid'); grid.replaceChildren();
  const first = new Date(year, month, 1, 12);
  const leading = (first.getDay() + 6) % 7;
  const start = addDays(first, -leading);
  for (let index = 0; index < 42; index += 1) {
    const date = addDays(start, index); const key = localDateKey(date);
    const annotations = annotationsFor(key);
    const button = document.createElement('span'); button.className = 'calendar-day'; button.title = annotations.map((item) => item.text).join('\n');
    const number = document.createElement('span'); number.className = 'calendar-number'; number.textContent = date.getDate(); button.append(number);
    if (annotations.length) {
      const label = document.createElement('small'); label.className = 'calendar-mark-label';
      label.textContent = `${annotations[0].text}${annotations.length > 1 ? ` +${annotations.length - 1}` : ''}`; button.append(label);
    }
    if (date.getMonth() !== month) button.classList.add('outside');
    if (key === localDateKey(new Date())) button.classList.add('today');
    if (state.kind === 'day' && key === state.date) button.classList.add('selected');
    if (state.calendarRecords.has(key)) button.classList.add('has-record');
    if (annotations.length) button.classList.add('has-mark');
    grid.append(button);
  }
}

function openAnnotation() {
  const date = state.kind === 'day' ? state.date : localDateKey(new Date());
  $('#annotation-date-title').textContent = `${displayDate(date)} · ${t('calendarMark')}`;
  $('#annotation-text').value = '';
  renderAnnotationList(date); showModal('annotation-modal');
}

function renderAnnotationList(date) {
  const container = $('#annotation-list'); container.replaceChildren();
  const items = annotationsFor(date);
  items.forEach((item) => {
    const row = document.createElement('div'); row.className = 'annotation-item';
    const text = document.createElement('span'); text.textContent = item.text;
    const scope = document.createElement('em'); scope.textContent = item.scope === 'annual' ? (state.language === 'zh' ? '每年' : 'Annual') : item.date;
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = t('delete');
    remove.addEventListener('click', async () => { await api.deleteAnnotation(item.id); state.annotations = await api.listAnnotations(); renderAnnotationList(date); renderCalendar(); });
    row.append(text, scope, remove); container.append(row);
  });
}

function renderLocation() {
  const location = state.record?.location;
  $('#location-name').textContent = location?.name || t('noLocation');
  const positioned = Number.isFinite(location?.latitude) && Number.isFinite(location?.longitude);
  if (positioned) {
    state.earthRotation.longitude = location.longitude;
    state.earthRotation.latitude = location.latitude;
  }
  drawEarth();
}

function setupEarth() {
  const canvas = $('#earth');
  let drag = null;
  canvas.addEventListener('pointerdown', (event) => {
    drag = { x: event.clientX, y: event.clientY, longitude: state.earthRotation.longitude, latitude: state.earthRotation.latitude };
    canvas.setPointerCapture(event.pointerId); canvas.classList.add('dragging');
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    state.earthRotation.longitude = ((drag.longitude - (event.clientX - drag.x) * .55 + 540) % 360) - 180;
    state.earthRotation.latitude = Math.max(-75, Math.min(75, drag.latitude + (event.clientY - drag.y) * .38));
    drawEarth();
  });
  const finish = () => { drag = null; canvas.classList.remove('dragging'); };
  canvas.addEventListener('pointerup', finish); canvas.addEventListener('pointercancel', finish);
}

function projectEarth(longitude, latitude, radius) {
  const lambda = (longitude - state.earthRotation.longitude) * Math.PI / 180;
  const phi = latitude * Math.PI / 180;
  const tilt = state.earthRotation.latitude * Math.PI / 180;
  const x = Math.cos(phi) * Math.sin(lambda);
  const y = -Math.sin(phi); const z = Math.cos(phi) * Math.cos(lambda);
  return { x: x * radius, y: (y * Math.cos(tilt) + z * Math.sin(tilt)) * radius, visible: (-y * Math.sin(tilt) + z * Math.cos(tilt)) > 0 };
}

function strokeEarthLines(ctx, lines, radius, color, width) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
  for (const line of lines || []) {
    let drawing = false;
    for (const coordinate of line) {
      const point = projectEarth(coordinate[0], coordinate[1], radius);
      if (!point.visible) { drawing = false; continue; }
      if (!drawing) { ctx.moveTo(point.x, point.y); drawing = true; } else ctx.lineTo(point.x, point.y);
    }
  }
  ctx.stroke();
}

function drawEarth() {
  const canvas = $('#earth'); const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 300, 300); ctx.save(); ctx.translate(150, 150);
  const radius = 116;
  const glow = ctx.createRadialGradient(-30, -35, 10, 0, 0, radius);
  glow.addColorStop(0, 'rgba(81,211,255,.11)'); glow.addColorStop(.72, 'rgba(20,104,153,.045)'); glow.addColorStop(1, 'rgba(40,188,238,.015)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0,0,radius,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = 'rgba(98,216,255,.48)'; ctx.lineWidth = 1.2; ctx.shadowColor = '#5bd6ff'; ctx.shadowBlur = 9; ctx.beginPath(); ctx.arc(0,0,radius,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.save(); ctx.beginPath(); ctx.arc(0,0,radius,0,Math.PI*2); ctx.clip();
  ctx.strokeStyle = 'rgba(91,198,237,.12)'; ctx.lineWidth = .5;
  for (let lat = -60; lat <= 60; lat += 30) {
    const coordinates = []; for (let lon = -180; lon <= 180; lon += 3) coordinates.push([lon,lat]);
    strokeEarthLines(ctx,[coordinates],radius,'rgba(91,198,237,.11)',.5);
  }
  for (let lon = -180; lon < 180; lon += 30) {
    const coordinates = []; for (let lat = -90; lat <= 90; lat += 3) coordinates.push([lon,lat]);
    strokeEarthLines(ctx,[coordinates],radius,'rgba(91,198,237,.11)',.5);
  }
  strokeEarthLines(ctx,state.earthData?.land,radius,'rgba(91,220,247,.7)',1.05);
  strokeEarthLines(ctx,state.earthData?.countries,radius,'rgba(112,187,220,.34)',.55);
  const location = state.record?.location;
  if (Number.isFinite(location?.latitude) && Number.isFinite(location?.longitude)) {
    const point = projectEarth(location.longitude, location.latitude, radius);
    if (point.visible) { ctx.fillStyle = '#ffd67a'; ctx.shadowColor = '#ffd67a'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(point.x,point.y,3.5,0,Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; }
  }
  ctx.restore(); ctx.restore();
}

const starPositions = [
  [50,50],[40,50],[60,50],[50,34],[50,66],
  [50,8],[78,20],[92,48],[80,78],[50,92],[20,78],[8,48]
];
async function renderConstellation() {
  const container = $('#constellation'); const svg = $('#constellation-lines');
  container.querySelectorAll('.star-node').forEach((node) => node.remove()); svg.replaceChildren();
  const connections = [[0,1],[0,2],[1,3],[1,4],[2,3],[2,4],[3,5],[3,6],[2,7],[4,8],[4,9],[1,10],[1,11],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,5]];
  connections.forEach(([a,b]) => { const line = document.createElementNS('http://www.w3.org/2000/svg','line'); line.setAttribute('x1',starPositions[a][0]); line.setAttribute('y1',starPositions[a][1]); line.setAttribute('x2',starPositions[b][0]); line.setAttribute('y2',starPositions[b][1]); svg.append(line); });
  state.stars.forEach((star, index) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = `star-node ${star.lit ? 'lit' : ''} ${index === 0 ? 'center' : ''}`; button.style.left = `${starPositions[index][0]}%`; button.style.top = `${starPositions[index][1]}%`; button.setAttribute('aria-label', state.language === 'zh' ? `纪念星位 ${index + 1}` : `Memorial star ${index + 1}`);
    const glyph = document.createElement('span'); glyph.className = 'star-glyph'; button.append(glyph);
    if (star.lit && star.firstLitAt) {
      const date = new Date(star.firstLitAt);
      const dateLabel = Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(state.language === 'zh' ? 'zh-CN' : 'en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
      if (dateLabel) {
        const tooltip = document.createElement('span'); tooltip.className = 'star-date'; tooltip.textContent = dateLabel; button.title = dateLabel; button.append(tooltip);
        button.addEventListener('pointerenter', () => button.classList.add('date-visible'));
        button.addEventListener('pointerleave', () => button.classList.remove('date-visible'));
        button.addEventListener('focus', () => button.classList.add('date-visible'));
        button.addEventListener('blur', () => button.classList.remove('date-visible'));
      }
    }
    button.addEventListener('click', async () => {
      button.disabled = true;
      button.classList.add('remembering');
      try {
        state.stars = await api.updateConstellation({ id: star.id, remember: true });
        setTimeout(renderConstellation, 1100);
      } catch (error) { button.disabled = false; button.classList.remove('remembering'); toast(t('recordError', { message: error.message })); }
    });
    container.append(button);
  });
}

function seededRandom(initialSeed) {
  let seed = initialSeed >>> 0;
  return () => {
    seed += 0x6D2B79F5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createCosmosPainter(canvas, { seed, density, nebulaStrength, deferMs = 0, resizeDelay = 100 }) {
  const ctx = canvas.getContext('2d');
  let stars = []; let background = null; let width = 0; let height = 0; let resizeTimer; let ready = deferMs <= 0;
  function gaussian(random) { return (random() + random() + random() + random() - 2) / 2; }
  function resize() {
    if (canvas.id === 'history-cosmos' && (document.body.classList.contains('timeline-dragging') || document.body.classList.contains('timeline-scrolling'))) { scheduleResize(); return; }
    const bounds = canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(bounds.width)); const nextHeight = Math.max(1, Math.round(bounds.height));
    if (nextWidth === width && nextHeight === height && background) return;
    width = nextWidth; height = nextHeight;
    const scale = Math.min(devicePixelRatio, 1.25); canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale); ctx.setTransform(scale,0,0,scale,0,0);
    const random = seededRandom(seed + width * 17 + height * 31);
    background = document.createElement('canvas'); background.width = width; background.height = height;
    const back = background.getContext('2d');
    const voidGradient = back.createRadialGradient(width*.56,height*.43,0,width*.56,height*.43,Math.max(width,height)*.82);
    voidGradient.addColorStop(0,'#050816'); voidGradient.addColorStop(.34,'#02040c'); voidGradient.addColorStop(.72,'#010207'); voidGradient.addColorStop(1,'#000');
    back.fillStyle = voidGradient; back.fillRect(0,0,width,height);
    const palettes = [[48,74,174],[105,52,157],[21,120,166],[139,45,111],[29,139,145],[180,72,92],[72,93,192]];
    function cloudAt(x, y, rx, ry, color, alpha, rotation = -.42) {
      back.save(); back.translate(x,y); back.rotate(rotation + (random()-.5)*.5); back.scale(rx,ry);
      const cloud = back.createRadialGradient(0,0,0,0,0,1);
      cloud.addColorStop(0,`rgba(${color[0]},${color[1]},${color[2]},${alpha})`);
      cloud.addColorStop(.22,`rgba(${color[0]},${color[1]},${color[2]},${alpha*.76})`);
      cloud.addColorStop(.56,`rgba(${color[0]},${color[1]},${color[2]},${alpha*.24})`);
      cloud.addColorStop(1,`rgba(${color[0]},${color[1]},${color[2]},0)`);
      back.fillStyle = cloud; back.beginPath(); back.arc(0,0,1,0,Math.PI*2); back.fill(); back.restore();
    }
    for (let index = 0; index < 92; index += 1) {
      const color = palettes[Math.floor(random()*palettes.length)];
      const x = width * (-.05 + random()*1.1); const diagonal = height * (.82 - (x / width) * .58);
      const y = diagonal + gaussian(random) * height * .19;
      cloudAt(x, y, width*(.07+random()*.18), height*(.018+random()*.075), color, (.012+random()*.032)*nebulaStrength, -.5);
    }
    for (let index = 0; index < 24; index += 1) {
      const color = palettes[Math.floor(random()*palettes.length)];
      cloudAt(random()*width, random()*height, width*(.08+random()*.18), height*(.05+random()*.13), color, (.008+random()*.02)*nebulaStrength, random()*Math.PI);
    }
    for (let index = 0; index < 30; index += 1) {
      const x = width * (-.05 + random()*1.1); const diagonal = height * (.81 - (x / width) * .58);
      cloudAt(x, diagonal + gaussian(random)*height*.08, width*(.04+random()*.11), height*(.008+random()*.025), [0,0,2], .12+random()*.16, -.5);
    }
    back.save();
    back.filter = `blur(${Math.max(6, Math.min(18, width / 170))}px)`;
    for (let lane = 0; lane < 4; lane += 1) {
      const offset = (lane - 1.5) * height * .025;
      back.strokeStyle = `rgba(0,1,8,${.16 + lane * .025})`;
      back.lineWidth = height * (.012 + lane * .004);
      back.beginPath();
      back.moveTo(-width*.08, height*(.88 + lane*.015));
      back.bezierCurveTo(width*.24, height*(.72 + lane*.012), width*.58, height*(.53 - lane*.018), width*1.08, height*(.18 + lane*.02));
      back.stroke();
    }
    back.restore();
    const dustCount = Math.floor(width * height / 650 * Math.max(.45, nebulaStrength));
    for (let index = 0; index < dustCount; index += 1) {
      const x = random()*width; const band = height*(.82-(x/width)*.58); const spread = gaussian(random)*height*.2;
      const y = band + spread; if (y < 0 || y > height) continue;
      const size = random() < .975 ? .2 + random()*.55 : .9 + random()*1.7;
      back.globalAlpha = .05 + random()*.34; back.fillStyle = random()>.86 ? '#badcff' : random()>.93 ? '#ffe9c1' : '#e7efff'; back.beginPath(); back.arc(x,y,size,0,Math.PI*2); back.fill();
    }
    const staticCount = Math.floor(width * height / Math.max(360, density*.76));
    for (let index = 0; index < staticCount; index += 1) {
      const x = random()*width; const y = random()*height; const radius = random()>.992 ? .9+random()*1.1 : .15+random()*.48;
      back.globalAlpha = .12+random()*.55; back.fillStyle = random()>.92 ? '#ffe6bd' : random()>.76 ? '#b8d8ff' : '#f2f6ff'; back.beginPath(); back.arc(x,y,radius,0,Math.PI*2); back.fill();
    }
    const clusterCount = Math.max(3, Math.round(3*nebulaStrength));
    for (let cluster = 0; cluster < clusterCount; cluster += 1) {
      const cx = random()*width; const cy = random()*height; const radius = Math.min(width,height)*(.025+random()*.055);
      for (let index = 0; index < 95; index += 1) {
        const angle = random()*Math.PI*2; const distance = Math.abs(gaussian(random))*radius;
        const x = cx+Math.cos(angle)*distance; const y = cy+Math.sin(angle)*distance;
        back.globalAlpha = .13+random()*.55; back.fillStyle = random()>.75 ? '#c3dcff' : '#fff'; back.beginPath(); back.arc(x,y,.18+random()*.5,0,Math.PI*2); back.fill();
      }
    }
    if (nebulaStrength > 1) {
      for (let galaxy = 0; galaxy < 5; galaxy += 1) {
        const gx = (.08 + random()*.84)*width; const gy = (.08 + random()*.84)*height;
        const radius = Math.min(width,height)*(.008+random()*.016);
        back.save(); back.translate(gx,gy); back.rotate(random()*Math.PI); back.scale(1,.22+random()*.25);
        const halo = back.createRadialGradient(0,0,0,0,0,radius);
        halo.addColorStop(0,'rgba(255,238,204,.32)'); halo.addColorStop(.12,'rgba(202,220,255,.16)'); halo.addColorStop(.55,'rgba(105,136,210,.055)'); halo.addColorStop(1,'rgba(70,92,160,0)');
        back.globalAlpha = .45; back.fillStyle = halo; back.beginPath(); back.arc(0,0,radius,0,Math.PI*2); back.fill(); back.restore();
      }
    }
    back.globalAlpha = 1;
    const count = Math.max(160, Math.floor(width * height / (density*2.35)));
    const starColors = ['#ffffff','#d9ecff','#b9d4ff','#fff1ce','#a9e6ff'];
    stars = Array.from({ length: count }, () => {
      const bright = random() > .985;
      return { x: random()*width, y: random()*height, r: bright ? .9+random()*1.2 : .2+random()*.7, a: bright ? .66+random()*.25 : .16+random()*.52, color: starColors[Math.floor(random()*starColors.length)], bright };
    });
    paint();
  }
  function paint() {
    ctx.clearRect(0,0,width,height); if (background) ctx.drawImage(background,0,0,width,height);
    stars.forEach((star) => {
      ctx.globalAlpha = star.a; ctx.fillStyle = star.color;
      if (star.bright) { ctx.shadowColor = star.color; ctx.shadowBlur = 9; }
      ctx.beginPath(); ctx.arc(star.x,star.y,star.r,0,Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
      if (star.bright) {
        const flare = star.r*2.8; ctx.globalAlpha *= .24; ctx.strokeStyle = star.color; ctx.lineWidth = .4; ctx.beginPath(); ctx.moveTo(star.x-flare,star.y); ctx.lineTo(star.x+flare,star.y); ctx.moveTo(star.x,star.y-flare); ctx.lineTo(star.x,star.y+flare); ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  }
  const scheduleResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, resizeDelay); };
  new ResizeObserver(() => { if (ready) scheduleResize(); }).observe(canvas);
  if (ready) resize();
  else {
    const prepare = () => { ready = true; resize(); };
    setTimeout(() => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(prepare, { timeout: 800 });
      else prepare();
    }, deferMs);
  }
}

function setupCosmos() {
  createCosmosPainter($('#starfield'), { seed: 731994, density: 1450, nebulaStrength: 1.35 });
  createCosmosPainter($('#history-cosmos'), { seed: 810163, density: 2200, nebulaStrength: .62, resizeDelay: 800 });
  createCosmosPainter($('#sky-cosmos'), { seed: 120819, density: 1100, nebulaStrength: 2.2, deferMs: 1200 });
}

let historyTimer;
let historyLoadSerial = 0;
let historyScheduledSelection = '';
let chronologyTweenFrame = 0;
let chronologySettleTimer;
let chronologyDrawFrame = 0;

function stopChronologyTween() {
  if (chronologyTweenFrame) cancelAnimationFrame(chronologyTweenFrame);
  chronologyTweenFrame = 0; document.body.classList.remove('timeline-scrolling');
}

function clampTimelineOffset(value) {
  const first = state.timelineMarkers?.[0]?.y ?? 0;
  const last = state.timelineMarkers?.at(-1)?.y ?? first;
  return Math.max(first, Math.min(last, Number(value) || 0));
}

function scheduleChronologyDraw() {
  if (chronologyDrawFrame) return;
  chronologyDrawFrame = requestAnimationFrame(() => { chronologyDrawFrame = 0; drawChronology(); });
}

function drawChronology() {
  const canvas = $('#timeline-scale-canvas');
  const container = $('#chronology');
  const bounds = container.getBoundingClientRect();
  const width = Math.max(1, Math.round(bounds.width));
  const height = Math.max(1, Math.round(bounds.height));
  const scale = Math.min(devicePixelRatio, 1.25);
  if (canvas.width !== Math.round(width * scale) || canvas.height !== Math.round(height * scale)) {
    canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0); ctx.clearRect(0, 0, width, height);
  const markers = state.timelineMarkers || [];
  if (!markers.length) return;
  const railX = width < 280 ? 106 : 120;
  const centerY = height / 2;
  const rail = ctx.createLinearGradient(0, 0, 0, height);
  rail.addColorStop(0, 'rgba(177,211,226,.04)'); rail.addColorStop(.12, 'rgba(203,228,239,.58)'); rail.addColorStop(.88, 'rgba(203,228,239,.58)'); rail.addColorStop(1, 'rgba(177,211,226,.04)');
  ctx.fillStyle = rail; ctx.fillRect(railX, 0, 1, height);
  const lower = state.timelineOffset - centerY - 64;
  const upper = state.timelineOffset + centerY + 64;
  let low = 0; let high = markers.length;
  while (low < high) { const middle = (low + high) >> 1; if (markers[middle].y < lower) low = middle + 1; else high = middle; }
  const activeId = `${state.timelineSelection?.kind}:${state.timelineSelection?.key}`;
  for (let index = low; index < markers.length; index += 1) {
    const marker = markers[index]; if (marker.y > upper) break;
    const y = centerY + marker.y - state.timelineOffset;
    const active = `${marker.kind}:${marker.key}` === activeId;
    ctx.save();
    if (marker.kind === 'year') {
      ctx.strokeStyle = active ? 'rgba(231,249,255,.92)' : 'rgba(175,205,218,.34)'; ctx.lineWidth = active ? 1.5 : 1;
      ctx.beginPath(); ctx.moveTo(Math.max(10, railX - 38), y); ctx.lineTo(width - 12, y); ctx.stroke();
      ctx.translate(railX, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#071015'; ctx.strokeStyle = active ? '#e6f9ff' : 'rgba(183,215,228,.6)'; ctx.lineWidth = active ? 1.5 : 1; ctx.fillRect(-7,-7,14,14); ctx.strokeRect(-7,-7,14,14); ctx.rotate(-Math.PI / 4); ctx.translate(-railX, -y);
      ctx.fillStyle = active ? '#f0f7fa' : '#c7d6dd'; ctx.font = '15px ui-monospace, monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(marker.key, railX - 25, y);
    } else {
      const length = active ? 68 : marker.monthStart ? 54 : marker.fifth ? 34 : 20;
      ctx.strokeStyle = active ? '#e6f9ff' : marker.monthStart ? 'rgba(205,228,237,.8)' : marker.fifth ? 'rgba(175,207,219,.58)' : 'rgba(155,190,205,.4)';
      ctx.lineWidth = active || marker.monthStart ? 1.5 : 1; ctx.beginPath(); ctx.moveTo(railX, y); ctx.lineTo(railX + length, y); ctx.stroke();
      const labelX = railX + 66; const labelWidth = 58;
      ctx.fillStyle = active ? 'rgba(9,21,27,.98)' : 'rgba(1,5,8,.8)'; ctx.strokeStyle = active ? 'rgba(188,229,246,.52)' : 'rgba(143,190,210,.12)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(labelX, y - 13, labelWidth, 26, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = active ? '#edfaff' : '#b8cbd3'; ctx.font = '13px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(marker.shortLabel, labelX + labelWidth / 2, y + .5);
    }
    ctx.restore();
  }
}

function centerChronologyMarker(marker, animated = true) {
  clearTimeout(chronologySettleTimer);
  const target = clampTimelineOffset(marker.y);
  const start = clampTimelineOffset(state.timelineOffset); const distance = target - start;
  stopChronologyTween();
  if (!animated || Math.abs(distance) < 1) { state.timelineOffset = target; scheduleChronologyDraw(); return; }
  document.body.classList.add('timeline-scrolling');
  const startedAt = performance.now(); const duration = Math.min(260, Math.max(140, Math.abs(distance) * .24));
  const step = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - (1 - progress) ** 3;
    state.timelineOffset = start + distance * eased; drawChronology();
    if (progress < 1) chronologyTweenFrame = requestAnimationFrame(step);
    else { chronologyTweenFrame = 0; state.timelineOffset = target; document.body.classList.remove('timeline-scrolling'); drawChronology(); }
  };
  chronologyTweenFrame = requestAnimationFrame(step);
}

async function configureTimeline() {
  state.historyIndex = await api.recordIndex();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  renderChronology();
  const lastDay = state.historyIndex.days.at(-1);
  const lastYear = state.historyIndex.years.at(-1);
  if (lastDay) selectTimeline('day', lastDay, true);
  else selectTimeline('year', lastYear || String(new Date().getFullYear()), true);
}

function renderChronology() {
  stopChronologyTween();
  const currentYear = new Date().getFullYear();
  const dataYears = [...state.historyIndex.years.map(Number), ...state.historyIndex.days.map((key) => Number(key.slice(0, 4)))].filter(Number.isFinite);
  const minYear = dataYears.length ? Math.min(...dataYears) : currentYear;
  const maxYear = Math.max(currentYear, ...(dataYears.length ? dataYears : [currentYear]));
  const markers = [];
  const daysByYear = new Map();
  state.historyIndex.days.forEach((key) => {
    const year = Number(key.slice(0, 4));
    if (!daysByYear.has(year)) daysByYear.set(year, []);
    daysByYear.get(year).push(key);
  });
  daysByYear.forEach((keys) => keys.sort());
  let cursorY = 0;
  const dayOffset = 76;
  const dayStep = 42;
  const yearTail = 96;
  const emptyYearGap = 168;

  for (let year = minYear; year <= maxYear; year += 1) {
    const y = cursorY;
    markers.push({ kind: 'year', key: String(year), y });
    const yearDays = daysByYear.get(year) || [];
    let previousMonth = -1;
    yearDays.forEach((key, index) => {
      const date = dateFromKey(key);
      const dayY = y + dayOffset + index * dayStep;
      const monthStart = date.getMonth() !== previousMonth;
      previousMonth = date.getMonth();
      const fifth = date.getDate() % 5 === 0;
      const shortLabel = `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
      markers.push({ kind: 'day', key, y: dayY, shortLabel, monthStart, fifth });
    });
    cursorY += yearDays.length ? dayOffset + Math.max(0, yearDays.length - 1) * dayStep + yearTail : emptyYearGap;
  }

  state.timelineMarkers = markers.sort((a, b) => a.y - b.y || (a.kind === 'year' ? -1 : 1));
  state.timelineMarkerMap = new Map(state.timelineMarkers.map((marker) => [`${marker.kind}:${marker.key}`, marker]));
  state.timelineOffset = clampTimelineOffset(state.timelineOffset);
  $('#day-scale-legend').classList.toggle('hidden', state.historyIndex.days.length === 0);
  $('#chronology').classList.toggle('years-only', state.historyIndex.days.length === 0);
  scheduleChronologyDraw();
  if (state.timelineSelection) updateTimelineCursor(false);
}

function nearestTimelineMarker(value = state.timelineOffset) {
  const markers = state.timelineMarkers;
  if (!markers?.length) return;
  let low = 0; let high = markers.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (markers[middle].y < value) low = middle + 1;
    else high = middle;
  }
  const after = markers[low]; const before = markers[Math.max(0, low - 1)];
  return Math.abs(before.y - value) <= Math.abs(after.y - value) ? before : after;
}

function nearestTimelineMarkerAtCenter() { return nearestTimelineMarker(state.timelineOffset); }

function selectNearestTimelineMarker(nearest = nearestTimelineMarkerAtCenter()) {
  if (!nearest) return;
  if (state.timelineSelection?.kind === nearest.kind && state.timelineSelection?.key === nearest.key) return nearest;
  state.timelineSelection = { kind: nearest.kind, key: nearest.key };
  $('#timeline-date').textContent = nearest.kind === 'year' ? nearest.key : nearest.key.replaceAll('-', '.');
  scheduleChronologyDraw();
  return nearest;
}

function selectTimeline(kind, key, center = false, loadDelay = center ? 500 : 100) {
  state.timelineSelection = { kind, key };
  $('#timeline-date').textContent = kind === 'year' ? key : key.replaceAll('-', '.');
  updateTimelineCursor(center);
  clearTimeout(historyTimer);
  const selectionId = `${kind}:${key}`; historyScheduledSelection = selectionId;
  historyTimer = setTimeout(() => {
    if (historyScheduledSelection !== selectionId) return;
    historyScheduledSelection = ''; loadHistoryRecord(kind, key);
  }, loadDelay);
}

function updateTimelineCursor(center) {
  const selection = state.timelineSelection;
  const marker = state.timelineMarkerMap?.get(`${selection?.kind}:${selection?.key}`);
  if (!marker) return;
  scheduleChronologyDraw();
  if (center) centerChronologyMarker(marker, true);
}

function setupTimelineCanvas() {
  new ResizeObserver(scheduleChronologyDraw).observe($('#chronology'));
}

async function loadHistoryRecord(kind, key) {
  const serial = ++historyLoadSerial;
  const preview = $('#history-preview');
  preview.innerHTML = `<div class="history-empty"><p>${t('historyLoading')}</p></div>`;
  try {
    const record = await api.getRecord(kind, key);
    if (serial !== historyLoadSerial) return;
    const hasContent = record.blocks.some((block) => block.type !== 'paragraph' || block.text.trim() || block.voices?.length || block.images?.length);
    preview.replaceChildren();
    preview.classList.toggle('is-empty', !hasContent);
    const heading = document.createElement('header'); heading.className = 'history-record-heading';
    const title = document.createElement('h2'); title.textContent = record.title;
    const meta = document.createElement('div'); meta.className = 'preview-meta'; meta.textContent = [...record.tags, record.location?.name].filter(Boolean).join(' · ');
    heading.append(title, meta);
    const body = document.createElement('div'); body.className = 'history-record-body';
    preview.append(heading, body);
    if (!hasContent) { const empty = document.createElement('div'); empty.className = 'history-empty'; empty.innerHTML = `<p>${t('historyEmpty')}</p>`; body.append(empty); return; }
    record.blocks.forEach((block) => {
      if (block.type === 'paragraph') { const text = document.createElement('div'); text.className = 'preview-text'; renderInlineMedia(text, block); body.append(text); }
      if (block.type === 'image') body.append(createImageToken({ ...block, label: imageDisplayLabel(block) }, 'preview-image-token'));
      if (block.type === 'audio') body.append(createVoiceToken({ ...block, label: voiceDisplayLabel(block) }, 'preview-voice-token'));
    });
  } catch (error) { if (serial === historyLoadSerial) preview.innerHTML = `<div class="history-empty"><p>${t('historyReadFailed', { message: escapeText(error.message) })}</p></div>`; }
}

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = bytes; let unit = -1;
  do { size /= 1024; unit += 1; } while (size >= 1024 && unit < units.length - 1);
  return `${size >= 100 ? size.toFixed(0) : size >= 10 ? size.toFixed(1) : size.toFixed(2)} ${units[unit]}`;
}

function renderLibraryBreadcrumb() {
  const container = $('#library-breadcrumb');
  container.replaceChildren();
  const parts = state.libraryPath ? state.libraryPath.split('/') : [];
  const root = document.createElement('button'); root.type = 'button'; root.textContent = t('sealedArchive'); root.addEventListener('click', () => loadLibrary('', ''));
  container.append(root);
  parts.forEach((part, index) => {
    const separator = document.createElement('span'); separator.textContent = '/';
    const button = document.createElement('button'); button.type = 'button'; button.textContent = part;
    button.addEventListener('click', () => loadLibrary(parts.slice(0, index + 1).join('/'), ''));
    container.append(separator, button);
  });
}

function selectLibraryEntry(entry, row) {
  state.librarySelected = entry;
  $$('.library-row').forEach((item) => item.classList.toggle('selected', item === row));
  ['#library-open', '#library-export'].forEach((selector) => { $(selector).disabled = !entry; });
}

function renderLibraryEntries(result) {
  const list = $('#library-list'); list.replaceChildren();
  state.libraryEntries = result.entries; state.librarySelected = null;
  ['#library-open', '#library-export'].forEach((selector) => { $(selector).disabled = true; });
  if (!result.entries.length) {
    const empty = document.createElement('div'); empty.className = 'library-empty'; empty.textContent = t('libraryEmpty'); list.append(empty);
  }
  result.entries.forEach((entry) => {
    const row = document.createElement('button'); row.type = 'button'; row.className = 'library-row'; row.setAttribute('role', 'option');
    const icon = document.createElement('i'); icon.className = entry.directory ? 'library-folder-icon' : 'library-file-icon';
    const name = document.createElement('strong'); name.textContent = entry.name;
    const type = document.createElement('span'); type.textContent = entry.directory ? '' : (entry.extension.replace('.', '').toUpperCase() || 'FILE');
    const size = document.createElement('span'); size.textContent = entry.directory ? '—' : formatBytes(entry.size);
    const modified = document.createElement('time'); modified.dateTime = entry.modifiedAt; modified.textContent = new Intl.DateTimeFormat(state.language === 'zh' ? 'zh-CN' : 'en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(entry.modifiedAt));
    row.append(icon, name, type, size, modified);
    row.addEventListener('click', () => selectLibraryEntry(entry, row));
    row.addEventListener('dblclick', () => entry.directory ? loadLibrary(entry.relative, '') : api.openLibraryItem(entry.relative).catch((error) => toast(error.message)));
    list.append(row);
  });
  state.libraryListing = { visible: result.entries.length, total: result.total, truncated: result.truncated };
  renderLibraryStatus();
}

function renderLibraryStatus() {
  const listing = state.libraryListing || { visible: 0, total: 0, truncated: false };
  const visibleText = listing.truncated ? `${listing.visible} / ${listing.total}` : String(listing.total);
  const totalText = state.libraryStatus ? ` · ${state.libraryStatus.files.toLocaleString()} · ${formatBytes(state.libraryStatus.bytes)}` : '';
  $('#library-status').textContent = `${state.libraryStatus?.sealed ? 'AES-256 · ' : ''}${visibleText}${totalText}`;
}

async function loadLibrary(relative = state.libraryPath, query = state.libraryQuery) {
  const serial = (state.libraryLoadSerial || 0) + 1; state.libraryLoadSerial = serial;
  state.libraryPath = relative || ''; state.libraryQuery = query || '';
  $('#library-filter').value = state.libraryQuery;
  renderLibraryBreadcrumb();
  $('#library-list').innerHTML = '<div class="library-empty">…</div>';
  try {
    const result = await api.listLibrary(state.libraryPath, state.libraryQuery);
    if (serial !== state.libraryLoadSerial) return;
    state.libraryPath = result.relative; renderLibraryBreadcrumb(); renderLibraryEntries(result);
    $('#library-back').disabled = !state.libraryPath;
    api.libraryStatus().then((status) => { if (serial === state.libraryLoadSerial) { state.libraryStatus = status; renderLibraryStatus(); } }).catch(() => undefined);
  } catch (error) { if (serial === state.libraryLoadSerial) $('#library-list').innerHTML = `<div class="library-empty">${escapeText(error.message)}</div>`; }
}

function setArchiveMode(mode) {
  state.archiveMode = mode === 'library' ? 'library' : 'records';
  const library = state.archiveMode === 'library';
  $('#history-records-view').classList.toggle('hidden', library);
  $('#library-view').classList.toggle('hidden', !library);
  $('#archive-records-mode').classList.toggle('active', !library); $('#archive-records-mode').ariaSelected = String(!library);
  $('#archive-library-mode').classList.toggle('active', library); $('#archive-library-mode').ariaSelected = String(library);
  $('#import-legacy').classList.toggle('hidden', library);
  if (library) loadLibrary(state.libraryPath, state.libraryQuery);
  else { renderChronology(); if (state.timelineSelection) updateTimelineCursor(true); }
}

function showHistory() {
  hideModal('history-gate'); document.body.classList.add('history-open'); $('#history').classList.remove('hidden'); $('#history').setAttribute('aria-hidden','false');
  dispatchEvent(new Event('resize'));
  setArchiveMode('records');
  configureTimeline().catch((error) => toast(t('historyReadFailed', { message: error.message })));
}
function hideHistory() {
  if (state.exportBusy) { toast(state.language === 'zh' ? '导出进行中' : 'Export in progress'); return; }
  stopChronologyTween(); clearTimeout(chronologySettleTimer); clearTimeout(historyTimer); historyScheduledSelection = ''; historyLoadSerial += 1; document.body.classList.remove('timeline-dragging','timeline-scrolling');
  $('#history').classList.add('hidden'); $('#history').setAttribute('aria-hidden','true'); document.body.classList.remove('history-open'); state.historyUnlocked = false; api.lockInner();
}

function applyAuthStatus(status) {
  state.innerConfigured = Boolean(status.innerConfigured);
  const setup = !status.configured;
  const trusted = !setup && Boolean(status.trusted);
  state.deviceTrusted = trusted;
  $('#secret-input').autocomplete = setup ? 'new-password' : 'current-password';
  $('#auth-form').dataset.setup = setup ? 'true' : 'false';
  $('#auth-form').dataset.trusted = trusted ? 'true' : 'false';
  $('#auth-secret-field').classList.toggle('hidden', trusted);
  $('#secret-input').required = !trusted;
  $('#identity-input').readOnly = trusted;
  if (trusted) {
    $('#identity-input').value = status.identity || '';
    $('#secret-input').value = '';
  }
  renderDeviceTrust();
}

async function initializeAuth() {
  applyAuthStatus(await api.authStatus());
}

function configureHistoryGate() {
  const setup = !state.innerConfigured;
  $('#inner-auth-form').dataset.setup = setup ? 'true' : 'false';
  $('#inner-auth-title').dataset.i18n = setup ? 'setupHistoryAccess' : 'verifyPast';
  $('#inner-auth-title').textContent = t(setup ? 'setupHistoryAccess' : 'verifyPast');
  $('#inner-auth-submit').dataset.i18n = setup ? 'saveAndEnter' : 'verify';
  $('#inner-auth-submit').textContent = t(setup ? 'saveAndEnter' : 'verify');
  $('#inner-secret').autocomplete = setup ? 'new-password' : 'current-password';
}

async function enterApp() {
  $('#auth-screen').classList.add('hidden'); $('#app').classList.remove('hidden');
  [state.annotations, state.stars, state.earthData] = await Promise.all([api.listAnnotations(), api.getConstellation(), api.getEarthOutlines()]);
  renderConstellation(); await loadRecord('day', localDateKey(new Date()));
}

function bindEvents() {
  $('#auth-form').addEventListener('submit', async (event) => {
    event.preventDefault(); const setup = event.currentTarget.dataset.setup === 'true'; const trusted = event.currentTarget.dataset.trusted === 'true'; const identity = $('#identity-input').value.trim(); const secret = $('#secret-input').value; $('#auth-error').textContent = '';
    try {
      if (setup) {
        await api.authSetup({ identity, secret });
      } else if (trusted) {
        const result = await api.authTrustedEnter();
        if (!result.ok) {
          applyAuthStatus(await api.authStatus());
          throw new Error(t('trustedEnterFailed'));
        }
      } else { const result = await api.authVerify(secret, 'main', identity); if (!result.ok) throw new Error(result.retryAfterMs > 500 ? `${t('authFailed')} · ${Math.ceil(result.retryAfterMs / 1000)}s` : t('authFailed')); }
      await enterApp();
    } catch (error) { $('#auth-error').textContent = error.message; }
  });
  $$('.mode-switch [data-mode]').forEach((button) => button.addEventListener('click', () => {
    const kind = button.dataset.mode; const date = kind === 'day' ? localDateKey(new Date()) : String(new Date().getFullYear()); loadRecord(kind,date);
  }));
  $$('.language-toggle').forEach((button) => button.addEventListener('click', toggleLanguage));
  $('#trust-device').addEventListener('click', async (event) => {
    const button = event.currentTarget; button.disabled = true;
    try {
      const result = await api.setDeviceTrust(!state.deviceTrusted);
      state.deviceTrusted = Boolean(result.trusted); renderDeviceTrust();
      toast(t(state.deviceTrusted ? 'trustEnabled' : 'trustDisabled'));
    } catch (error) { toast(t('trustFailed', { message: error.message })); }
    finally { button.disabled = false; }
  });
  $('#record-title').addEventListener('input', (event) => { state.record.title = event.target.value; markDirty(); });
  $('#tag-form').addEventListener('submit', (event) => { event.preventDefault(); const input = $('#tag-input'); const value = input.value.trim(); if (value && !state.record.tags.includes(value) && state.record.tags.length < 30) { state.record.tags.push(value); input.value = ''; renderTags(); markDirty(); } });
  $('#add-paragraph').addEventListener('click', addParagraph); $('#add-image').addEventListener('click', beginImageInsert); $('#add-audio').addEventListener('click', startRecording);
  $('#image-label-popover').addEventListener('submit', insertImageReference);
  $('#cancel-image-label').addEventListener('click', cancelImageInsert);
  $('#stop-recording').addEventListener('click', stopRecording); $('#use-recording').addEventListener('click', useRecording); $('#cancel-recording').addEventListener('click', cancelRecording);
  $('#recording-label').addEventListener('input', updateRecordingInsertState);
  $('#preview-recording').addEventListener('click', toggleRecordingPreview);
  $('#recording-preview').addEventListener('play', () => { $('#preview-recording').textContent = '❚❚'; $('#preview-recording').ariaLabel = t('pause'); });
  $('#recording-preview').addEventListener('pause', () => { $('#preview-recording').textContent = '▶'; $('#preview-recording').ariaLabel = t('previewRecording'); });
  $('#recording-preview').addEventListener('loadedmetadata', (event) => syncAudioRing(event.currentTarget, 'recording-preview', state.recordingDurationMs / 1000));
  $('#recording-preview').addEventListener('timeupdate', (event) => syncAudioRing(event.currentTarget, 'recording-preview', state.recordingDurationMs / 1000));
  $('#recording-preview-dial').addEventListener('click', (event) => seekAudioRing($('#recording-preview'), event.currentTarget, event, state.recordingDurationMs / 1000));
  $('#close-voice-player').addEventListener('click', closeVoicePlayer);
  $('#voice-player-toggle').addEventListener('click', toggleVoicePlayer);
  $('#voice-player-audio').addEventListener('play', () => { $('#voice-player-toggle').textContent = '❚❚'; $('#voice-player-toggle').ariaLabel = t('pause'); });
  $('#voice-player-audio').addEventListener('pause', () => { $('#voice-player-toggle').textContent = '▶'; $('#voice-player-toggle').ariaLabel = t('play'); });
  $('#voice-player-audio').addEventListener('loadedmetadata', (event) => probeAudioDuration(event.currentTarget, state.voicePlayerKnownDuration, () => syncAudioRing(event.currentTarget, 'voice-player', state.voicePlayerKnownDuration)));
  $('#voice-player-audio').addEventListener('durationchange', (event) => syncAudioRing(event.currentTarget, 'voice-player', state.voicePlayerKnownDuration));
  $('#voice-player-audio').addEventListener('timeupdate', (event) => syncAudioRing(event.currentTarget, 'voice-player', state.voicePlayerKnownDuration));
  $('#voice-player-dial').addEventListener('click', (event) => seekAudioRing($('#voice-player-audio'), event.currentTarget, event, state.voicePlayerKnownDuration));
  $('#close-image-popover').addEventListener('click', closeImagePopover);
  $('#image-popover-open').addEventListener('click', (event) => openFullImage(event.currentTarget.dataset.source, event.currentTarget.dataset.label));
  $('#prev-month').addEventListener('click', () => { state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth()-1,1,12); refreshCalendarData(); });
  $('#next-month').addEventListener('click', () => { state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth()+1,1,12); refreshCalendarData(); });
  $('#annotate-button').addEventListener('click', openAnnotation);
  $('#annotation-form').addEventListener('submit', async (event) => { event.preventDefault(); const date = state.kind === 'day' ? state.date : localDateKey(new Date()); const scope = $('input[name="scope"]:checked').value; await api.saveAnnotation({ date, scope, text: $('#annotation-text').value }); state.annotations = await api.listAnnotations(); $('#annotation-text').value = ''; renderAnnotationList(date); renderCalendar(); toast(state.language === 'zh' ? '日期标注已保存' : 'Date mark saved'); });
  $('#set-location').addEventListener('click', () => { $('#location-input').value = state.record?.location?.name || ''; showModal('location-modal'); setTimeout(() => $('#location-input').focus(), 50); });
  $('#save-location-text').addEventListener('click', () => {
    if (!$('#location-form').reportValidity()) return;
    state.record.location = { name: $('#location-input').value.trim() };
    hideModal('location-modal'); renderLocation(); markDirty();
  });
  $('#location-form').addEventListener('submit', async (event) => {
    event.preventDefault(); const name = $('#location-input').value.trim(); const button = $('#geocode-location');
    button.disabled = true; const originalText = button.textContent; button.textContent = state.language === 'zh' ? '正在定位…' : 'Positioning…';
    try {
      const result = await api.geocodeLocation(name);
      if (!result.found) { toast(state.language === 'zh' ? '没有找到这个地点，仍可仅保存地址' : 'Place not found; you can still save the address'); return; }
      state.record.location = { name, latitude: result.latitude, longitude: result.longitude };
      state.earthRotation.longitude = result.longitude; state.earthRotation.latitude = result.latitude;
      hideModal('location-modal'); renderLocation(); markDirty(); toast(result.cached ? (state.language === 'zh' ? '已使用本地定位缓存' : 'Local positioning cache used') : (state.language === 'zh' ? '地点已定位' : 'Place positioned'));
    } catch (error) { toast(`${state.language === 'zh' ? '定位失败' : 'Positioning failed'}: ${error.message}`); }
    finally { button.disabled = false; button.textContent = originalText; }
  });
  $('#clear-location').addEventListener('click', () => { if (!state.record) return; state.record.location = null; renderLocation(); markDirty(); });
  $('#sky-pull-handle').addEventListener('pointerdown', (event) => beginSkyDrag(event, true));
  $('#sky').addEventListener('pointerdown', (event) => beginSkyDrag(event, false));
  addEventListener('pointermove', moveSkyDrag, { passive: false });
  addEventListener('pointerup', finishSkyDrag);
  addEventListener('pointercancel', finishSkyDrag);
  $('#close-sky').addEventListener('click', () => setSkyRevealed(false));
  $('#history-button').addEventListener('click', () => { $('#inner-secret').value = ''; $('#inner-error').textContent = ''; configureHistoryGate(); showModal('history-gate'); setTimeout(() => $('#inner-secret').focus(),50); });
  $('#inner-auth-form').addEventListener('submit', async (event) => {
    event.preventDefault(); const secret = $('#inner-secret').value; $('#inner-error').textContent = '';
    try {
      if (event.currentTarget.dataset.setup === 'true') {
        await api.authSetupInner(secret); state.innerConfigured = true;
      } else {
        const result = await api.authVerify(secret, 'inner');
        if (!result.ok) throw new Error(result.retryAfterMs > 500 ? `${t('verifyFailed')} · ${Math.ceil(result.retryAfterMs / 1000)}s` : t('verifyFailed'));
      }
      state.historyUnlocked = true; showHistory();
    } catch (error) { $('#inner-error').textContent = error.message; }
  });
  $('#close-history').addEventListener('click', hideHistory);
  $('#archive-records-mode').addEventListener('click', () => setArchiveMode('records'));
  $('#archive-library-mode').addEventListener('click', () => setArchiveMode('library'));
  let chronologyDrag = null;
  let chronologyDragFrame = 0;
  const settleChronology = () => {
    if (chronologyDrag) return;
    const nearest = nearestTimelineMarkerAtCenter();
    if (nearest) selectTimeline(nearest.kind, nearest.key, true, 240);
  };
  $('#chronology').addEventListener('wheel', (event) => {
    event.preventDefault(); stopChronologyTween(); clearTimeout(historyTimer); historyScheduledSelection = ''; clearTimeout(chronologySettleTimer);
    document.body.classList.add('timeline-scrolling');
    state.timelineOffset = clampTimelineOffset(state.timelineOffset + event.deltaY * .82);
    selectNearestTimelineMarker(); scheduleChronologyDraw();
    chronologySettleTimer = setTimeout(() => { document.body.classList.remove('timeline-scrolling'); settleChronology(); }, 190);
  }, { passive: false });
  $('#chronology').addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    stopChronologyTween(); clearTimeout(historyTimer); historyScheduledSelection = ''; clearTimeout(chronologySettleTimer);
    chronologyDrag = { pointerId: event.pointerId, startY: event.clientY, startOffset: state.timelineOffset, latestY: event.clientY, moved: false };
    $('#chronology').setPointerCapture(event.pointerId); $('#chronology').classList.add('is-dragging'); document.body.classList.add('timeline-dragging','timeline-scrolling');
  });
  $('#chronology').addEventListener('pointermove', (event) => {
    if (!chronologyDrag || chronologyDrag.pointerId !== event.pointerId) return;
    const delta = event.clientY - chronologyDrag.startY;
    if (Math.abs(delta) > 3) chronologyDrag.moved = true;
    if (!chronologyDrag.moved) return;
    chronologyDrag.latestY = event.clientY;
    if (!chronologyDragFrame) chronologyDragFrame = requestAnimationFrame(() => {
      chronologyDragFrame = 0;
      if (!chronologyDrag) return;
      state.timelineOffset = clampTimelineOffset(chronologyDrag.startOffset - (chronologyDrag.latestY - chronologyDrag.startY));
      selectNearestTimelineMarker(); scheduleChronologyDraw();
    });
    event.preventDefault();
  });
  const finishChronologyDrag = (event) => {
    if (!chronologyDrag || (event.pointerId !== undefined && chronologyDrag.pointerId !== event.pointerId)) return;
    if (chronologyDragFrame) { cancelAnimationFrame(chronologyDragFrame); chronologyDragFrame = 0; }
    const drag = chronologyDrag;
    if (drag.moved) state.timelineOffset = clampTimelineOffset(drag.startOffset - (drag.latestY - drag.startY));
    chronologyDrag = null; $('#chronology').classList.remove('is-dragging'); document.body.classList.remove('timeline-dragging','timeline-scrolling');
    if (drag.moved) settleChronology();
    else {
      const bounds = $('#chronology').getBoundingClientRect();
      const clickedValue = state.timelineOffset + event.clientY - (bounds.top + bounds.height / 2);
      const clicked = nearestTimelineMarker(clickedValue);
      if (clicked) selectTimeline(clicked.kind, clicked.key, true, 240);
    }
  };
  $('#chronology').addEventListener('pointerup', finishChronologyDrag);
  $('#chronology').addEventListener('pointercancel', finishChronologyDrag);
  $('#chronology').addEventListener('keydown', (event) => {
    if (!['ArrowUp','ArrowDown'].includes(event.key) || !state.timelineMarkers?.length) return;
    event.preventDefault(); const current = state.timelineMarkers.findIndex((marker) => marker.kind === state.timelineSelection?.kind && marker.key === state.timelineSelection?.key);
    const next = state.timelineMarkers[Math.max(0, Math.min(state.timelineMarkers.length - 1, current + (event.key === 'ArrowUp' ? -1 : 1)))];
    if (next) selectTimeline(next.kind, next.key, true);
  });
  $('#library-back').addEventListener('click', () => { const parts = state.libraryPath.split('/').filter(Boolean); parts.pop(); loadLibrary(parts.join('/'), ''); });
  let libraryFilterTimer;
  $('#library-filter').addEventListener('input', (event) => { clearTimeout(libraryFilterTimer); state.libraryQuery = event.currentTarget.value.trim(); libraryFilterTimer = setTimeout(() => loadLibrary(state.libraryPath, state.libraryQuery), 180); });
  $('#library-import-files').addEventListener('click', async () => { try { const result = await api.importLibraryFiles(state.libraryPath); if (result) { toast(state.language === 'zh' ? `已导入 ${result.imported.length} 个文件` : `${result.imported.length} files imported`); await loadLibrary(state.libraryPath, state.libraryQuery); } } catch (error) { toast(error.message); } });
  $('#library-import-folder').addEventListener('click', async () => { try { const result = await api.importLibraryFolder(state.libraryPath); if (result) { toast(state.language === 'zh' ? '文件夹已导入' : 'Folder imported'); await loadLibrary(state.libraryPath, state.libraryQuery); } } catch (error) { toast(error.message); } });
  $('#library-open').addEventListener('click', async () => { if (!state.librarySelected) return; try { if (state.librarySelected.directory) await loadLibrary(state.librarySelected.relative, ''); else await api.openLibraryItem(state.librarySelected.relative); } catch (error) { toast(error.message); } });
  $('#library-export').addEventListener('click', async () => { if (!state.librarySelected) return; const button = $('#library-export'); button.disabled = true; try { const result = await api.exportLibraryItem(state.librarySelected.relative); if (result) toast(state.language === 'zh' ? `已提取到 ${result.path}` : `Extracted to ${result.path}`); } catch (error) { toast(error.message); } finally { button.disabled = false; } });
  $('#export-content').addEventListener('click', () => runHistoryExport('content'));
  $('#export-migration').addEventListener('click', () => runHistoryExport('migration'));
  $('#import-legacy').addEventListener('click', async () => { if (!state.historyUnlocked) return; try { const selection = await api.selectLegacyDiary(); if (!selection) return; if (!selection.count) { toast(state.language === 'zh' ? '没有识别到有效日记段落' : 'No valid diary entries were found'); return; } const sample = selection.sample.map((item) => item.date).join('、'); if (!confirm(state.language === 'zh' ? `识别到 ${selection.year} 年的 ${selection.count} 篇记录（如 ${sample}）。\n\n导入不会覆盖已有日期。是否继续？` : `${selection.count} records from ${selection.year} were found (for example ${sample}).\n\nExisting dates will not be overwritten. Continue?`)) return; const result = await api.importLegacyEntries(selection.entries); toast(state.language === 'zh' ? `导入完成：新增 ${result.imported} 篇，跳过 ${result.skipped} 篇` : `Import complete: ${result.imported} added, ${result.skipped} skipped`); await refreshCalendarData(); await configureTimeline(); } catch (error) { toast(`${state.language === 'zh' ? '导入失败' : 'Import failed'}: ${error.message}`); } });
  $$('[data-close]').forEach((button) => button.addEventListener('click', () => hideModal(button.dataset.close)));
  $('#image-modal').addEventListener('click', (event) => { if (event.target.id === 'image-modal') hideModal('image-modal'); });
  document.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.media-popover, .inline-media-token, #add-image')) return;
    closeVoicePlayer(); closeImagePopover();
    if (!$('#image-label-popover').classList.contains('hidden')) cancelImageInsert();
  });
  addEventListener('keydown', (event) => { if (event.key === 'Escape') { setSkyRevealed(false); cancelRecording(); cancelImageInsert(); closeVoicePlayer(); closeImagePopover(); $$('.overlay, .image-modal').forEach((item) => item.classList.add('hidden')); } if (event.ctrlKey && event.key.toLowerCase() === 's') { event.preventDefault(); saveCurrent(); } });
  addEventListener('beforeunload', () => { if (state.dirty) saveCurrent(); });
}

api.onExportProgress(updateExportProgress);
setupCosmos(); setupTimelineCanvas(); setupEarth(); bindEvents(); applyLanguage(); initializeAuth().catch((error) => { $('#auth-error').textContent = `${state.language === 'zh' ? '初始化失败' : 'Initialization failed'}: ${error.message}`; });
