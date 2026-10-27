/* ═════════════════════════════════════════════════
   AVIF PENTRU POZELE DE PORTOFOLIU (adăugat 2026-10-27)

   De ce: pozele din portofoliu (src/data/imageMeta.ts, 1420 de fișiere WebP)
   erau servite doar ca WebP. AVIF q50 are ~53-62% din mărimea WebP-ului
   (măsurat pe 5 poze: 135 → 75 KB). Fișierele AVIF se scriu LÂNGĂ cele WebP
   (același nume, extensia .avif); sursele NU se ating (regulă de proiect).

   Folosite prin utils/images.ts (`buildSrcSet(src, withThumbs, 'avif')`) și
   <PortfolioPicture>. Exact aceleași lățimi ca WebP-urile, deci `sizes` rămâne
   valabil.

   Rulare: `node scripts/generate-portfolio-avif.mjs` (idempotent).
══════════════════════════════════════════════════ */
import sharp from 'sharp';
import { existsSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

const PUBLIC_DIR = join(process.cwd(), 'public');
const QUALITY = Number(process.env.AVIF_Q || 50);
const meta = readFileSync(join(process.cwd(), 'src/data/imageMeta.ts'), 'utf8');
const files = [...meta.matchAll(/'([^']+\.webp)'\s*:/g)].map((m) => m[1]);

let made = 0, skipped = 0, bigger = 0, webpBytes = 0, avifBytes = 0;
const queue = [...files];
async function worker() {
  while (queue.length) {
    const rel = queue.pop();
    const src = join(PUBLIC_DIR, rel);
    const out = src.replace(/\.webp$/i, '.avif');
    if (existsSync(out)) { skipped++; continue; }
    await sharp(src).avif({ quality: QUALITY, effort: 4 }).toFile(out);
    const w = statSync(src).size, a = statSync(out).size;
    webpBytes += w; avifBytes += a; made++;
    if (a >= w) { bigger++; console.log('AVIF MAI MARE:', rel, w, a); }
    if (made % 100 === 0) console.log(made, 'gata');
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
console.log(`gata: ${made} create, ${skipped} existau, ${bigger} mai mari decât WebP; WebP ${Math.round(webpBytes / 1024)} KB → AVIF ${Math.round(avifBytes / 1024)} KB`);
