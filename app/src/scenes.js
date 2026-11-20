// Painted backdrop scenes and poster texture for Neon Shores Cover Studio.
//
// Panels do not all need a photograph: two scenes are painted procedurally
// (a palm-silhouette sunset sky and a neon street), and every panel can be
// finished with the printed-poster treatment — a halftone dot screen, a
// paper grain and a vignette — so a cover reads as a printed poster
// artifact rather than a stack of plain photo frames.

/** Fills `rect` with a vertical gradient from a list of [at, colour] stops. */
export function fillGradientRect(ctx, rect, stops) {
  const grad = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  stops.forEach(([at, col]) => grad.addColorStop(at, col));
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** Draws one palm silhouette: a curved trunk and a crown of fronds, rooted at (x, y). */
function drawPalmSilhouette(ctx, x, y, height, lean, colour) {
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineCap = 'round';
  const topX = x + lean * height;
  const topY = y - height;
  ctx.lineWidth = height * 0.045;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * height * 0.3, y - height * 0.6, topX, topY);
  ctx.stroke();
  const fronds = 7;
  for (let i = 0; i < fronds; i++) {
    const a = Math.PI * (0.08 + 0.84 * (i / (fronds - 1)));
    const len = height * (0.34 + 0.1 * Math.sin(i * 2.7));
    const ex = topX + Math.cos(a) * len;
    const ey = topY - Math.sin(a) * len * 0.45 + len * 0.22;
    ctx.lineWidth = height * 0.02;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + Math.cos(a) * len * 0.6, topY - Math.sin(a) * len * 0.5, ex, ey);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(topX, topY, height * 0.035, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The Vice sky scene: sunset gradient, sun disc, skyline and palm silhouettes. */
export function drawViceSkyScene(ctx, rect) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  fillGradientRect(ctx, rect, [
    [0, '#2b1055'], [0.35, '#7b2d8b'], [0.62, '#e84e6f'], [0.82, '#f78c4b'], [1, '#ffd76e'],
  ]);
  // Sun disc low on the horizon, banded like a retro poster sun.
  const sunR = rect.h * 0.3;
  const sunX = rect.x + rect.w * 0.68;
  const sunY = rect.y + rect.h * 0.78;
  const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
  sunGrad.addColorStop(0, '#ffe95c');
  sunGrad.addColorStop(1, '#ff7b39');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(43,16,85,0.55)';
  for (let i = 0; i < 4; i++) {
    const by = sunY + sunR * (0.08 + i * 0.2);
    ctx.fillRect(sunX - sunR, by, sunR * 2, sunR * 0.07);
  }
  // Skyline silhouette along the foot.
  ctx.fillStyle = '#160a2e';
  const base = rect.y + rect.h;
  const towers = [0.0, 0.09, 0.16, 0.27, 0.35, 0.47, 0.55, 0.66, 0.74, 0.85, 0.93, 1.0];
  const heights = [0.3, 0.46, 0.36, 0.55, 0.4, 0.5, 0.34, 0.58, 0.42, 0.52, 0.38, 0.3];
  ctx.beginPath();
  ctx.moveTo(rect.x, base);
  for (let i = 0; i < towers.length - 1; i++) {
    const x0 = rect.x + towers[i] * rect.w;
    const x1 = rect.x + towers[i + 1] * rect.w;
    const top = base - heights[i] * rect.h * 0.5;
    ctx.lineTo(x0, top);
    ctx.lineTo(x1, top);
  }
  ctx.lineTo(rect.x + rect.w, base);
  ctx.closePath();
  ctx.fill();
  // Lit windows.
  ctx.fillStyle = 'rgba(255,214,110,0.85)';
  for (let i = 0; i < 26; i++) {
    const wx = rect.x + ((i * 37.7) % 100) / 100 * rect.w;
    const wy = base - ((i * 53.3) % 40) / 100 * rect.h;
    ctx.fillRect(wx, wy, rect.w * 0.008, rect.h * 0.014);
  }
  drawPalmSilhouette(ctx, rect.x + rect.w * 0.1, base, rect.h * 0.72, 0.16, '#160a2e');
  drawPalmSilhouette(ctx, rect.x + rect.w * 0.94, base, rect.h * 0.58, -0.2, '#160a2e');
  ctx.restore();
}

/** The neon street scene: wet-night gradient, glow signs and a street sheen. */
export function drawNeonStreetScene(ctx, rect) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  fillGradientRect(ctx, rect, [
    [0, '#050510'], [0.45, '#0d0d2b'], [0.75, '#1b003b'], [1, '#0a0618'],
  ]);
  // Building masses.
  ctx.fillStyle = '#0a0a1f';
  ctx.fillRect(rect.x, rect.y + rect.h * 0.18, rect.w * 0.3, rect.h * 0.62);
  ctx.fillRect(rect.x + rect.w * 0.68, rect.y + rect.h * 0.1, rect.w * 0.32, rect.h * 0.7);
  // Neon signs: glowing rounded bars in cyan, pink and gold.
  const signs = [
    [0.06, 0.3, 0.2, 0.07, '#00f3ff'], [0.08, 0.44, 0.15, 0.06, '#ff2d95'],
    [0.74, 0.24, 0.18, 0.07, '#ff2d95'], [0.76, 0.4, 0.13, 0.06, '#ffd700'],
    [0.4, 0.2, 0.2, 0.08, '#bc13fe'], [0.44, 0.36, 0.12, 0.05, '#00f3ff'],
  ];
  for (const [fx, fy, fw, fh, col] of signs) {
    const sx = rect.x + fx * rect.w;
    const sy = rect.y + fy * rect.h;
    const sw = fw * rect.w;
    const sh = fh * rect.h;
    ctx.save();
    ctx.shadowColor = col;
    ctx.shadowBlur = rect.h * 0.05;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.roundRect(sx, sy, sw, sh, sh * 0.5);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.roundRect(sx + sw * 0.08, sy + sh * 0.3, sw * 0.84, sh * 0.4, sh * 0.2);
    ctx.fill();
  }
  // Wet street sheen at the foot.
  const sheen = ctx.createLinearGradient(0, rect.y + rect.h * 0.8, 0, rect.y + rect.h);
  sheen.addColorStop(0, 'rgba(0,243,255,0)');
  sheen.addColorStop(0.5, 'rgba(255,45,149,0.22)');
  sheen.addColorStop(1, 'rgba(0,243,255,0.3)');
  ctx.fillStyle = sheen;
  ctx.fillRect(rect.x, rect.y + rect.h * 0.8, rect.w, rect.h * 0.2);
  ctx.restore();
}

