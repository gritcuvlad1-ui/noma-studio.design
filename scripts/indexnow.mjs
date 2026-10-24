/* ═══════════════════════════════════════════════════════════════
   IndexNow: anunță Bing, Yandex (și ceilalți din protocol) că s-au
   schimbat pagini, ca să nu aștepte să treacă singuri pe site.

   De ce (2026-10-24): ChatGPT, când caută pe internet, se bazează în mare
   parte pe indexul Bing, iar site-ul nu era conectat la Bing deloc. Google
   NU folosește IndexNow (pentru el: Search Console → „Solicită indexarea”).

   Cheia = fișierul `public/<cheie>.txt` (conținutul = cheia). Dovedește că
   noi deținem domeniul; nu e un secret.

   Rulare, DUPĂ ce deploy-ul e live (altfel motoarele citesc versiunea veche):
     node scripts/indexnow.mjs                 # toate adresele din sitemap-ul live
     node scripts/indexnow.mjs /blog /servicii # doar paginile schimbate
═══════════════════════════════════════════════════════════════ */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const SITE = 'https://noma.md';
const HOST = new URL(SITE).host;

const keyFile = readdirSync(join(process.cwd(), 'public')).find((f) => /^[a-f0-9]{32}\.txt$/.test(f));
if (!keyFile) throw new Error('Lipsește public/<cheie>.txt');
const key = readFileSync(join(process.cwd(), 'public', keyFile), 'utf8').trim();

// cheia trebuie să fie deja live, altfel IndexNow respinge cererea (403)
const live = await fetch(`${SITE}/${keyFile}`);
if (!live.ok || (await live.text()).trim() !== key) {
  throw new Error(`${SITE}/${keyFile} nu e încă live: publică întâi, apoi rulează din nou`);
}

let urls = process.argv.slice(2).map((p) => (p.startsWith('http') ? p : SITE + p));
if (!urls.length) {
  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
  urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key, keyLocation: `${SITE}/${keyFile}`, urlList: urls }),
});
// 200 = primit, 202 = primit (cheia se verifică ulterior); orice altceva = eroare
console.log(`IndexNow: ${res.status} ${res.statusText} pentru ${urls.length} adrese`);
if (res.status !== 200 && res.status !== 202) {
  console.log(await res.text());
  process.exit(1);
}
