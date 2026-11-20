// Lettering and badge art for Neon Shores Cover Studio.
//
// Everything here is drawn with the 2D canvas API and the studio's own
// vendored OFL fonts (Anton for display type, Pacifico for script, Bebas
// Neue for tags). No artwork, logo or typeface from any game is used: the
// striped retro-chrome title is painted pixel by pixel — a chrome gradient
// raked with pinstripes, clipped to the letterforms, over a black keyline
// and a cyan neon bleed.

export const DISPLAY_FONT = '"Anton", "Arial Black", sans-serif';
export const SCRIPT_FONT = '"Pacifico", cursive';
export const TAG_FONT = '"Bebas Neue", "Arial Narrow", sans-serif';

const CHROME_STOPS = [
  [0.0, '#ffffff'], [0.15, '#e8e8e8'], [0.3, '#a0a0a0'], [0.45, '#606060'],
  [0.5, '#2a2a2a'], [0.55, '#606060'], [0.7, '#a0a0a0'], [0.85, '#e8e8e8'], [1.0, '#ffffff'],
];

/**
 * Wraps `text` for the chrome title, measuring with the real display font
 * at `fontPx` (measuring in the wrong font wraps at the wrong places).
 * One line wins whenever it fits `maxWidth`; otherwise the most balanced
 * two-line split that fits; otherwise one line, and the caller shrinks.
 */
export function wrapTitleLines(ctx, text, maxWidth, maxLines, fontPx) {
  const words = text.trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  ctx.font = `${fontPx}px ${DISPLAY_FONT}`;
  const whole = words.join(' ');
  if (words.length === 1 || maxLines === 1) return [whole];
  if (ctx.measureText(whole).width <= maxWidth) return [whole];
  let best = null;
  let bestScore = Infinity;
  for (let i = 1; i < words.length; i++) {
    const lines = [words.slice(0, i).join(' '), words.slice(i).join(' ')];
    const w = Math.max(ctx.measureText(lines[0]).width, ctx.measureText(lines[1]).width);
    if (w < bestScore) { bestScore = w; best = lines; }
  }
  return bestScore <= maxWidth ? best : [whole];
}

/** Fits a font size so `lines` fit inside `maxWidth`, shrinking from `startPx`. */
function fitFontPx(ctx, lines, maxWidth, startPx, family) {
  let px = startPx;
  while (px > 10) {
    ctx.font = `${px}px ${family}`;
    if (lines.every((line) => ctx.measureText(line).width <= maxWidth)) break;
    px -= 2;
  }
  ctx.font = `${px}px ${family}`;
  return px;
}

/**
 * Paints the striped retro-chrome title centred on (cx, cy).
 * Returns the block height used, so callers can stack a subtitle under it.
 */
export function drawChromeTitle(ctx, text, cx, cy, maxWidth, startPx, opts = {}) {
  const stripeCount = opts.stripes ?? 12;
  const stripeAngle = (opts.angleDeg ?? -15) * Math.PI / 180;
  const maxHeight = opts.maxHeight ?? Infinity;
  const scratch = document.createElement('canvas');
  const sctx = scratch.getContext('2d');
  const lines = wrapTitleLines(sctx, text, maxWidth, 2, startPx);
  if (lines.length === 0) return 0;
  let px = fitFontPx(sctx, lines, maxWidth, startPx, DISPLAY_FONT);
  // Shrink further until the stacked lines fit the allowed block height,
  // so a short title band never spills its letters over the panels beside it.
  while (px > 10 && px * 1.04 * lines.length > maxHeight) px -= 2;
  sctx.font = `${px}px ${DISPLAY_FONT}`;
  const lineHeight = px * 1.04;
  const blockH = lineHeight * lines.length;
  const w = Math.ceil(maxWidth) + px;
  const h = Math.ceil(blockH) + px;
  scratch.width = w;
  scratch.height = h;
  sctx.font = `${px}px ${DISPLAY_FONT}`;
  sctx.textAlign = 'center';
  sctx.textBaseline = 'middle';

  // 1. Neon bleed: the letterforms in cyan with a wide soft shadow.
  sctx.shadowColor = '#00f3ff';
  sctx.shadowBlur = px * 0.22;
  sctx.fillStyle = '#00f3ff';
  lines.forEach((line, i) => sctx.fillText(line, w / 2, h / 2 + (i - (lines.length - 1) / 2) * lineHeight));
  sctx.shadowBlur = 0;

  // 2. Black keyline around every letter.
  sctx.strokeStyle = '#000000';
  sctx.lineWidth = Math.max(2, px * 0.09);
  sctx.lineJoin = 'round';
  lines.forEach((line, i) => sctx.strokeText(line, w / 2, h / 2 + (i - (lines.length - 1) / 2) * lineHeight));

  // 3. Striped chrome fill, clipped to the painted letterforms.
  const grad = sctx.createLinearGradient(0, 0, w * Math.cos(stripeAngle), w * Math.sin(stripeAngle));
  for (let i = 0; i < stripeCount; i++) {
    grad.addColorStop(i / stripeCount, CHROME_STOPS[1][1]);
    grad.addColorStop((i + 0.5) / stripeCount, CHROME_STOPS[3][1]);
    grad.addColorStop((i + 1) / stripeCount, CHROME_STOPS[1][1]);
  }
  // Blend the raked stripes over a vertical chrome ramp for the metal falloff.
  const ramp = sctx.createLinearGradient(0, h / 2 - blockH / 2, 0, h / 2 + blockH / 2);
  CHROME_STOPS.forEach(([at, col]) => ramp.addColorStop(at, col));
  sctx.globalCompositeOperation = 'source-in';
  sctx.fillStyle = ramp;
  sctx.fillRect(0, 0, w, h);
  sctx.globalCompositeOperation = 'source-atop';
  sctx.globalAlpha = 0.55;
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, w, h);
  sctx.globalAlpha = 1;

  // 4. Specular sheen across the top half of the letters.
  sctx.globalCompositeOperation = 'source-atop';
  const sheen = sctx.createLinearGradient(0, h / 2 - blockH / 2, 0, h / 2);
  sheen.addColorStop(0, 'rgba(255,255,255,0.55)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  sctx.fillStyle = sheen;
  sctx.fillRect(0, 0, w, h);
  sctx.globalCompositeOperation = 'source-over';

  ctx.drawImage(scratch, cx - w / 2, cy - h / 2);
  return blockH;
}