/** A plain sunset gradient fill, for callout and spacer panels. */
export function drawSunsetGradient(ctx, rect) {
  fillGradientRect(ctx, rect, [
    [0, '#3d1a5c'], [0.4, '#d94f70'], [0.72, '#f28c4b'], [1, '#ffc75f'],
  ]);
}

let halftonePattern = null;

/** Overlays a halftone dot screen on `rect` — the printed-poster texture. */
export function applyHalftoneScreen(ctx, rect, cellPx, alpha) {
  if (!halftonePattern) {
    const p = document.createElement('canvas');
    p.width = 8;
    p.height = 8;
    const pctx = p.getContext('2d');
    pctx.fillStyle = '#000';
    pctx.beginPath();
    pctx.arc(4, 4, 1.6, 0, Math.PI * 2);
    pctx.fill();
    halftonePattern = p;
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const pattern = ctx.createPattern(halftonePattern, 'repeat');
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'multiply';
  // Scale the 8px pattern cell to the requested dot pitch.
  const m = new DOMMatrix().scale(cellPx / 8);
  pattern.setTransform(m);
  ctx.fillStyle = pattern;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

let grainTile = null;

/** Builds (once) a 256px tile of monochrome noise for the paper grain. */
function getGrainTile() {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const cctx = c.getContext('2d');
  const img = cctx.createImageData(256, 256);
  let seed = 1234567;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const v = 96 + (seed % 128);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  cctx.putImageData(img, 0, 0);
  grainTile = c;
  return c;
}

/** Overlays film/paper grain across the whole canvas. */
export function applyPaperGrain(ctx, width, height, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'overlay';
  const pattern = ctx.createPattern(getGrainTile(), 'repeat');
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/** Darkens the canvas edges with a radial vignette in deep indigo. */
export function applyVignette(ctx, width, height, strength) {
  const r = Math.hypot(width, height) / 2;
  const grad = ctx.createRadialGradient(width / 2, height / 2, r * 0.52, width / 2, height / 2, r);
  grad.addColorStop(0, 'rgba(26,10,46,0)');
  grad.addColorStop(1, `rgba(26,10,46,${strength})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}
