import sharp from 'sharp';
import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

const FOLDERS = [
  'portofoliu-studio',
  'portofoliu-studio2',
  'portofoliu-studio3',
  'portofoliu-studio4',
  'portofoliu-studio5',
  'portofoliu-studio6',
  'portofoliu-studio7',
];

const PUBLIC_DIR = join(process.cwd(), 'public');
const SM_WIDTH = 900;
const SM_QUALITY = 70;

let processed = 0;
let skipped = 0;
let totalBefore = 0;
let totalAfter = 0;

for (const folder of FOLDERS) {
  const dir = join(PUBLIC_DIR, folder);
  const files = readdirSync(dir).filter(
    (f) => f.toLowerCase().endsWith('.webp') && !f.includes('-sm.')
  );

  for (const file of files) {
    const srcPath = join(dir, file);
    const smName = file.replace(/\.webp$/i, '-sm.webp');
    const smPath = join(dir, smName);

    if (existsSync(smPath)) {
      skipped++;
      continue; // deja generată la o rulare anterioară
    }

    const srcSize = statSync(srcPath).size;

    // withoutEnlargement — pt. pozele deja <= 900px, doar re-codează la
    // calitatea țintă (nu mărește), ca fișierul „-sm" să existe mereu, fără
    // excepții pe care componenta ar trebui să le cunoască la runtime.
    await sharp(srcPath)
      .resize({ width: SM_WIDTH, withoutEnlargement: true })
      .webp({ quality: SM_QUALITY })
      .toFile(smPath);

    const smSize = statSync(smPath).size;
    totalBefore += srcSize;
    totalAfter += smSize;
    processed++;
    console.log(`${folder}/${file}: ${(srcSize / 1024).toFixed(0)}KB -> ${smName} ${(smSize / 1024).toFixed(0)}KB`);
  }
}

console.log(`\nGata. ${processed} variante generate, ${skipped} sarite (deja <= ${SM_WIDTH}px).`);
console.log(`Total: ${(totalBefore / 1024 / 1024).toFixed(2)}MB -> ${(totalAfter / 1024 / 1024).toFixed(2)}MB (doar pt. imaginile procesate)`);
