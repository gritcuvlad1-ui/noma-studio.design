/* ═══════════════════════════════════════════════════════════════
   VARIANTE RESPONSIVE + MANIFEST DE DIMENSIUNI REALE

   De ce există scriptul ăsta (măsurat, nu presupus):

   1. `srcSet` din cod declara `<original> 1920w` pentru TOATE pozele, dar
      doar 66 din 260 chiar au 1920px lățime — restul sunt între 1024 și
      1900. Browserul alegea pe baza unei lățimi FALSE: pe telefon
      (390px × DPR3 = 1170px necesari) descărca originalul mare crezând
      că-i trebuie, iar pe desktop mare întindea o poză de 1280px peste
      2000px de ecran. De-aici și „poza principală apare întârziată" pe
      telefon, și „nu-mi place cum arată pe desktop" (blurry).

   2. Lipsea o treaptă între 900px (`-sm`) și original. Saltul e prea mare:
      un telefon care are nevoie de ~1200px sărea direct pe original.

   Ce generează:
   - `-md` (1400px) pentru orice original mai lat de 1500px → treapta care
     lipsea; telefoanele moderne (DPR 3) o aleg pe asta în loc de original.
   - `-lg` (1920px) DOAR pentru hero-urile de proiect care au originalul
     sub 1920px, cu redimensionare Lanczos3 + unsharp mask. Nu inventează
     detalii (nimic nu poate), dar păstrează muchiile clare — vizibil mai
     bun decât upscale-ul bicubic moale pe care-l face browserul singur
     când întinde poza peste lățimea ei nativă.
   - `src/data/imageMeta.ts` — lățimea REALĂ a fiecărei variante, ca
     `srcSet` să spună browserului adevărul și să aleagă corect.

   Rulare: `node scripts/generate-image-manifest.mjs`
   Idempotent: sare peste variantele deja existente.
═══════════════════════════════════════════════════════════════ */
import sharp from 'sharp';
import { readdirSync, statSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const FOLDERS = [
  'portofoliu-studio', 'portofoliu-studio2', 'portofoliu-studio3',
  'portofoliu-studio4', 'portofoliu-studio5', 'portofoliu-studio6',
  'portofoliu-studio7',
];

const PUBLIC_DIR = join(process.cwd(), 'public');
const MD_WIDTH = 1400;
const MD_QUALITY = 76;
const LG_WIDTH = 1920;
/* 78, nu 86. `-lg` e o mărire — nu conține detalii reale peste ce avea
   originalul, deci biții în plus se duc pe zgomotul de interpolare, nu pe
   informație. Măsurat pe IMG_3235: q86 = 212KB, q78 = 158KB (−25%), fără
   diferență vizibilă. Contează: e prima poză care se încarcă pe pagină. */
const LG_QUALITY = 78;
const MD_MIN_SOURCE = 1500; // sub asta, `-md` ar fi ~egal cu originalul

/* Hero-urile (images[0] al fiecărui proiect) — citite din projects.ts, ca
   lista să nu se desincronizeze dacă se schimbă ordinea pozelor. */
function readHeroes() {
  const src = readFileSync(join(process.cwd(), 'src/data/projects.ts'), 'utf8');
  const heroes = new Set();
  const re = /images:\s*\[\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src))) heroes.add(m[1]);
  return heroes;
}

const heroes = readHeroes();
console.log(`Hero-uri detectate în projects.ts: ${heroes.size}\n`);

const meta = {};
let mdMade = 0, lgMade = 0, skipped = 0;

for (const folder of FOLDERS) {
  const dir = join(PUBLIC_DIR, folder);
  if (!existsSync(dir)) continue;

  const originals = readdirSync(dir).filter(
    (f) => f.toLowerCase().endsWith('.webp') && !/-(sm|md|lg)\.webp$/i.test(f)
  );

  for (const file of originals) {
    const srcPath = join(dir, file);
    const publicPath = `/${folder}/${file}`;
    const origMeta = await sharp(srcPath).metadata();

    // ── varianta -md (treapta lipsă între 900px și original) ──
    if (origMeta.width > MD_MIN_SOURCE) {
      const mdName = file.replace(/\.webp$/i, '-md.webp');
      const mdPath = join(dir, mdName);
      if (!existsSync(mdPath)) {
        await sharp(srcPath)
          .resize({ width: MD_WIDTH, withoutEnlargement: true, kernel: 'lanczos3' })
          .webp({ quality: MD_QUALITY })
          .toFile(mdPath);
        mdMade++;
        console.log(`  ${folder}/${mdName}  ${(statSync(mdPath).size / 1024).toFixed(0)}KB`);
      } else skipped++;
    }

    // ── varianta -lg (doar hero-uri sub 1920px: upscale Lanczos + unsharp) ──
    if (heroes.has(publicPath) && origMeta.width < LG_WIDTH) {
      const lgName = file.replace(/\.webp$/i, '-lg.webp');
      const lgPath = join(dir, lgName);
      if (!existsSync(lgPath)) {
        await sharp(srcPath)
          .resize({ width: LG_WIDTH, kernel: 'lanczos3' })
          // unsharp mask fin — compensează moliciunea inerentă a măririi.
          // sigma mic + prag: accentuează muchiile, NU zgomotul din zonele plate.
          .sharpen({ sigma: 0.8, m1: 0.6, m2: 2.2 })
          .webp({ quality: LG_QUALITY })
          .toFile(lgPath);
        lgMade++;
        const up = (LG_WIDTH / origMeta.width).toFixed(2);
        console.log(`  ${folder}/${lgName}  ${origMeta.width}px → ${LG_WIDTH}px (${up}× Lanczos+unsharp)  ${(statSync(lgPath).size / 1024).toFixed(0)}KB`);
      } else skipped++;
    }
  }

  // ── manifest: lățimea+înălțimea REALĂ a fiecărei variante existente ──
  for (const f of readdirSync(dir).filter((x) => x.toLowerCase().endsWith('.webp'))) {
    const m = await sharp(join(dir, f)).metadata();
    meta[`/${folder}/${f}`] = [m.width, m.height];
  }
}

const entries = Object.entries(meta).sort(([a], [b]) => a.localeCompare(b));
const out = `/* GENERAT AUTOMAT de scripts/generate-image-manifest.mjs — nu edita manual.
   Lățimea/înălțimea REALĂ a fiecărei variante de imagine din portofoliu.
   Folosit de buildSrcSet() ca \`srcSet\` să declare browserului lățimi
   adevărate — altfel alege greșit varianta (vezi nota din script). */
export const IMAGE_META: Record<string, readonly [number, number]> = {
${entries.map(([k, v]) => `  '${k}': [${v[0]}, ${v[1]}],`).join('\n')}
};
`;

writeFileSync(join(process.cwd(), 'src/data/imageMeta.ts'), out, 'utf8');

console.log(`\nGata.`);
console.log(`  -md generate : ${mdMade}`);
console.log(`  -lg generate : ${lgMade}`);
console.log(`  sarite       : ${skipped} (existau deja)`);
console.log(`  manifest     : ${entries.length} intrări → src/data/imageMeta.ts`);
