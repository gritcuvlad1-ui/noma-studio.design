import fs from 'node:fs';
import path from 'node:path';
import { projects } from '../src/data/projects';
import { getProjectCoverImage } from '../src/utils/projectCover';
import { buildSrcSet, smallestSrc } from '../src/utils/images';
import {
  NOT_FOUND_COPY,
  NOT_FOUND_PHOTO_SIZES,
  type NotFoundLang,
} from '../src/pages/notFoundCopy';

/* 404.html: pagina pe care Vercel o servește, cu cod HTTP 404, pentru orice
   adresă care nu există (nu e fișier static și nu începe cu /admin, vezi
   vercel.json). E o pagină STATICĂ, fără bundle JS al aplicației: nu are cum
   să dea erori de hidratare pe /ru/... sau /en/... și se încarcă instant.
   Stilurile vin din src/pages/NotFound.css (aceeași sursă ca pagina React), iar
   textele din src/pages/notFoundCopy.ts. Un script inline de câteva rânduri
   alege limba după prefixul adresei (/ru, /en; implicit română). */

const LANGS: NotFoundLang[] = ['ro', 'ru', 'en'];
const PREFIX: Record<NotFoundLang, string> = { ro: '', ru: '/ru', en: '/en' };
const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400&family=Inter:wght@400&family=Jost:wght@500&display=swap';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderNotFoundHtml(root: string): string {
  const css = fs.readFileSync(path.resolve(root, 'src/pages/NotFound.css'), 'utf-8');
  const project = projects[0];
  const cover = getProjectCoverImage(project, 0);

  const blocks = LANGS.map((l) => {
    const c = NOT_FOUND_COPY[l];
    const p = PREFIX[l];
    return `<div class="notfound-copy" data-lang="${l}"${l === 'ro' ? '' : ' hidden'}>
        <h1 class="notfound-title">${esc(c.title)}</h1>
        <p class="notfound-text">${esc(c.text)}</p>
        <a class="notfound-cta" href="${p}/contact">${esc(c.cta)}</a>
        <ul class="notfound-links">
          <li><a href="${p || '/'}">${esc(c.home)}</a></li>
          <li><a href="${p}/servicii">${esc(c.services)}</a></li>
          <li><a href="${p}/portofoliu">${esc(c.portfolio)}</a></li>
        </ul>
      </div>`;
  }).join('\n      ');

  const meta = Object.fromEntries(
    LANGS.map((l) => [
      l,
      {
        title: `${NOT_FOUND_COPY[l].pageTitle} | NOMA Studio`,
        view: `${NOT_FOUND_COPY[l].viewProject} ${project.name}, ${project.location}`,
      },
    ])
  );

  return `<!doctype html>
<html lang="ro">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>${esc(meta.ro.title)}</title>
    <meta name="robots" content="noindex, follow" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="${FONTS_URL}" media="print" onload="this.media='all'" />
    <noscript><link rel="stylesheet" href="${FONTS_URL}" /></noscript>
    <style>
      :root { --noma-page-bg: #e8dcc0; }
      html, body { margin: 0; background: #e8dcc0; }
      .notfound-copy[hidden] { display: none; }
${css}
    </style>
  </head>
  <body>
    <div class="notfound-page">
      <a class="notfound-wordmark" href="/">NOMA</a>
      <div class="notfound-container">
      ${blocks}
        <a class="notfound-photo" id="nf-photo" href="/portofoliu/${project.id}" aria-label="${esc(meta.ro.view)}">
          <span class="notfound-photo-frame">
            <img class="notfound-photo-img" src="${esc(smallestSrc(cover))}" srcset="${esc(buildSrcSet(cover))}" sizes="${esc(NOT_FOUND_PHOTO_SIZES)}" alt="${esc(project.name)}" loading="lazy" decoding="async" />
          </span>
          <span class="notfound-photo-caption">${esc(project.name)}, ${esc(project.location)}</span>
        </a>
      </div>
    </div>
    <script>
      (function () {
        var m = ${JSON.stringify(meta)};
        var p = location.pathname;
        var l = /^\\/ru(\\/|$)/.test(p) ? 'ru' : /^\\/en(\\/|$)/.test(p) ? 'en' : 'ro';
        if (l === 'ro') return;
        document.documentElement.lang = l;
        document.title = m[l].title;
        var blocks = document.querySelectorAll('.notfound-copy');
        for (var i = 0; i < blocks.length; i++) blocks[i].hidden = blocks[i].getAttribute('data-lang') !== l;
        var a = document.getElementById('nf-photo');
        a.setAttribute('aria-label', m[l].view);
        a.setAttribute('href', '/' + l + '/portofoliu/${project.id}');
      })();
    </script>
  </body>
</html>
`;
}
