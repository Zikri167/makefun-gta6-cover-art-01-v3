// The cover composition engine for Neon Shores Cover Studio.
//
// renderCover paints a whole cover at any pixel size from the editor state:
// panels first (photographs and painted scenes, each colour-graded and
// finished with the halftone poster screen), then the title and callout
// blocks, then the pop-out hero bleeding across panel borders, then the
// badges that ride on panels, and finally paper grain and a vignette over
// everything — the printed-poster finish.

import { applyColourGrade } from './grades.js';
import {
  drawViceSkyScene, drawNeonStreetScene, drawSunsetGradient,
  applyHalftoneScreen, applyPaperGrain, applyVignette,
} from './scenes.js';
import {
  drawChromeTitle, drawNeonScript, drawHeatMeter, drawBadgeRibbon, drawRoleTag, TAG_FONT,
} from './lettering.js';
import { drawPopOutHero } from './cutout.js';
import { layoutFor } from './panels.js';

/** Converts a panel's fractional rect to pixels for a WxH cover. */
export function panelPixelRect(panel, W, H) {
  return {
    x: Math.round(panel.x * W),
    y: Math.round(panel.y * H),
    w: Math.round(panel.w * W),
    h: Math.round(panel.h * H),
  };
}

/** Draws an image into a rect, cover-fit, with zoom and focal shift from the panel. */
function drawPhotoCoverFit(ctx, img, rect, panel) {
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * (panel.zoom ?? 1);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - dw) * (panel.ox ?? 0.5);
  const dy = rect.y + (rect.h - dh) * (panel.oy ?? 0.5);
  ctx.drawImage(img, dx, dy, dw, dh);
}

/** Renders one panel's content (photo, scene, title or callout) to its own canvas. */
function renderPanelContent(state, panel, rect, photos) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, rect.w);
  c.height = Math.max(2, rect.h);
  const ctx = c.getContext('2d');
  const local = { x: 0, y: 0, w: c.width, h: c.height };
  const unit = Math.min(c.width, c.height);

  if (panel.kind === 'title') {
    if (panel.glass) {
      const grad = ctx.createLinearGradient(0, 0, 0, c.height);
      grad.addColorStop(0, 'rgba(10,6,20,0.25)');
      grad.addColorStop(0.35, 'rgba(10,6,20,0.72)');
      grad.addColorStop(1, 'rgba(10,6,20,0.88)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, c.width, c.height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, c.height);
      grad.addColorStop(0, '#1a1130');
      grad.addColorStop(1, '#0c0918');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, c.width, c.height);
      applyHalftoneScreen(ctx, local, Math.max(5, unit * 0.03), 0.35);
    }
    const titlePx = Math.min(c.height * 0.42, c.width * 0.24);
    const blockH = drawChromeTitle(ctx, state.title, c.width / 2, c.height * 0.5, c.width * 0.94, titlePx, { maxHeight: c.height * 0.56 });
    drawNeonScript(ctx, state.subtitle, c.width / 2, c.height * 0.5 + blockH * 0.5 + c.height * 0.11, Math.max(13, c.height * 0.15));
    return c;
  }

  if (panel.kind === 'callout') {
    drawSunsetGradient(ctx, local);
    applyHalftoneScreen(ctx, local, Math.max(5, unit * 0.03), 0.22);
    ctx.save();
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate(-0.05);
    ctx.font = `${Math.min(c.height * 0.3, c.width * 0.2)}px "Anton", "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const words = state.callout.trim().toUpperCase().split(/\s+/).filter(Boolean);
    const mid = Math.ceil(words.length / 2);
    const lines = words.length > 1 ? [words.slice(0, mid).join(' '), words.slice(mid).join(' ')] : words;
    const lh = Math.min(c.height * 0.3, c.width * 0.2) * 1.05;
    lines.forEach((line, i) => {
      const ly = (i - (lines.length - 1) / 2) * lh;
      ctx.lineWidth = Math.max(2, lh * 0.09);
      ctx.strokeStyle = 'rgba(10,5,20,0.85)';
      ctx.lineJoin = 'round';
      ctx.strokeText(line, 0, ly);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, 0, ly);
    });
    ctx.restore();
    // The callout arrow, small in the top-left corner, spearing up-left
    // toward the title block without sitting on the slogan's letters.
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(10,5,20,0.85)';
    ctx.lineWidth = Math.max(1.5, unit * 0.012);
    const ax = c.width * 0.05;
    const ay = c.height * 0.09;
    const al = unit * 0.17;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + al * 0.55, ay - al * 0.28);
    ctx.lineTo(ax + al * 0.5, ay + al * 0.08);
    ctx.lineTo(ax + al, ay + al * 0.3);
    ctx.lineTo(ax + al * 0.62, ay + al * 0.62);
    ctx.lineTo(ax + al * 0.34, al * 0.28 + ay);
    ctx.lineTo(ax + al * 0.3, ay + al * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return c;
  }

  // Photo-kind panels: a photograph or one of the painted scenes.
  if (panel.fill === 'scene-sky') drawViceSkyScene(ctx, local);
  else if (panel.fill === 'scene-neon') drawNeonStreetScene(ctx, local);
  else if (panel.fill === 'scene-sunset') drawSunsetGradient(ctx, local);
  else {
    const img = photos.get(panel.photo);
    if (img) drawPhotoCoverFit(ctx, img, local, panel);
    else {
      drawSunsetGradient(ctx, local);
      ctx.font = `${Math.max(12, unit * 0.09)}px ${TAG_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(panel.label.toUpperCase(), c.width / 2, c.height / 2);
    }
  }
  const sceneAmount = panel.fill === 'photo' ? state.gradeAmount : state.gradeAmount * 0.45;
  applyColourGrade(c, state.gradeId, sceneAmount);
  applyHalftoneScreen(ctx, local, Math.max(5, unit * 0.028), 0.16);
  return c;
}

