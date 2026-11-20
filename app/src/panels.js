// Cover layouts for Neon Shores Cover Studio.
//
// A layout is a set of panels in fractional coordinates (x, y, w, h are
// fractions of the cover's width and height, so one layout serves the
// preview and every export size). Panel kinds: 'photo' panels hold a
// picture or a painted scene, 'title' panels carry the chrome title block,
// 'callout' panels carry the big slogan, and a layout may name a hero
// anchor — where the pop-out cut-out stands and how tall it looms.
// Decorations (badge, heat, role) ride on photo panels and are painted
// after the hero, so nothing is ever buried under the pop-out.

/** One panel with its starter fill; `extra` overrides any field. */
function panel(id, label, x, y, w, h, kind, extra = {}) {
  return {
    id, label, x, y, w, h, kind,
    fill: 'photo', photo: 'boulevard',
    zoom: 1.15, ox: 0.5, oy: 0.5, tilt: 0,
    decor: null, frame: false,
    ...extra,
  };
}

/** The nine-panel "Heat" grid — the landscape signature layout. */
function heatNinePanels() {
  return [
    panel('p1', 'Panel 1 · palms', 0, 0, 1 / 3, 1 / 3, 'photo', { photo: 'boulevard', zoom: 1.2, oy: 0.22, tilt: -3 }),
    panel('p2', 'Panel 2 · hero backdrop', 1 / 3, 0, 1 / 3, 1 / 3, 'photo', { photo: 'pier', zoom: 1.25, oy: 0.2 }),
    panel('p3', 'Panel 3 · the car', 2 / 3, 0, 1 / 3, 1 / 3, 'photo', { photo: 'boulevard', zoom: 1.7, ox: 0.32, oy: 0.85, tilt: 2 }),
    panel('p4', 'Panel 4 · the pier', 0, 1 / 3, 0.3, 1 / 3, 'photo', { photo: 'pier', zoom: 1.3, ox: 0.25, oy: 0.6, decor: 'badge' }),
    panel('p5', 'Title block', 0.3, 1 / 3, 0.4, 1 / 3, 'title'),
    panel('p6', 'Panel 6 · sunset', 0.7, 1 / 3, 0.3, 1 / 3, 'photo', { photo: 'boulevard', zoom: 1.45, ox: 0.72, oy: 0.12, decor: 'heat' }),
    panel('p7', 'Panel 7 · vice sky', 0, 2 / 3, 1 / 3, 1 / 3, 'photo', { fill: 'scene-sky', decor: 'role' }),
    panel('p8', 'Callout', 1 / 3, 2 / 3, 1 / 3, 1 / 3, 'callout'),
    panel('p9', 'Panel 9 · the catch', 2 / 3, 2 / 3, 1 / 3, 1 / 3, 'photo', { photo: 'pier', zoom: 1.35, ox: 0.62, oy: 0.35, decor: 'badge2' }),
  ];
}

/** The seven-panel stack — the portrait signature layout. */
function stackSevenPanels() {
  return [
    panel('hero-zone', 'Hero backdrop', 0, 0, 1, 0.4, 'photo', { photo: 'boulevard', zoom: 1.15, oy: 0.16 }),
    panel('p2', 'Panel 2 · the pier', 0, 0.4, 0.5, 0.3, 'photo', { photo: 'pier', zoom: 1.3, oy: 0.4, decor: 'heat' }),
    panel('p3', 'Panel 3 · boulevard', 0.5, 0.4, 0.5, 0.3, 'photo', { photo: 'boulevard', zoom: 1.4, ox: 0.4, oy: 0.7, decor: 'role' }),
    panel('p4', 'Title block', 0, 0.7, 0.34, 0.3, 'title'),
    panel('p5', 'Callout', 0.34, 0.7, 0.33, 0.3, 'callout'),
    panel('p6', 'Panel 6 · open water', 0.67, 0.7, 0.33, 0.3, 'photo', { photo: 'pier', zoom: 1.5, ox: 0.8, oy: 0.3, decor: 'badge2' }),
  ];
}

/** The quad grid with a title band — the square signature layout. */
function quadBandPanels() {
  return [
    panel('p1', 'Panel 1 · boulevard', 0, 0, 0.5, 0.42, 'photo', { photo: 'boulevard', zoom: 1.2, oy: 0.3 }),
    panel('p2', 'Panel 2 · the pier', 0.5, 0, 0.5, 0.42, 'photo', { photo: 'pier', zoom: 1.25, oy: 0.35 }),
    panel('band', 'Title band', 0, 0.42, 1, 0.16, 'title'),
    panel('p3', 'Panel 3 · neon street', 0, 0.58, 0.5, 0.42, 'photo', { fill: 'scene-neon' }),
    panel('p4', 'Panel 4 · the car', 0.5, 0.58, 0.5, 0.42, 'photo', { photo: 'boulevard', zoom: 1.6, ox: 0.3, oy: 0.85, decor: 'heat' }),
  ];
}

