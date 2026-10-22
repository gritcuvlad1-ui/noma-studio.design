import type { ImgHTMLAttributes } from 'react';
import { MODERN_WIDTHS } from '../utils/modernImages';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'> & {
  /** calea pozei ORIGINALE (rămâne ultima variantă, pentru browserele vechi) */
  src: string;
  /** lățimea afișată, exact ca în CSS, ca browserul să aleagă varianta corectă */
  sizes: string;
  /** true = încă nu cere poza (vezi mai jos) */
  defer?: boolean;
};

/* srcset-ul (`<nume>-<w>w.<ext> <w>w, ...`) pentru o poză din MODERN_WIDTHS,
   sau null dacă poza nu are variante generate. */
const buildSet = (src: string, ext: string): string | null => {
  const widths = (MODERN_WIDTHS as Record<string, number[]>)[src.replace(/^\//, '')];
  if (!widths) return null;
  const base = src.replace(/\.[a-z0-9]+$/i, '');
  return widths.map((w) => `${base}-${w}w.${ext} ${w}w`).join(', ');
};

/* Doar <source>-urile AVIF + WebP, pentru cazurile în care <img>-ul trebuie să
   rămână al apelantului (ex. motion.img cu parallax, sau un <picture> cu alte
   <source> înaintea lor). Fără variante generate pentru poză, nu iese nimic. */
export function PictureSources({ src, sizes }: { src: string; sizes: string }) {
  const avif = buildSet(src, 'avif');
  if (!avif) return null;
  return (
    <>
      <source type="image/avif" srcSet={avif} sizes={sizes} />
      <source type="image/webp" srcSet={buildSet(src, 'webp') ?? undefined} sizes={sizes} />
    </>
  );
}

/* <picture> cu AVIF, apoi WebP, apoi originalul. Variantele (`<nume>-<w>w.avif`,
   `.webp`) le generează scripts/generate-modern-images.mjs din MODERN_WIDTHS.
   `className`, `alt`, `loading` etc. merg pe <img>, deci CSS-ul existent
   (care țintește <img>) rămâne valabil; `.rp { display: contents }` (index.css)
   face ca <picture> să nu creeze o cutie nouă în layout. O poză care nu e în
   MODERN_WIDTHS iese ca <img> simplu. */
export default function ResponsivePicture({ src, sizes, defer, ...img }: Props) {
  /* `defer`: aceeași cutie (mărimea vine din CSS), dar încă fără poză; sursele
     se pun când apelantul zice că elementul e aproape de ecran (useNearViewport). */
  if (defer) return <img {...img} />;
  if (!buildSet(src, 'avif')) return <img src={src} sizes={sizes} {...img} />;
  return (
    <picture className="rp">
      <PictureSources src={src} sizes={sizes} />
      <img src={src} {...img} />
    </picture>
  );
}
