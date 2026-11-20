// Hero cut-outs for Neon Shores Cover Studio — no machine learning, no
// network: a colour-key flood fill that eats only the background connected
// to the photo's edges, an edge feather, an inked silhouette variant, and a
// hand erase brush for the last stray pixels. The finished cut-out is
// composited as the classic poster pop-out: a soft drop shadow, a white
// keyline ring, then the subject itself, so it can bleed across panels.

const WORK_MAX = 560;

/** Draws `img` onto a fresh canvas no larger than WORK_MAX on either side. */
function workCanvasFor(img) {
  const scale = Math.min(1, WORK_MAX / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.round(img.naturalWidth * scale));
  c.height = Math.max(2, Math.round(img.naturalHeight * scale));
  c.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, c.width, c.height);
  return c;
}

/**
 * Collects the key colours along the image border — the background the
 * flood fill may eat. Only saturated colours qualify: a near-neutral bin
 * (weathered wood, concrete, grey hair, shaded cloth) matches half the
 * photo and would eat the subject from the inside, so bins whose
 * saturation (max-min)/max under 0.22 are skipped, however common they
 * are. Falls back to the single commonest bin if nothing saturated shows.
 */
function borderKeyColours(data, w, h) {
  const bins = new Map();
  const sample = (x, y) => {
    const i = (y * w + x) * 4;
    const key = `${data[i] >> 5},${data[i + 1] >> 5},${data[i + 2] >> 5}`;
    bins.set(key, (bins.get(key) ?? 0) + 1);
  };
  for (let x = 0; x < w; x += 2) { sample(x, 0); sample(x, h - 1); }
  for (let y = 0; y < h; y += 2) { sample(0, y); sample(w - 1, y); }
  const ranked = [...bins.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key.split(',').map((v) => (parseInt(v, 10) << 5) + 16));
  const saturated = ranked.filter((c) => (Math.max(...c) - Math.min(...c)) / Math.max(...c) >= 0.22);
  return (saturated.length ? saturated : ranked).slice(0, 3);
}

/** Weighted RGB distance between pixel i of `data` and an [r,g,b] colour. */
function colourDistance(data, i, colour) {
  const dr = data[i] - colour[0];
  const dg = data[i + 1] - colour[1];
  const db = data[i + 2] - colour[2];
  return Math.sqrt(dr * dr * 0.3 + dg * dg * 0.45 + db * db * 0.25);
}

/**
 * Flood-fills from every border pixel through background pixels. A pixel
 * joins the background when it sits within `tolerance` of one of the two
 * dominant border key colours, or when it grows from a background neighbour
 * in a small colour step while staying within 1.5x tolerance of a key — the
 * step limit stops the fill leaking across a railing or a horizon line
 * into skin, hair or cloth that merely shares a border colour's family.
 * Background pockets the fill cannot reach stay subject, so holes inside
 * the subject fill themselves in. Returns a Uint8 mask: 1 = subject.
 */
function edgeConnectedMask(data, w, h, tolerance) {
  const keys = borderKeyColours(data, w, h);
  const keyDistance = (idx) => {
    const i = idx * 4;
    return Math.min(...keys.map((k) => colourDistance(data, i, k)));
  };
  const bg = new Uint8Array(w * h);
  const stack = [];
  const push = (idx, fromIdx) => {
    if (bg[idx]) return;
    const kd = keyDistance(idx);
    if (kd < tolerance) { bg[idx] = 1; stack.push(idx); return; }
    if (fromIdx >= 0 && kd < tolerance * 1.5) {
      const i = idx * 4;
      const j = fromIdx * 4;
      const step = colourDistance(data, i, [data[j], data[j + 1], data[j + 2]]);
      if (step < 16) { bg[idx] = 1; stack.push(idx); }
    }
  };
  for (let x = 0; x < w; x++) { push(x, -1); push((h - 1) * w + x, -1); }
  for (let y = 0; y < h; y++) { push(y * w, -1); push(y * w + w - 1, -1); }
  while (stack.length) {
    const idx = stack.pop();
    const x = idx % w;
    const y = (idx - x) / w;
    if (x > 0) push(idx - 1, idx);
    if (x < w - 1) push(idx + 1, idx);
    if (y > 0) push(idx - w, idx);
    if (y < h - 1) push(idx + w, idx);
  }
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) mask[i] = bg[i] ? 0 : 1;
  return mask;
}

/**
 * Softens a binary mask's edge with a separable box blur over the alpha
 * values themselves — two passes, plain arithmetic, so the feather is the
 * same in every browser (no canvas filter, no self-draw smearing).
 */
