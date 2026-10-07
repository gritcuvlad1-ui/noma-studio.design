import { IMAGE_META } from '../data/imageMeta';

/* ═══════════════════════════════════════════════════════════════
   SRCSET CU LĂȚIMI REALE

   Codul declara înainte `<original> 1920w` pentru toate pozele, dar doar
   66 din 260 chiar au 1920px — restul sunt între 1024 și 1900. Browserul
   alege varianta comparând lățimile din `srcSet` cu ce-i trebuie
   (`sizes` × devicePixelRatio); dacă lățimile mint, alege greșit:
   pe telefon descărca originalul mare degeaba (poza principală apărea cu
   întârziere), iar pe desktop întindea o poză de 1280px peste 2000px.

   Aici lățimile vin din manifestul generat de
   `scripts/generate-image-manifest.mjs`, care le citește din fișierele
   reale. Variantele disponibile, în ordine: -sm (900px), -md (1400px),
   original, -lg (1920px, doar hero-uri upscalate).
═══════════════════════════════════════════════════════════════ */

const VARIANT_SUFFIXES = ['-sm', '-md', '-lg'] as const;

/** '/a/b.webp' + 'sm' → '/a/b-sm.webp' */
function variantPath(src: string, suffix: string): string {
  return src.replace(/\.webp$/i, `${suffix}.webp`);
}

/** Lățimea reală a unei variante, sau 0 dacă fișierul nu există. */
function widthOf(path: string): number {
  return IMAGE_META[path]?.[0] ?? 0;
}

/**
 * Toate variantele existente ale unei imagini, ca `srcSet`, cu lățimile
 * REALE citite din manifest. Duplicatele de lățime sunt eliminate (o poză
 * de 1024px are `-sm` la 900 și originalul la 1024 — ambele utile; dar
 * dacă `-md` ar ieși identic cu originalul, a doua intrare n-ar ajuta pe
 * nimeni și doar ar încurca algoritmul de selecție al browserului).
 */
export function buildSrcSet(src: string): string {
  const seen = new Set<number>();
  const parts: string[] = [];

  const push = (path: string) => {
    const w = widthOf(path);
    if (!w || seen.has(w)) return;
    seen.add(w);
    /* 2026-09-14 (raportat: „srcset invalid, mii de warning-uri în consolă"):
       câteva fișiere din portofoliu au spații în nume (ex. „1 copy 2.webp",
       rămase de la duplicarea lor pe disk) — un spațiu NEENCODAT într-un
       candidat de `srcset` e delimitator de descriptor pentru parser, deci
       browserul rupe URL-ul la fiecare spațiu și aruncă bucățile ca și
       candidați invalizi. `encodeURI` (NU encodeURIComponent — păstrează
       `/`) rezolvă asta la sursă, indiferent câte fișiere au nume murdare. */
    parts.push(`${encodeURI(path)} ${w}w`);
  };

  push(variantPath(src, '-sm'));
  push(variantPath(src, '-md'));
  push(src);
  push(variantPath(src, '-lg'));

  // ordonat crescător după lățime — nu e cerut de spec, dar face
  // atributul lizibil la inspecție în DevTools
  parts.sort((a, b) => parseInt(a.split(' ').pop()!) - parseInt(b.split(' ').pop()!));

  return parts.join(', ');
}

/**
 * `src`-ul de bază (fallback pentru browsere fără `srcSet`, și punctul de
 * plecare al selecției): cea mai mică variantă existentă. Browserele
 * moderne folosesc `srcSet`, deci asta rămâne doar plasă de siguranță.
 */
export function smallestSrc(src: string): string {
  const sm = variantPath(src, '-sm');
  return encodeURI(widthOf(sm) ? sm : src);
}

/**
 * Cea mai MARE variantă existentă — pentru lightbox/fullscreen, unde poza
 * chiar umple ecranul și orice pixel în plus se vede.
 */
export function largestSrc(src: string): string {
  const lg = variantPath(src, '-lg');
  return encodeURI(widthOf(lg) > widthOf(src) ? lg : src);
}

/**
 * `aspect-ratio` real al sursei, ca elementul să-și rezerve spațiul exact
 * înainte să se încarce poza (fără salt de layout).
 */
export function aspectOf(src: string): number | undefined {
  const m = IMAGE_META[src];
  return m ? m[0] / m[1] : undefined;
}

export { VARIANT_SUFFIXES };

/* Lățimea REALĂ a banerului din HeroProjectSlider, ca browserul să aleagă
   varianta corectă din `srcSet` (oglindește regulile din
   HeroProjectSlider.module.css: `calc(100% - 48px)` cu plafon 760px, `- 24px`
   sub 768px, `- 16px` sub 480px). Partajat între slider (cererea reală a pozei)
   și Home (preload-ul din <head>): trebuie să fie IDENTIC în ambele locuri,
   altfel browserul descarcă poza de două ori. */
export const HERO_SIZES =
  '(max-width: 480px) calc(100vw - 16px), (max-width: 768px) calc(100vw - 24px), min(760px, calc(100vw - 48px))';

