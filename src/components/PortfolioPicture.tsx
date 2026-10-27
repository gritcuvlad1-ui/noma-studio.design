import { forwardRef } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { buildSrcSet, smallestSrc } from '../utils/images';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'> & {
  /** calea pozei din portofoliu (WebP, cea din imageMeta) */
  src: string;
  sizes: string;
  /** miniaturile 320/480/640 (doar unde `sizes` e exact, ca în galerie) */
  withThumbs?: boolean;
};

/* <picture> cu AVIF, apoi WebP, pentru pozele de portofoliu (2026-10-27).
   AVIF-urile stau lângă WebP-uri (scripts/generate-portfolio-avif.mjs), cu
   aceleași lățimi, deci același `sizes`. `.rp { display: contents }` (index.css)
   păstrează layout-ul: <picture> nu creează cutie, CSS-ul existent pe <img>
   rămâne valabil. Atributele (loading, fetchpriority, className, alt, ref)
   merg pe <img>, ca înainte. O poză fără variante în manifest (ex. cover
   încărcat din admin) iese ca <img> simplu, exact ca înainte. */
const PortfolioPicture = forwardRef<HTMLImageElement, Props>(function PortfolioPicture(
  { src, sizes, withThumbs, ...img },
  ref,
) {
  const webp = buildSrcSet(src, withThumbs);
  const avif = buildSrcSet(src, withThumbs, 'avif');
  const el = <img ref={ref} src={smallestSrc(src)} srcSet={webp || undefined} sizes={sizes} {...img} />;
  if (!avif) return el;
  return (
    <picture className="rp">
      <source type="image/avif" srcSet={avif} sizes={sizes} />
      {el}
    </picture>
  );
});

export default PortfolioPicture;
