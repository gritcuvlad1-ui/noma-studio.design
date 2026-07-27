import sharp from 'sharp';
import { readdir, stat, rename, writeFile, readFile } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

async function getAllImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getAllImages(full)));
    } else if (/\.(jpe?g|png)$/i.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

async function compressImage(filePath) {
  const ext = extname(filePath).toLowerCase();
  const webpPath = filePath.replace(/\.(jpe?g|png)$/i, '.webp');

  try {
    const info = await sharp(filePath)
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toFile(webpPath);

    const origSize = (await stat(filePath)).size;
    const newSize = (await stat(webpPath)).size;
    const saving = ((1 - newSize / origSize) * 100).toFixed(0);
    console.log(`✓ ${basename(filePath)} → ${(newSize/1024).toFixed(0)}KB (−${saving}%)`);
    return { orig: filePath, webp: webpPath };
  } catch (err) {
    console.error(`✗ ${basename(filePath)}: ${err.message}`);
    return null;
  }
}

async function updateReferences(conversions) {
  // Build a map: /path/file.jpeg → /path/file.webp (public-relative)
  const map = new Map();
  for (const c of conversions) {
    if (!c) continue;
    const origRel = c.orig.replace(PUBLIC_DIR, '').replace(/\\/g, '/');
    const webpRel = c.webp.replace(PUBLIC_DIR, '').replace(/\\/g, '/');
    map.set(origRel, webpRel);
  }

  // Update projects.ts
  const tsPath = join(__dirname, '..', 'src', 'data', 'projects.ts');
  let content = await readFile(tsPath, 'utf8');
  let updated = content;
  for (const [orig, webp] of map) {
    updated = updated.replaceAll(orig, webp);
  }
  if (updated !== content) {
    await writeFile(tsPath, updated, 'utf8');
    console.log('\n✓ projects.ts actualizat');
  }

  // Also check for any other .ts/.tsx files that reference images
  const srcDir = join(__dirname, '..', 'src');
  await updateDir(srcDir, map);
}

async function updateDir(dir, map) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await updateDir(full, map);
    } else if (/\.(tsx?|css|html)$/.test(entry.name)) {
      let content = await readFile(full, 'utf8');
      let updated = content;
      for (const [orig, webp] of map) {
        updated = updated.replaceAll(orig, webp);
      }
      if (updated !== content) {
        await writeFile(full, updated, 'utf8');
        console.log(`✓ ${entry.name} actualizat`);
      }
    }
  }
}

async function main() {
  console.log('🔍 Caut imagini în public/...\n');
  const images = await getAllImages(PUBLIC_DIR);
  console.log(`Găsite ${images.length} imagini. Comprimăm...\n`);

  // Process in batches of 8 to avoid memory issues
  const BATCH = 8;
  const results = [];
  for (let i = 0; i < images.length; i += BATCH) {
    const batch = images.slice(i, i + BATCH);
    const batchResults = await Promise.all(batch.map(compressImage));
    results.push(...batchResults);
    process.stdout.write(`\rProgres: ${Math.min(i + BATCH, images.length)}/${images.length}`);
  }

  console.log('\n\n📝 Actualizez referințele...');
  await updateReferences(results.filter(Boolean));

  const total = results.filter(Boolean).length;
  console.log(`\n✅ Gata! ${total} imagini convertite la WebP.`);
  console.log('💡 Poți șterge manual fișierele originale .jpeg/.png după verificare.');
}

main().catch(console.error);
