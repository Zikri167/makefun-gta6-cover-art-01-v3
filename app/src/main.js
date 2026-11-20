// Neon Shores Cover Studio — editor wiring.
//
// State lives in one object: the post size, the layout's panel configs,
// the grade, the words, the badges and the hero cut-out settings. Every
// change repaints the live preview from renderCover, history snapshots
// power undo/redo, and the export buttons render the same composition at
// full resolution. A `?shot=` query instead stages one fixed scene — a
// finished cover or the editor itself — for the maker's screenshots.

import { COLOUR_GRADES } from './grades.js';
import { LAYOUTS_BY_SIZE, EXPORT_SIZES, layoutFor } from './panels.js';
import { renderCover, panelPixelRect } from './cover.js';
import { buildHeroCutout, eraseCutoutAt } from './cutout.js';

const $ = (id) => document.getElementById(id);
const stage = $('stage');
const stageCtx = stage.getContext('2d');

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

const photos = new Map();
let photoSeq = 0;
let pickedPhotoId = 'boulevard';
let heroPhotoId = 'pier';
let heroCutout = null;
let heroCutoutDirty = true;
let selectedPanelId = null;

const state = {
  sizeKey: 'landscape',
  layoutId: 'heat9',
  panels: [],
  gradeId: 'vice-sunset',
  gradeAmount: 0.85,
  title: 'NEON SHORES',
  subtitle: 'Sunset Heist',
  callout: 'ONE LAST SCORE',
  heat: 5,
  badge: 'WANTED',
  badge2: 'HEAT LEVEL 5',
  role: 'DRIVER',
  heroEnabled: true,
  heroMode: 'chroma',
  heroTolerance: 34,
  heroFeather: 2.5,
};

/** Rebuilds the panel configs for the current size + layout. */
function resetPanels() {
  state.panels = layoutFor(state.sizeKey, state.layoutId).panels();
  selectedPanelId = state.panels.find((p) => p.kind === 'photo')?.id ?? null;
}

/** The panel the controls currently edit. */
function selectedPanel() {
  return state.panels.find((p) => p.id === selectedPanelId) ?? null;
}

/** Preview pixel size per post size (the stage keeps the cover's aspect). */
function previewSize() {
  if (state.sizeKey === 'portrait') return [648, 810];
  if (state.sizeKey === 'square') return [720, 720];
  return [960, 540];
}

/** Rebuilds the hero cut-out if its inputs changed since the last build. */
function ensureHeroCutout() {
  if (!heroCutoutDirty) return;
  const img = photos.get(heroPhotoId);
  if (!img) { heroCutout = null; return; }
  heroCutout = buildHeroCutout(img, {
    mode: state.heroMode,
    tolerance: state.heroTolerance,
    feather: state.heroFeather,
  });
  heroCutoutDirty = false;
}

/** Repaints the stage with the current composition. */
function renderPreview() {
  ensureHeroCutout();
  const [w, h] = previewSize();
  if (stage.width !== w || stage.height !== h) { stage.width = w; stage.height = h; }
  const cover = renderCover(state, photos, heroCutout, w, h);
  stageCtx.drawImage(cover, 0, 0);
  const sel = selectedPanel();
  if (sel) {
    const rect = panelPixelRect(sel, w, h);
    stageCtx.save();
    stageCtx.strokeStyle = '#00f3ff';
    stageCtx.lineWidth = 2;
    stageCtx.setLineDash([8, 6]);
    stageCtx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    stageCtx.restore();
  }
}

// ---------- history (undo / redo) ----------

const historyStack = [];
const futureStack = [];
let historyTimer = null;

function snapshotState() {
  return JSON.stringify({ ...state, panels: state.panels, heroPhotoId });
}

function restoreSnapshot(json) {
  const data = JSON.parse(json);
  Object.assign(state, data);
  heroPhotoId = data.heroPhotoId ?? heroPhotoId;
  heroCutoutDirty = true;
  syncControlsFromState();
  renderPreview();
}

/** Records the current state for undo, debounced so slider drags coalesce. */
function commitHistory() {
  clearTimeout(historyTimer);
  historyTimer = setTimeout(() => {
    const snap = snapshotState();
    if (historyStack[historyStack.length - 1] !== snap) {
      historyStack.push(snap);
      if (historyStack.length > 60) historyStack.shift();
      futureStack.length = 0;
    }
  }, 250);
}

