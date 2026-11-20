// Neon Shores Cover Studio — the hand-in program (Node 22, standard library only).
//
// The studio itself is the static web app in app/: plain files a desktop
// browser opens offline, no build step, no network. This program copies
// app/ and screenshots/ from beside itself into the output directory and
// writes dossier.json there with the vendored make.fun library, byte for
// byte the summary the judge reads.
//
// Run it locally the same way the grader does, with an output override:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app itself with `node serve.ts` and open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });

const shotsDir = join(repoDir, 'screenshots');
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier caps mirror the scorer's own limits: at most 4 screenshots
// of 256 KiB, at most 993 files and 48 MiB under app/, no app path over
// 1,000 bytes, and the dossier text capped at 160 KiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
