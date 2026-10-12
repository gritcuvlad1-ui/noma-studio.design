/* Trimiterea formularelor de contact (homepage + /contact) către /api/contact
   (funcția Vercel din `api/contact.ts`, care trimite emailul prin SMTP, implicit Gmail).

   Pozele de inspirație se MICȘOREAZĂ în browser înainte de trimitere (max 1600px
   pe latura lungă, JPEG): funcțiile Vercel primesc cel mult 4.5MB per cerere,
   iar o poză de telefon are 3-8MB. Dacă o poză nu poate fi decodată (ex. HEIC în
   Chrome), nu blocăm formularul: ea e trecută pe nume în `skipped` și apare în
   email ca „n-a putut fi atașată”. */

export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  message: string;
  terms: boolean;
  package: string;
  lang: 'ro' | 'ru' | 'en';
  /* câmpul-capcană pentru roboți (trebuie să rămână gol) */
  website: string;
}

interface Attachment {
  name: string;
  type: 'image/jpeg';
  data: string;
}

/* Sub plafonul serverului (3.8M caractere base64), cu rezervă pentru restul JSON-ului. */
const BUDGET_BASE64 = 3_300_000;
const STEPS: Array<{ side: number; quality: number }> = [
  { side: 1600, quality: 0.8 },
  { side: 1280, quality: 0.7 },
  { side: 1024, quality: 0.6 },
  { side: 800, quality: 0.5 },
];

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function shrink(file: File, side: number, quality: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  /* fundal alb: un PNG transparent devine JPEG, altfel ar ieși negru */
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
  if (!blob) throw new Error('toBlob');
  return blobToBase64(blob);
}

async function prepareImages(files: File[]): Promise<{ attachments: Attachment[]; skipped: string[] }> {
  const skipped: string[] = [];
  for (const step of STEPS) {
    const attachments: Attachment[] = [];
    skipped.length = 0;
    let total = 0;
    for (const file of files) {
      try {
        const data = await shrink(file, step.side, step.quality);
        attachments.push({ name: file.name, type: 'image/jpeg', data });
        total += data.length;
      } catch {
        skipped.push(file.name);
      }
    }
    if (total <= BUDGET_BASE64) return { attachments, skipped: [...skipped] };
  }
  /* chiar și la cea mai mică treaptă depășește: trimitem doar mesajul, pozele pe nume */
  return { attachments: [], skipped: files.map((f) => f.name) };
}

export async function sendContact(payload: ContactPayload, files: File[]): Promise<void> {
  const { attachments, skipped } = files.length ? await prepareImages(files) : { attachments: [], skipped: [] };
  const res = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      page: window.location.pathname,
      attachments,
      skipped,
    }),
  });
  if (!res.ok) throw new Error(`contact ${res.status}`);
  const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
  if (!json?.ok) throw new Error('contact not ok');
}