function undo() {
  if (historyStack.length < 2) return;
  futureStack.push(historyStack.pop());
  restoreSnapshot(historyStack[historyStack.length - 1]);
}

function redo() {
  const next = futureStack.pop();
  if (!next) return;
  historyStack.push(next);
  restoreSnapshot(next);
}

// ---------- controls ----------

/** Rebuilds the layout dropdown for the current post size. */
function refreshLayoutOptions() {
  const select = $('layoutSelect');
  select.innerHTML = '';
  for (const layout of LAYOUTS_BY_SIZE[state.sizeKey]) {
    const opt = document.createElement('option');
    opt.value = layout.id;
    opt.textContent = layout.name;
    select.appendChild(opt);
  }
  select.value = state.layoutId;
}

/** Pushes state values into every control (after undo, layout switches…). */
function syncControlsFromState() {
  refreshLayoutOptions();
  document.querySelectorAll('#sizeSeg button').forEach((b) =>
    b.classList.toggle('active', b.dataset.size === state.sizeKey));
  $('gradeSelect').value = state.gradeId;
  $('gradeAmount').value = Math.round(state.gradeAmount * 100);
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  $('calloutInput').value = state.callout;
  $('heatRange').value = state.heat;
  $('heatVal').textContent = state.heat;
  $('badgeInput').value = state.badge;
  $('badge2Input').value = state.badge2;
  $('roleInput').value = state.role;
  $('heroEnable').checked = state.heroEnabled;
  $('heroMode').value = state.heroMode;
  $('tolRange').value = state.heroTolerance;
  $('featherRange').value = state.heroFeather;
  syncPanelControls();
}

/** Pushes the selected panel's config into the panel controls. */
function syncPanelControls() {
  const p = selectedPanel();
  $('panelName').textContent = p ? p.label : 'none';
  if (!p) return;
  $('fillSelect').value = p.fill;
  $('zoomRange').value = Math.round(p.zoom * 100);
  $('oxRange').value = Math.round(p.ox * 100);
  $('oyRange').value = Math.round(p.oy * 100);
  $('tiltRange').value = p.tilt;
}

/** Any state mutation funnels through here: history + repaint. */
function changed() {
  commitHistory();
  renderPreview();
}