/** Draws the decoration that rides on a panel: badge ribbon, heat meter or role tag. */
function drawPanelDecoration(ctx, state, panel, rect) {
  const pad = Math.min(rect.w, rect.h) * 0.05;
  if (panel.decor === 'badge' || panel.decor === 'badge2') {
    const rw = rect.w * 0.56;
    const rh = Math.max(16, rect.h * 0.15);
    const text = panel.decor === 'badge' ? state.badge : state.badge2;
    const colour = panel.decor === 'badge' ? '#e53935' : '#7b1fa2';
    const x = rect.x + rect.w - rw - pad;
    const y = panel.decor === 'badge' ? rect.y + pad : rect.y + rect.h - rh - pad;
    drawBadgeRibbon(ctx, x, y, rw, rh, text, colour);
  } else if (panel.decor === 'heat') {
    drawHeatMeter(ctx, rect.x + pad, rect.y + pad, Math.max(14, rect.h * 0.085), state.heat);
  } else if (panel.decor === 'role') {
    const rh = Math.max(15, rect.h * 0.13);
    drawRoleTag(ctx, rect.x + pad, rect.y + rect.h - rh - pad, rh, state.role);
  }
}

/**
 * Paints the full cover described by `state` onto a fresh canvas of W x H.
 * `photos` maps photo ids to loaded images; `heroCutout` is a canvas or null.
 */
export function renderCover(state, photos, heroCutout, W, H) {
  const layout = layoutFor(state.sizeKey, state.layoutId);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0b0714';
  ctx.fillRect(0, 0, W, H);

  const decorations = [];
  for (const panel of state.panels) {
    const rect = panelPixelRect(panel, W, H);
    if (rect.w <= 0 || rect.h <= 0) continue;
    const content = renderPanelContent(state, panel, rect, photos);
    ctx.save();
    if (panel.tilt) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(panel.tilt * Math.PI / 180);
      ctx.drawImage(content, -rect.w / 2, -rect.h / 2);
      if (panel.frame) {
        ctx.strokeStyle = '#f5f2ea';
        ctx.lineWidth = Math.max(3, H * 0.012);
        ctx.strokeRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
      }
    } else {
      ctx.drawImage(content, rect.x, rect.y);
    }
    ctx.restore();
    // Inked keyline around every panel — the printed poster separation.
    ctx.strokeStyle = 'rgba(8,5,16,0.9)';
    ctx.lineWidth = Math.max(1.5, H * 0.0035);
    if (panel.tilt) {
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(panel.tilt * Math.PI / 180);
      ctx.strokeRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
      ctx.restore();
    } else {
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
    if (panel.decor) decorations.push([panel, rect]);
  }

  // The pop-out hero, bleeding across the panel borders.
  if (state.heroEnabled && layout.hero && heroCutout) {
    const hh = layout.hero.height * H;
    const hw = hh * (heroCutout.width / heroCutout.height);
    const hx = layout.hero.cx * W - hw / 2;
    const hy = layout.hero.top * H;
    drawPopOutHero(ctx, heroCutout, hx, hy, hw, hh, Math.max(2, H * 0.005));
  }

  for (const [panel, rect] of decorations) drawPanelDecoration(ctx, state, panel, rect);

  applyPaperGrain(ctx, W, H, 0.05);
  applyVignette(ctx, W, H, 0.36);
  ctx.strokeStyle = 'rgba(8,5,16,0.95)';
  ctx.lineWidth = Math.max(2, H * 0.005);
  ctx.strokeRect(0, 0, W, H);
  return canvas;
}
