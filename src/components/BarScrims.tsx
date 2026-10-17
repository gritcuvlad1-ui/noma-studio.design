import { useEffect } from 'react';

/* Barele browserului (status bar sus, bara Safari jos) în culoarea unui strat
   deschis peste pagină: meniul hamburger, lightbox-uri de poze, modalul de clip.
   2026-10-14, cerut de Vlad: „când deschid meniul hamburger sau poze sau clip,
   barele să fie de aceeași culoare cu fundalul”. Aceeași rețetă ca lightbox-urile
   de pe /curs (CursLanding.tsx / CursLanding.css), pusă într-un singur loc:

   1) `useBarTheme`: <meta name="theme-color"> TRANZITORIU, cât stratul e deschis
      (index.html n-are theme-color static, intenționat; pagina normală rămâne
      pe culoarea ei). Safari îl citește la schimbare.
   2) `BarScrims`: două benzi SOLIDE, opace, în capetele ecranului. Safari își
      eșantionează barele din culoarea paginii de sub ele, iar browserele in-app
      (Instagram, Telegram) NU citesc theme-color. Banda de jos pornește din
      `100dvh`, unde trăiește bara Safari (diferența dintre 100lvh și 100svh),
      nu doar în safe-area. Stilurile: `.bar-scrim` în index.css. */
export function useBarTheme(active: boolean, color: string) {
  useEffect(() => {
    if (!active) return;
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = color;
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, [active, color]);
}

/* `top` = culoarea fundalului stratului la marginea de sus; `bottom` = la cea de
   jos (implicit aceeași). De pus DUPĂ fundalul stratului în DOM și sub butoane/
   conținut (acestea au z-index > 1). */
export default function BarScrims({ top, bottom }: { top: string; bottom?: string }) {
  return (
    <>
      <div className="bar-scrim bar-scrim--top" style={{ background: top }} aria-hidden="true" />
      <div className="bar-scrim bar-scrim--bottom" style={{ background: bottom ?? top }} aria-hidden="true" />
    </>
  );
}