function bindControls() {
  $('layoutSelect').addEventListener('change', (e) => {
    state.layoutId = e.target.value;
    resetPanels();
    syncPanelControls();
    changed();
  });
  document.querySelectorAll('#sizeSeg button').forEach((b) =>
    b.addEventListener('click', () => {
      state.sizeKey = b.dataset.size;
      state.layoutId = LAYOUTS_BY_SIZE[state.sizeKey][0].id;
      resetPanels();
      syncControlsFromState();
      changed();
    }));
  $('gradeSelect').addEventListener('change', (e) => { state.gradeId = e.target.value; changed(); });
  $('gradeAmount').addEventListener('input', (e) => { state.gradeAmount = e.target.value / 100; changed(); });
  const words = [
    ['titleInput', 'title'], ['subtitleInput', 'subtitle'], ['calloutInput', 'callout'],
    ['badgeInput', 'badge'], ['badge2Input', 'badge2'], ['roleInput', 'role'],
  ];
  for (const [id, key] of words) {
    $(id).addEventListener('input', (e) => { state[key] = e.target.value; changed(); });
  }
  $('heatRange').addEventListener('input', (e) => {
    state.heat = parseInt(e.target.value, 10);
    $('heatVal').textContent = state.heat;
    changed();
  });

  $('photoFile').addEventListener('change', async (e) => {
    for (const file of e.target.files) {
      const img = await loadImage(URL.createObjectURL(file));
      const id = `user-${++photoSeq}`;
      photos.set(id, img);
      addPhotoThumb(id, file.name.replace(/\.[^.]+$/, ''));
      pickedPhotoId = id;
    }
    markPickedThumb();
    changed();
  });
  $('heroPhotoBtn').addEventListener('click', () => {
    heroPhotoId = pickedPhotoId;
    heroCutoutDirty = true;
    changed();
  });

  $('fillSelect').addEventListener('change', (e) => {
    const p = selectedPanel();
    if (!p) return;
    p.fill = e.target.value;
    if (p.fill === 'photo' && pickedPhotoId) p.photo = pickedPhotoId;
    changed();
  });
  $('zoomRange').addEventListener('input', (e) => { const p = selectedPanel(); if (p) { p.zoom = e.target.value / 100; changed(); } });
  $('oxRange').addEventListener('input', (e) => { const p = selectedPanel(); if (p) { p.ox = e.target.value / 100; changed(); } });
  $('oyRange').addEventListener('input', (e) => { const p = selectedPanel(); if (p) { p.oy = e.target.value / 100; changed(); } });
  $('tiltRange').addEventListener('input', (e) => { const p = selectedPanel(); if (p) { p.tilt = parseFloat(e.target.value); changed(); } });

  $('heroEnable').addEventListener('change', (e) => { state.heroEnabled = e.target.checked; changed(); });
  $('heroMode').addEventListener('change', (e) => { state.heroMode = e.target.value; heroCutoutDirty = true; changed(); });
  $('tolRange').addEventListener('input', (e) => { state.heroTolerance = parseInt(e.target.value, 10); heroCutoutDirty = true; changed(); });
  $('featherRange').addEventListener('input', (e) => { state.heroFeather = parseFloat(e.target.value); heroCutoutDirty = true; changed(); });
  $('brushToggle').addEventListener('change', (e) => stage.classList.toggle('brush-armed', e.target.checked));

  $('undoBtn').addEventListener('click', undo);
  $('redoBtn').addEventListener('click', redo);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
  });

  document.querySelectorAll('[data-export]').forEach((b) =>
    b.addEventListener('click', () => exportPng(b.dataset.export)));
  $('exportAllBtn').addEventListener('click', async () => {
    for (const sizeKey of ['landscape', 'portrait', 'square']) {
      await exportPng(sizeKey);
      await new Promise((r) => setTimeout(r, 350));
    }
  });

  stage.addEventListener('pointerdown', onStagePointer);
  stage.addEventListener('pointermove', (e) => { if (e.buttons) onStagePointer(e); });
}

/** Stage clicks select panels (and fill them with the picked photo); the armed brush erases the cut-out. */
function onStagePointer(e) {
  const box = stage.getBoundingClientRect();
  const fx = (e.clientX - box.left) / box.width;
  const fy = (e.clientY - box.top) / box.height;
  if ($('brushToggle').checked && heroCutout && state.heroEnabled) {
    eraseHeroAt(fx, fy);
    renderPreview();
    return;
  }
  const hit = [...state.panels].reverse().find((p) => {
    return fx >= p.x && fx <= p.x + p.w && fy >= p.y && fy <= p.y + p.h;
  });
  if (!hit) return;
  selectedPanelId = hit.id;
  if (hit.kind === 'photo' && pickedPhotoId && hit.fill === 'photo') hit.photo = pickedPhotoId;
  syncPanelControls();
  renderPreview();
}

/** Maps a stage point into the hero cut-out and erases a brush disc there. */
function eraseHeroAt(fx, fy) {
  const layout = layoutFor(state.sizeKey, state.layoutId);
  if (!layout.hero) return;
  const [w, h] = previewSize();
  const hh = layout.hero.height * h;
  const hw = hh * (heroCutout.width / heroCutout.height);
  const hx = layout.hero.cx * w - hw / 2;
  const hy = layout.hero.top * h;
  const px = fx * w;
  const py = fy * h;
  if (px < hx || px > hx + hw || py < hy || py > hy + hh) return;
  const cx = (px - hx) / hw * heroCutout.width;
  const cy = (py - hy) / hh * heroCutout.height;
  const radius = parseInt($('brushSize').value, 10) / hw * heroCutout.width;
  eraseCutoutAt(heroCutout, cx, cy, radius);
}

// ---------- photos ----------

/** Adds a thumbnail for a photo to the strip; clicking picks it. */
function addPhotoThumb(id, name) {
  const img = photos.get(id);
  const fig = document.createElement('figure');
  fig.dataset.photoId = id;
  const thumb = document.createElement('img');
  thumb.src = img.src;
  thumb.alt = name;
  const cap = document.createElement('figcaption');
  cap.textContent = name;
  fig.append(thumb, cap);
  fig.addEventListener('click', () => { pickedPhotoId = id; markPickedThumb(); });
  $('photoStrip').appendChild(fig);
}