function featherMask(mask, w, h, featherPx) {
  let alpha = new Float32Array(w * h);
  for (let i = 0; i < alpha.length; i++) alpha[i] = mask[i] * 255;
  const radius = Math.round(featherPx);
  if (radius <= 0) return alpha;
  const tmp = new Float32Array(w * h);
  for (let pass = 0; pass < 2; pass++) {
    // Horizontal pass.
    for (let y = 0; y < h; y++) {
      let sum = 0;
      const row = y * w;
      for (let x = -radius; x <= radius; x++) sum += alpha[row + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        tmp[row + x] = sum / (radius * 2 + 1);
        const outX = Math.max(0, x - radius);
        const inX = Math.min(w - 1, x + radius + 1);
        sum += alpha[row + inX] - alpha[row + outX];
      }
    }
    // Vertical pass.
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let y = -radius; y <= radius; y++) sum += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        alpha[y * w + x] = sum / (radius * 2 + 1);
        const outY = Math.max(0, y - radius);
        const inY = Math.min(h - 1, y + radius + 1);
        sum += tmp[inY * w + x] - tmp[outY * w + x];
      }
    }
  }
  return alpha;
}

/** Erodes a binary mask by one pixel (a pixel survives with all 4 neighbours). */
function erodeMask(mask, w, h) {
  const out = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      out[i] = mask[i] && mask[i - 1] && mask[i + 1] && mask[i - w] && mask[i + w] ? 1 : 0;
    }
  }
  return out;
}

/** Dilates a binary mask by one pixel (a pixel joins with any 4-neighbour). */
function dilateMask(mask, w, h) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      out[i] = mask[i]
        || (x > 0 && mask[i - 1]) || (x < w - 1 && mask[i + 1])
        || (y > 0 && mask[i - w]) || (y < h - 1 && mask[i + w]) ? 1 : 0;
    }
  }
  return out;
}

/**
 * Cleans a raw key mask into one solid subject: erode twice so thin
 * connections (railings, rods, branches) snap, keep only the largest
 * connected subject (clouds and stray scenery islands go), dilate back,
 * then fill every enclosed hole — a bright patch of shirt or forehead the
 * key leaked into becomes subject again, as it should.
 */