/** Paints the neon script subtitle centred on (cx, cy): three glow passes and a white core. */
export function drawNeonScript(ctx, text, cx, cy, px, colour = '#ff2d95') {
  const words = text.trim();
  if (!words) return;
  ctx.save();
  ctx.font = `${px}px ${SCRIPT_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const blur of [px * 0.5, px * 0.24, px * 0.08]) {
    ctx.shadowColor = colour;
    ctx.shadowBlur = blur;
    ctx.fillStyle = colour;
    ctx.fillText(words, cx, cy);
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(words, cx, cy);
  ctx.restore();
}

/** One five-pointed star path centred on (cx, cy) with outer radius r. */
export function traceStar(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** Draws the star heat meter: `heat` of 5 gold stars over a heat bar, top-left at (x, y). */
export function drawHeatMeter(ctx, x, y, unit, heat) {
  if (heat <= 0) return;
  const r = unit * 0.5;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = unit * 0.16;
  ctx.shadowOffsetY = unit * 0.08;
  for (let i = 0; i < 5; i++) {
    traceStar(ctx, x + r + i * unit * 1.08, y + r, r);
    ctx.fillStyle = i < heat ? '#ffd700' : 'rgba(20,16,29,0.55)';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.lineWidth = Math.max(1, unit * 0.05);
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.stroke();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = unit * 0.16;
    ctx.shadowOffsetY = unit * 0.08;
  }
  ctx.restore();
  const barW = unit * 5.4;
  const barH = unit * 0.22;
  const barY = y + unit * 1.18;
  const heatGrad = ctx.createLinearGradient(x, 0, x + barW, 0);
  heatGrad.addColorStop(0, '#ffb300');
  heatGrad.addColorStop(1, '#d50000');
  ctx.fillStyle = 'rgba(10,8,18,0.6)';
  ctx.fillRect(x, barY, barW, barH);
  ctx.fillStyle = heatGrad;
  ctx.fillRect(x, barY, barW * (heat / 5), barH);
}

/** Draws a slanted badge ribbon with a folded tail, its top-left near (x, y). */
export function drawBadgeRibbon(ctx, x, y, w, h, text, colour = '#e53935') {
  const label = text.trim().toUpperCase();
  if (!label) return;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(-0.1);
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = h * 0.3;
  ctx.shadowOffsetY = h * 0.14;
  ctx.fillStyle = colour;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  // Fold shadow at the ribbon's lower-left tail.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.moveTo(-w / 2, h / 2);
  ctx.lineTo(-w / 2 + h * 0.5, h / 2);
  ctx.lineTo(-w / 2, h / 2 - h * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(1, h * 0.05);
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.font = `${h * 0.52}px ${TAG_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, 0, h * 0.03);
  ctx.restore();
}

/** Draws a small dark role tag chip with a pointer notch, top-left at (x, y). */
export function drawRoleTag(ctx, x, y, h, text) {
  const label = text.trim().toUpperCase();
  if (!label) return;
  ctx.save();
  ctx.font = `${h * 0.58}px ${TAG_FONT}`;
  const w = ctx.measureText(label).width + h * 0.9;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = h * 0.25;
  ctx.shadowOffsetY = h * 0.1;
  ctx.fillStyle = 'rgba(16,12,26,0.88)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h * 0.18);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#00f3ff';
  ctx.beginPath();
  ctx.moveTo(x + h * 0.28, y + h * 0.5);
  ctx.lineTo(x + h * 0.52, y + h * 0.3);
  ctx.lineTo(x + h * 0.52, y + h * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, x + h * 0.68, y + h * 0.54);
  ctx.restore();
}
