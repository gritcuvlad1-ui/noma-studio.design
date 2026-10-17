/* Lățimile variantelor moderne (AVIF + WebP) generate de
   scripts/generate-modern-images.mjs. Sursa UNICĂ pentru generator (Node) și
   pentru <ResponsivePicture> (browser): dacă adaugi o poză sau o lățime aici,
   rulezi din nou generatorul. Fișier .ts simplu (fără sintaxă de tipuri): Node 24 îl importă direct
   (type stripping), fără compilare. Căile sunt relative la /public.
   REGULĂ: nicio lățime peste lățimea originalului (srcset ar cere un fișier
   care nu există; generatorul nu mărește). */
export const MODERN_WIDTHS = {
  'cursuri/lectiile.jpg': [480, 720, 960, 1280], // afișată 825px pe desktop 1350, ~320px pe mobil
  'cursuri/curs-video-poster.jpg': [720], // `poster` acceptă o singură adresă: 328px afișat × 2
  'portofoliu-studio2/IMG_2616.webp': [320, 480, 640], // /servicii consultatii, inainte: afisata 226-260px, originalul 1536px
  'portofoliu-studio2/IMG_2620.webp': [320, 480, 640], // idem, dupa
  'cursuri/nicu-avatar.jpg': [96, 160], // 64px desktop, 42px mobil
  'curs-landing/practice-masuratori.webp': [360, 540, 700], // 340px, doar desktop
  'curs-landing/practice-santier.webp': [360, 540, 700],
  'curs-landing/practice-showroom.webp': [360, 540, 590], // originalul are 590px; 590 pt. /curs (285px desktop x 2)
  'curs-landing/practice-shoot-1.webp': [200, 340, 520, 700], // bandă: 258px desktop, ~100-170px mobil; 700 = originalul (/curs, DPR 3)
  'curs-landing/practice-shoot-2.webp': [200, 340, 520, 700],
  'curs-landing/practice-shoot-4.webp': [200, 340, 520, 700],
  'curs-landing/practice-shoot-6.webp': [200, 340, 520, 700],
  'curs-landing/practice-shoot-8.webp': [200, 340, 520, 700],
  'curs-landing/practice-shoot-10.webp': [200, 340, 520, 700],
};

/* /curs (adăugat 2026-10-11). Regula: cea mai mare variantă ≥ min(originalul, 2.5 × lățimea maximă afișată),
   deci nicio poză nu iese mai moale decât acum nici la DPR 3. Lățimi afișate măsurate în browser (mobil 390 / desktop 1440):
   zigzag 165-245 / 368, kit + showroom 168-230 / 285, rezultate 340-387 / 496, avatare 88-97 / 136,
   poze proiect 296-318 / 520, fondatori 309-330 / 406. */
export const MODERN_WIDTHS_CURS = {
  'curs-landing/zigzag-2-randare-dormitor.webp': [360, 560, 920],
  'curs-landing/zigzag-3.webp': [360, 560, 920],
  'curs-landing/zigzag-4.webp': [360, 560, 920],
  'curs-landing/zigzag-6.webp': [360, 560, 920],
  'curs-landing/zigzag-album-close2.webp': [360, 560, 900],
  'curs-landing/curriculum-plan-cotat.webp': [360, 560, 920],
  'curs-landing/santier-consultanta.webp': [360, 560, 727],
  'curs-landing/kit-carnet-metru.webp': [200, 340, 600],
  'curs-landing/kit-shoot-1.webp': [200, 340, 600],
  'curs-landing/kit-shoot-2.webp': [200, 340, 600],
  'curs-landing/kit-shoot-3.webp': [200, 340, 600],
  'curs-landing/kit-shoot-4.webp': [200, 340, 600],
  'curs-landing/showroom-1.webp': [300, 460, 712],
  'curs-landing/showroom-2.webp': [300, 460, 712],
  'curs-landing/showroom-3.webp': [300, 460, 712],
  'curs-landing/rezultat-pdf-1.webp': [480, 720, 1000],
  'curs-landing/rezultat-pdf-2.webp': [480, 720, 1000],
  'curs-landing/rezultat-pdf-3.webp': [480, 720, 1000],
  'curs-landing/tour360-poster.webp': [480, 720, 800],
  'curs-landing/testimonial-inesa.webp': [160, 280, 420],
  'curs-landing/testimonial-andreea.webp': [160, 280, 420],
  'curs-landing/testimonial-ana.webp': [160, 280, 420],
  'curs-landing/testimonial-inesa-proiect.webp': [400, 640, 1000],
  'curs-landing/testimonial-andreea-proiect.webp': [400, 640, 1000],
  'curs-landing/testimonial-ana-proiect.webp': [400, 640, 1000],
  'curs-landing/founders-pegas.webp': [400, 640, 900],
  'cursuri/mihaela-avatar.jpg': [96, 160],
};
Object.assign(MODERN_WIDTHS, MODERN_WIDTHS_CURS);