/** Hero-and-three: one tall hero photograph, three stacked beats beside it. */
function heroAndThreePanels() {
  return [
    panel('hero-photo', 'Hero photograph', 0, 0, 0.52, 1, 'photo', { photo: 'boulevard', zoom: 1.1, oy: 0.35 }),
    panel('r1', 'Beat 1 · the pier', 0.52, 0, 0.48, 0.34, 'photo', { photo: 'pier', zoom: 1.3, oy: 0.3 }),
    panel('r2', 'Beat 2 · vice sky', 0.52, 0.34, 0.48, 0.33, 'photo', { fill: 'scene-sky' }),
    panel('r3', 'Beat 3 · open water', 0.52, 0.67, 0.48, 0.33, 'photo', { photo: 'pier', zoom: 1.45, ox: 0.75, oy: 0.45, decor: 'badge2' }),
    panel('title-over', 'Title block', 0.01, 0.64, 0.5, 0.34, 'title'),
  ];
}

/** Full bleed: a single photograph edge to edge, title band across the foot. */
function fullBleedPanels() {
  return [
    panel('bg', 'Full-bleed photograph', 0, 0, 1, 1, 'photo', { photo: 'boulevard', zoom: 1.05, oy: 0.35 }),
    panel('band', 'Title band', 0, 0.7, 1, 0.3, 'title', { glass: true }),
  ];
}

/** Tilted snapshots: three framed prints scattered on an ink backdrop. */
function tiltedSnapshotPanels() {
  return [
    panel('s1', 'Snapshot 1', 0.04, 0.14, 0.4, 0.52, 'photo', { photo: 'boulevard', zoom: 1.15, oy: 0.35, tilt: -6, frame: true }),
    panel('s2', 'Snapshot 2', 0.33, 0.06, 0.4, 0.52, 'photo', { photo: 'pier', zoom: 1.2, oy: 0.35, tilt: 3, frame: true }),
    panel('s3', 'Snapshot 3', 0.6, 0.26, 0.37, 0.5, 'photo', { photo: 'boulevard', zoom: 1.7, ox: 0.3, oy: 0.85, tilt: 7, frame: true, decor: 'heat' }),
    panel('band', 'Title band', 0, 0.76, 1, 0.24, 'title'),
  ];
}

/** Layout catalogue per post size: signature layout first. */
export const LAYOUTS_BY_SIZE = {
  landscape: [
    { id: 'heat9', name: 'Heat — 9-panel grid', panels: heatNinePanels, hero: { cx: 0.5, top: -0.02, height: 0.44 } },
    { id: 'hero3', name: 'Hero and three', panels: heroAndThreePanels, hero: { cx: 0.52, top: 0.16, height: 0.58 } },
    { id: 'bleed', name: 'Full bleed', panels: fullBleedPanels, hero: { cx: 0.8, top: 0.26, height: 0.52 } },
    { id: 'snap', name: 'Tilted snapshots', panels: tiltedSnapshotPanels, hero: null },
  ],
  portrait: [
    { id: 'stack7', name: 'Stack — 7-panel portrait', panels: stackSevenPanels, hero: { cx: 0.5, top: 0.01, height: 0.47 } },
    { id: 'hero3', name: 'Hero and three', panels: heroAndThreePanels, hero: { cx: 0.52, top: 0.2, height: 0.5 } },
    { id: 'bleed', name: 'Full bleed', panels: fullBleedPanels, hero: { cx: 0.76, top: 0.3, height: 0.44 } },
    { id: 'snap', name: 'Tilted snapshots', panels: tiltedSnapshotPanels, hero: null },
  ],
  square: [
    { id: 'quad4', name: 'Quad + title band', panels: quadBandPanels, hero: { cx: 0.5, top: 0.1, height: 0.31 } },
    { id: 'hero3', name: 'Hero and three', panels: heroAndThreePanels, hero: { cx: 0.52, top: 0.18, height: 0.52 } },
    { id: 'bleed', name: 'Full bleed', panels: fullBleedPanels, hero: { cx: 0.78, top: 0.28, height: 0.48 } },
    { id: 'snap', name: 'Tilted snapshots', panels: tiltedSnapshotPanels, hero: null },
  ],
};

/** The export pixel size for each post size key. */
export const EXPORT_SIZES = {
  landscape: [1920, 1080],
  portrait: [1080, 1350],
  square: [1080, 1080],
};

/** Finds a layout definition by size and id, falling back to the signature. */
export function layoutFor(sizeKey, layoutId) {
  const list = LAYOUTS_BY_SIZE[sizeKey] ?? LAYOUTS_BY_SIZE.landscape;
  return list.find((l) => l.id === layoutId) ?? list[0];
}
