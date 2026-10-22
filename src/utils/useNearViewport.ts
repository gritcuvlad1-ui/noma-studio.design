import { useEffect, useState, type RefObject } from 'react';

/* `true` din momentul în care elementul ajunge la `margin` px de ecran (și
   rămâne `true`). Pentru conținut de sub primul ecran pe care nu vrem să-l
   descărcăm odată cu pagina: PageSpeed socotește în primul ecran tot ce s-a
   cerut până atunci, deci pozele și codul de mai jos îl întârziau (2026-10-23).
   NU `loading="lazy"` în benzile cu translateX: acolo pozele apăreau goale (§110).
   Pe server și la prima randare e `false` ⇒ fără eroare de hidratare.
   Un element `display:none` nu intră niciodată ⇒ nu se descarcă deloc. */
export function useNearViewport(ref: RefObject<Element | null>, margin = 600) {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: `${margin}px 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin, near]);

  return near;
}