function keepLargestSubject(mask, w, h) {
  let m = erodeMask(erodeMask(mask, w, h), w, h);
  const label = new Int32Array(w * h).fill(-1);
  const stats = [];
  let current = 0;
  for (let start = 0; start < w * h; start++) {
    if (!m[start] || label[start] !== -1) continue;
    const box = { size: 0, minX: w, maxX: 0, minY: h, maxY: 0 };
    const stack = [start];
    label[start] = current;
    while (stack.length) {
      const idx = stack.pop();
      box.size++;
      const x = idx % w;
      const y = (idx - x) / w;
      if (x < box.minX) box.minX = x;
      if (x > box.maxX) box.maxX = x;
      if (y < box.minY) box.minY = y;
      if (y > box.maxY) box.maxY = y;
      const neighbours = [x > 0 ? idx - 1 : -1, x < w - 1 ? idx + 1 : -1, y > 0 ? idx - w : -1, y < h - 1 ? idx + w : -1];
      for (const n of neighbours) {
        if (n >= 0 && m[n] && label[n] === -1) { label[n] = current; stack.push(n); }
      }
    }
    stats.push(box);
    current++;
  }
  // The subject is the largest component — plus any other big component
  // sitting right next to it. A bright horizon line or an eaten collar can
  // slice a head from its torso in the key; the head is still the subject,
  // while far-off islands of the same size are scenery and stay out.
  let main = 0;
  for (let i = 1; i < stats.length; i++) if (stats[i].size > stats[main].size) main = i;
  const keep = new Set([main]);
  if (stats.length) {
    const b = stats[main];
    const padX = w * 0.12;
    const padY = h * 0.12;
    stats.forEach((s, i) => {
      if (i === main || s.size < stats[main].size * 0.15) return;
      const near = s.minX <= b.maxX + padX && s.maxX >= b.minX - padX
        && s.minY <= b.maxY + padY && s.maxY >= b.minY - padY;
      if (near) keep.add(i);
    });
  }
  let subject = new Uint8Array(w * h);
  for (let i = 0; i < subject.length; i++) subject[i] = label[i] === main ? 1 : 0;
  // Merged extra components are eroded twice more before joining: a head
  // shrugs off two pixels, but the thin horizon strip that hitched a ride
  // on it (distant shoreline at neck height) is only a few pixels tall and
  // disappears, instead of sticking out of the silhouette as a stray bar.
  for (const extra of keep) {
    if (extra === main) continue;
    let part = new Uint8Array(w * h);
    for (let i = 0; i < part.length; i++) part[i] = label[i] === extra ? 1 : 0;
    part = erodeMask(erodeMask(part, w, h), w, h);
    for (let i = 0; i < subject.length; i++) subject[i] = subject[i] || part[i];
  }
  subject = dilateMask(dilateMask(dilateMask(subject, w, h), w, h), w, h);
  // Hole fill: flood the non-subject from the border; anything the flood
  // cannot reach is an enclosed hole and joins the subject.
  const reached = new Uint8Array(w * h);
  const stack = [];
  const push = (idx) => { if (!subject[idx] && !reached[idx]) { reached[idx] = 1; stack.push(idx); } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (stack.length) {
    const idx = stack.pop();
    const x = idx % w;
    const y = (idx - x) / w;
    if (x > 0) push(idx - 1);
    if (x < w - 1) push(idx + 1);
    if (y > 0) push(idx - w);
    if (y < h - 1) push(idx + w);
  }
  for (let i = 0; i < subject.length; i++) if (!reached[i]) subject[i] = 1;
  return subject;
}

/**
 * Builds the hero cut-out canvas for `img`.
 * mode 'chroma' keeps the subject's own colours; mode 'silhouette' fills
 * the same mask with a deep indigo-to-magenta ink gradient instead.
 */
export function buildHeroCutout(img, { mode = 'chroma', tolerance = 48, feather = 2.5 } = {}) {
  const work = workCanvasFor(img);
  const w = work.width;
  const h = work.height;
  const wctx = work.getContext('2d', { willReadFrequently: true });
  const imgData = wctx.getImageData(0, 0, w, h);
  const mask = keepLargestSubject(edgeConnectedMask(imgData.data, w, h, tolerance), w, h);
  const alpha = featherMask(mask, w, h, feather);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const octx = out.getContext('2d');
  const result = octx.createImageData(w, h);
  const inkTop = [26, 10, 46];
  const inkBottom = [217, 79, 112];
  for (let y = 0; y < h; y++) {
    const inkMix = y / Math.max(1, h - 1);
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      result.data[i + 3] = alpha[y * w + x];
      if (mode === 'silhouette') {
        result.data[i] = inkTop[0] + (inkBottom[0] - inkTop[0]) * inkMix;
        result.data[i + 1] = inkTop[1] + (inkBottom[1] - inkTop[1]) * inkMix;
        result.data[i + 2] = inkTop[2] + (inkBottom[2] - inkTop[2]) * inkMix;
      } else {
        result.data[i] = imgData.data[i];
        result.data[i + 1] = imgData.data[i + 1];
        result.data[i + 2] = imgData.data[i + 2];
      }
    }
  }
  octx.putImageData(result, 0, 0);
  return out;
}

/** Erases a soft disc from a cut-out canvas at (x, y) — the hand cleanup brush. */
export function eraseCutoutAt(cutout, x, y, radius) {
  const ctx = cutout.getContext('2d');
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  const grad = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius);
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A solid-colour silhouette of a cut-out, for keylines and shadows. */
function silhouetteOf(cutout, colour) {
  const c = document.createElement('canvas');
  c.width = cutout.width;
  c.height = cutout.height;
  const cctx = c.getContext('2d');
  cctx.drawImage(cutout, 0, 0);
  cctx.globalCompositeOperation = 'source-in';
  cctx.fillStyle = colour;
  cctx.fillRect(0, 0, c.width, c.height);
  return c;
}

/**
 * Composites the pop-out: drop shadow first, then a white keyline ring
 * (the silhouette stamped in a circle of offsets), then the cut-out itself,
 * drawn into the target rect (x, y, w, h) on `ctx`.
 */
export function drawPopOutHero(ctx, cutout, x, y, w, h, keylinePx) {
  // Drop shadow: the cut-out's own silhouette, thrown down-right and soft.
  const shadow = silhouetteOf(cutout, '#080412');
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.shadowColor = 'rgba(8,4,18,0.6)';
  ctx.shadowBlur = keylinePx * 3;
  ctx.shadowOffsetY = keylinePx * 2;
  ctx.drawImage(shadow, x, y, w, h);
  ctx.restore();
  // White keyline: the silhouette stamped in a tight circle of offsets,
  // exactly keylinePx out from the subject's edge in every direction.
  const ring = silhouetteOf(cutout, '#ffffff');
  const steps = 12;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    ctx.drawImage(ring, x + Math.cos(a) * keylinePx, y + Math.sin(a) * keylinePx, w, h);
  }
  ctx.drawImage(cutout, x, y, w, h);
}
