# Neon Shores Cover Studio

![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)
![rank](https://make.fun/badge/gta6-cover-art-01/Zikri167/makefun-gta6-cover-art-01-v3/rank.svg)
![reward](https://make.fun/badge/gta6-cover-art-01/Zikri167/makefun-gta6-cover-art-01-v3/reward.svg)

An offline cover-art studio that turns your own photos into multi-panel
poster covers in the neon-sunset style: a nine-panel "Heat" grid (plus
stacked-portrait, quad, hero-and-three, full-bleed and tilted-snapshot
layouts), a pop-out hero cut-out that bleeds across the panel borders with
a white keyline and drop shadow, a striped retro-chrome title block with a
neon script subtitle, star heat meters, badge ribbons, role tags and a
callout panel — finished with halftone dots, paper grain and a vignette so
every export reads as a printed poster.

Entry for the make.fun bounty
[gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- **Any photo**: load photos from your machine (they never leave it), fill
  any panel, and crop/position/tilt each one independently. Two painted
  backdrop scenes (palm-sunset sky, neon street) can fill panels too.
- **Pop-out hero**: a colour-key cut-out (edge-connected flood fill with
  tolerance and feather controls), an inked silhouette variant, and a hand
  erase brush for stray pixels — no uploads, no machine learning.
- **Lettering**: the title is painted as striped retro-chrome with a neon
  bleed; the subtitle is a three-pass neon script. Fonts are the SIL OFL
  Anton, Pacifico and Bebas Neue, vendored under `app/fonts/`.
- **Ten colour grades**: Vice Sunset, Neon Night, Dusk Purple, Rain Storm,
  Golden Hour, Teal Blockbuster, Mono Ink, Candy Pop, Desert Heat and
  Midnight Chrome — gradient-map LUTs with a strength slider.
- **Fast exports**: one click renders a full-resolution PNG at 1920×1080,
  1080×1350 or 1080×1080, or all three sizes at once. Undo/redo included.

## Run it

```sh
node serve.ts   # then open http://localhost:8080
```

The app is static files under `app/` — any static file server works, and
it runs fully offline.

## Hand in (the program)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and
`screenshots/` to the output directory and writes `dossier.json` with the
vendored `vendor/makefun-app.ts` library.

## Layout of this repository

- `app/index.html`, `app/style.css` — the editor page and its styling
- `app/src/panels.js` — the cover layouts (fractional panel geometry)
- `app/src/cover.js` — the composition engine that paints a cover
- `app/src/grades.js` — the ten colour grades as gradient-map LUTs
- `app/src/lettering.js` — chrome title, neon script, stars, badges, tags
- `app/src/scenes.js` — painted backdrop scenes and poster texture
- `app/src/cutout.js` — the hero cut-out and pop-out compositing
- `app/src/main.js` — editor state, history, export and screenshot staging
- `app/samples/` — two AI-made sample photos, free to use
- `screenshots/` — renders of the studio and the covers it exports

## License

MIT — see `LICENSE`. The vendored fonts keep their own SIL Open Font
License texts under `app/fonts/`.
