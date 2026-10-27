/* Mozaicul galeriei de pe pagina unui proiect, scos din ProjectDetails.tsx
   (2026-10-27) ca pagina Portofoliu să poată preîncărca EXACT primul rând,
   cu aceleași `sizes` (altfel browserul ar alege altă variantă și ar descărca
   de două ori). Logica e neschimbată. */

export type EditorialRow = {
  type: string;
  items: { img: string; originalIndex: number; span: number }[];
};

/* `sizes` pentru celulele mozaicului, după span (galeria din ProjectDetails.tsx) */
export const GALLERY_SIZES: Record<number, string> = {
  6: '(min-width: 1440px) 640px, 50vw',
  4: '(min-width: 1440px) 420px, 33vw',
  3: '(min-width: 1440px) 310px, 25vw',
};

export const generateEditorialRows = (images: string[]): EditorialRow[] => {
  const rowTypes = ['B', 'C_LEFT', 'B', 'C_MID', 'B', 'C_RIGHT', 'A'];
  const rows: EditorialRow[] = [];
  let i = 0;
  while (i < images.length) {
    const remaining = images.length - i;
    
    if (remaining === 4) {
      rows.push({
        type: 'B',
        items: [
          { img: images[i], originalIndex: i, span: 6 },
          { img: images[i + 1], originalIndex: i + 1, span: 6 }
        ]
      });
      rows.push({
        type: 'B',
        items: [
          { img: images[i + 2], originalIndex: i + 2, span: 6 },
          { img: images[i + 3], originalIndex: i + 3, span: 6 }
        ]
      });
      i += 4;
    } else if (remaining === 2) {
      rows.push({
        type: 'B',
        items: [
          { img: images[i], originalIndex: i, span: 6 },
          { img: images[i + 1], originalIndex: i + 1, span: 6 }
        ]
      });
      i += 2;
    } else if (remaining === 1) {
      rows.push({
        type: 'B',
        items: [{ img: images[i], originalIndex: i, span: 12 }]
      });
      i += 1;
    } else {
      const type = rowTypes[(i / 3) % rowTypes.length];
      let spans = [4, 4, 4];
      if (type === 'C_LEFT') spans = [6, 3, 3];
      if (type === 'C_MID') spans = [3, 6, 3];
      if (type === 'C_RIGHT') spans = [3, 3, 6];

      rows.push({
        type,
        items: [
          { img: images[i], originalIndex: i, span: spans[0] },
          { img: images[i + 1], originalIndex: i + 1, span: spans[1] },
          { img: images[i + 2], originalIndex: i + 2, span: spans[2] }
        ]
      });
      i += 3;
    }
  }
  return rows;
};

// Galeria filtrată (Living/Bucătărie/...) folosește ACELAȘI grid editorial
// (forme/span-uri variate) ca „Toate" — doar setul de imagini diferă.
