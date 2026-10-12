/* ═════════════════════════════════════════════════
   VARIANTE MODERNE (AVIF + WebP) PENTRU POZELE DIN AFARA PORTOFOLIULUI

   De ce (măsurat, PageSpeed 2026-10-10): pe homepage, pozele de mai jos erau
   servite la dimensiunea lor originală, deși apar mult mai mici
   (ex. practice-shoot-*: 700px, afișate la ~168px; lectiile.jpg: 1280px,
   afișată la ~550px). „Îmbunătățește livrarea imaginilor": ~240 KiB.

   Ce face: pentru fiecare sursă din JOBS creează, LÂNGĂ ea, fișiere NOI
   `<nume>-<lățime>w.avif` și `<nume>-<lățime>w.webp`. Sursele NU se modifică
   (regulă de proiect: fișierele-sursă de imagine sunt sacre). Nu mărește
   niciodată peste lățimea originalului.
   Folosite prin componenta <ResponsivePicture> (src/components/ResponsivePicture.tsx),
   care trebuie să primească ACELEAȘI lățimi (constanta MODERN_WIDTHS din
   src/utils/modernImages.ts — sursa unică pentru amândouă).

   Rulare: `node scripts/generate-modern-images.mjs`
   Idempotent: sare peste fișierele deja generate.
══════════════════════════════════════════════════ */
import sharp from 'sharp';
import { existsSync, statSync } from 'fs';
import { join, parse } from 'path';
import { MODERN_WIDTHS } from '../src/utils/modernImages.ts';

const PUBLIC_DIR = join(process.cwd(), 'public');
const AVIF = { quality: 50, effort: 4 };
const WEBP = { quality: 74 };

let made = 0;
let skipped = 0;
for (const [rel, widths] of Object.entries(MODERN_WIDTHS)) {
  const src = join(PUBLIC_DIR, rel);
  const { dir, name } = parse(src);
  const meta = await sharp(src).metadata();
  for (const w of widths) {
    if (w > meta.width) continue; // fără mărire
    for (const [ext, opts] of [['avif', AVIF], ['webp', WEBP]]) {
      const out = join(dir, `${name}-${w}w.${ext}`);
      if (existsSync(out)) { skipped++; continue; }
      const img = sharp(src).resize({ width: w, kernel: 'lanczos3' });
      await (ext === 'avif' ? img.avif(opts) : img.webp(opts)).toFile(out);
      made++;
      console.log(`${rel} → ${name}-${w}w.${ext}  ${Math.round(statSync(out).size / 1024)}KB`);
    }
  }
}
console.log(`gata: ${made} create, ${skipped} existau deja`);

/* ── POSTERE video (/curs): `poster` acceptă o singură adresă, deci nu există
   srcset. Același desen, aceeași lățime, doar WebP în loc de JPEG (suportat de
   toate browserele care redau video inline). JPEG-ul sursă rămâne neatins. ── */
const POSTERS = [
  ['curs-landing/nicu-poster.jpg', 78],
  ['curs-landing/gains-bg-poster.jpg', 78],
  ['cursuri/ultima-sectiune-poster.jpg', 78],
  ['cursuri/curs-video-poster.jpg', 78],
];
for (const [rel, quality] of POSTERS) {
  const src = join(PUBLIC_DIR, rel);
  const { dir, name } = parse(src);
  const out = join(dir, `${name}.webp`);
  if (existsSync(out)) { skipped++; continue; }
  await sharp(src).webp({ quality }).toFile(out);
  console.log(`${rel} → ${name}.webp  ${Math.round(statSync(src).size / 1024)}KB → ${Math.round(statSync(out).size / 1024)}KB`);
}