function markPickedThumb() {
  document.querySelectorAll('#photoStrip figure').forEach((f) =>
    f.classList.toggle('picked', f.dataset.photoId === pickedPhotoId));
}

// ---------- export ----------

/** Renders one post size at full resolution and downloads it as a PNG. */
function exportPng(sizeKey) {
  return new Promise((resolve) => {
    const keepSize = state.sizeKey;
    const keepLayout = state.layoutId;
    const keepPanels = state.panels;
    if (sizeKey !== state.sizeKey) {
      state.sizeKey = sizeKey;
      if (!LAYOUTS_BY_SIZE[sizeKey].some((l) => l.id === state.layoutId)) {
        state.layoutId = LAYOUTS_BY_SIZE[sizeKey][0].id;
      }
      state.panels = layoutFor(state.sizeKey, state.layoutId).panels();
      // Carry the words and grade across; panel fills reset to the layout's own defaults.
    }
    ensureHeroCutout();
    const [w, h] = EXPORT_SIZES[sizeKey];
    const cover = renderCover(state, photos, heroCutout, w, h);
    state.sizeKey = keepSize;
    state.layoutId = keepLayout;
    state.panels = keepPanels;
    cover.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `neon-shores-cover-${w}x${h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      resolve();
    }, 'image/png');
  });
}

// ---------- screenshot staging ----------

/** Waits until fonts and sample photos can actually be drawn. */
async function waitUntilDrawable() {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('100px "Anton"'),
        document.fonts.load('40px "Pacifico"'),
        document.fonts.load('40px "Bebas Neue"'),
      ]),
      new Promise((r) => setTimeout(r, 3500)),
    ]);
  } catch { /* fall back to whatever fonts are ready */ }
}

/** Stages a fixed scene for the maker's screenshots, per the ?shot= query. */
async function runShotMode(query) {
  const shot = query.get('shot');
  if (query.get('grade')) state.gradeId = query.get('grade');
  if (query.get('title')) state.title = query.get('title');
  if (query.get('subtitle')) state.subtitle = query.get('subtitle');
  if (query.get('hero') === 'silhouette') state.heroMode = 'silhouette';
  if (shot === 'editor') {
    document.body.classList.add('shot-editor');
    resetPanels();
    syncControlsFromState();
    renderPreview();
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
    return;
  }
  // A finished cover, full frame.
  const sizeKey = query.get('size') ?? 'landscape';
  state.sizeKey = sizeKey;
  state.layoutId = LAYOUTS_BY_SIZE[sizeKey][0].id;
  if (query.get('layout')) state.layoutId = query.get('layout');
  resetPanels();
  document.body.classList.add('shot');
  const dims = { landscape: [1280, 720], portrait: [1024, 1280], square: [1080, 1080] }[sizeKey];
  ensureHeroCutout();
  const cover = renderCover(state, photos, heroCutout, dims[0], dims[1]);
  const holder = $('shotStage');
  holder.hidden = false;
  holder.appendChild(cover);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

// ---------- boot ----------

async function boot() {
  const [boulevard, pier] = await Promise.all([
    loadImage('samples/boulevard.jpg'),
    loadImage('samples/pier.jpg'),
  ]);
  photos.set('boulevard', boulevard);
  photos.set('pier', pier);
  await waitUntilDrawable();

  // Grade options are filled before any staging, so the editor scene used
  // for screenshots shows the grade dropdown populated like a real visit.
  const gradeSelect = $('gradeSelect');
  for (const grade of COLOUR_GRADES) {
    const opt = document.createElement('option');
    opt.value = grade.id;
    opt.textContent = grade.name;
    gradeSelect.appendChild(opt);
  }

  const query = new URLSearchParams(location.search);
  if (query.get('shot')) {
    addPhotoThumb('boulevard', 'Boulevard');
    addPhotoThumb('pier', 'Pier');
    await runShotMode(query);
    return;
  }
  resetPanels();
  addPhotoThumb('boulevard', 'Boulevard');
  addPhotoThumb('pier', 'Pier');
  markPickedThumb();
  bindControls();
  syncControlsFromState();
  historyStack.push(snapshotState());
  renderPreview();
}

boot();
