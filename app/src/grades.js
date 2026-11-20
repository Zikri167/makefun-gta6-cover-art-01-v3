// Colour grades for Neon Shores Cover Studio.
//
// Every grade is a gradient map: a list of colour stops over the luminance
// range, baked once into a 256-entry lookup table, plus a saturation and a
// contrast tweak. applyColourGrade remaps a canvas through that table and
// blends the result with the untouched pixels by the grade strength, so a
// grade can be dialled from a whisper to a full poster look.

/** Parses a "#rrggbb" string into [r, g, b]. */
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Builds the 256x3 lookup table for one grade's stops. */
function buildGradeLut(stops) {
  const pts = stops.map(([at, hex]) => [at, hexToRgb(hex)]);
  const lut = new Uint8ClampedArray(256 * 3);
  for (let v = 0; v < 256; v++) {
    const t = v / 255;
    let a = pts[0];
    let b = pts[pts.length - 1];
    for (let i = 0; i < pts.length - 1; i++) {
      if (t >= pts[i][0] && t <= pts[i + 1][0]) { a = pts[i]; b = pts[i + 1]; break; }
    }
    const span = Math.max(0.0001, b[0] - a[0]);
    const f = Math.min(1, Math.max(0, (t - a[0]) / span));
    for (let c = 0; c < 3; c++) lut[v * 3 + c] = a[1][c] + (b[1][c] - a[1][c]) * f;
  }
  return lut;
}

/** The ten house grades. Stops run shadow -> highlight. */
export const COLOUR_GRADES = [
  {
    id: 'vice-sunset', name: 'Vice Sunset',
    stops: [[0, '#1a0a2e'], [0.15, '#3d1a5c'], [0.35, '#d94f70'], [0.5, '#f28c4b'], [0.65, '#ffc75f'], [0.85, '#ffeb3b'], [1, '#fff8e7']],
    saturation: 1.12, contrast: 1.05,
  },
  {
    id: 'neon-night', name: 'Neon Night',
    stops: [[0, '#050510'], [0.1, '#0d0d2b'], [0.3, '#1b003b'], [0.5, '#00b7c9'], [0.6, '#bc13fe'], [0.75, '#ff2d95'], [0.9, '#ffd700'], [1, '#ffffff']],
    saturation: 1.2, contrast: 1.08,
  },
  {
    id: 'dusk-purple', name: 'Dusk Purple',
    stops: [[0, '#12081f'], [0.25, '#2c1454'], [0.5, '#6a3fa0'], [0.7, '#c86b98'], [0.88, '#f2a65a'], [1, '#fdf0d5']],
    saturation: 1.05, contrast: 1.02,
  },
  {
    id: 'rain-storm', name: 'Rain Storm',
    stops: [[0, '#0a1216'], [0.3, '#1d3038'], [0.55, '#3e6b7a'], [0.78, '#8fb8c4'], [1, '#eaf6f8']],
    saturation: 0.82, contrast: 1.1,
  },
  {
    id: 'golden-hour', name: 'Golden Hour',
    stops: [[0, '#1c0f04'], [0.3, '#5c3312'], [0.55, '#c97b2d'], [0.78, '#f7b733'], [1, '#fff3c4']],
    saturation: 1.08, contrast: 1.0,
  },
  {
    id: 'teal-blockbuster', name: 'Teal Blockbuster',
    stops: [[0, '#02181d'], [0.3, '#06424f'], [0.55, '#0e7c86'], [0.75, '#e08e45'], [1, '#ffe8c2']],
    saturation: 1.1, contrast: 1.12,
  },
  {
    id: 'mono-ink', name: 'Mono Ink',
    stops: [[0, '#050505'], [0.35, '#3a3a3a'], [0.62, '#8a8a8a'], [0.85, '#d9d9d9'], [1, '#ffffff']],
    saturation: 0.0, contrast: 1.18,
  },
  {
    id: 'candy-pop', name: 'Candy Pop',
    stops: [[0, '#2b0a3d'], [0.3, '#7b2d8b'], [0.52, '#ff5d8f'], [0.72, '#ffb35c'], [1, '#fff6ec']],
    saturation: 1.3, contrast: 1.04,
  },
  {
    id: 'desert-heat', name: 'Desert Heat',
    stops: [[0, '#170b06'], [0.3, '#572c14'], [0.55, '#b45f2f'], [0.8, '#eda83a'], [1, '#ffedbe']],
    saturation: 1.02, contrast: 1.06,
  },
  {
    id: 'midnight-chrome', name: 'Midnight Chrome',
    stops: [[0, '#04060a'], [0.28, '#101623'], [0.5, '#2e4057'], [0.72, '#7f9bb3'], [0.9, '#cfd8dc'], [1, '#ffffff']],
    saturation: 0.92, contrast: 1.14,
  },
];

const lutCache = new Map();

/** Returns (and caches) the baked lookup table for a grade id. */
export function gradeLut(gradeId) {
  if (!lutCache.has(gradeId)) {
    const grade = COLOUR_GRADES.find((g) => g.id === gradeId) ?? COLOUR_GRADES[0];
    lutCache.set(gradeId, { lut: buildGradeLut(grade.stops), grade });
  }
  return lutCache.get(gradeId);
}

/**
 * Remaps `canvas` in place through the grade's lookup table.
 * `amount` 0..1 blends graded pixels with the originals.
 */
export function applyColourGrade(canvas, gradeId, amount) {
  if (amount <= 0) return;
  const { lut, grade } = gradeLut(gradeId);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = canvas;
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;
  const sat = grade.saturation;
  const con = grade.contrast;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    const li = lum * 3;
    let nr = lut[li];
    let ng = lut[li + 1];
    let nb = lut[li + 2];
    // Saturation around the mapped colour's own grey, then contrast.
    const grey = 0.2126 * nr + 0.7152 * ng + 0.0722 * nb;
    nr = grey + (nr - grey) * sat;
    ng = grey + (ng - grey) * sat;
    nb = grey + (nb - grey) * sat;
    nr = (nr - 128) * con + 128;
    ng = (ng - 128) * con + 128;
    nb = (nb - 128) * con + 128;
    d[i] = r + (nr - r) * amount;
    d[i + 1] = g + (ng - g) * amount;
    d[i + 2] = b + (nb - b) * amount;
  }
  ctx.putImageData(img, 0, 0);
}
