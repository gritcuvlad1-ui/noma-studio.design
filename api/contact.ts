/* ═════════════════════════════════════════════════
   POST /api/contact — trimite mesajul din formularele de contact pe email.

   Rulează ca funcție serverless Vercel (folderul `api/` din rădăcină). Trimite
   prin SMTP (implicit Gmail) către `office@noma.md`; `Reply-To` = emailul
   vizitatorului, deci „Răspunde” merge direct la client.

   Din 2026-10-12 NU mai e legat de Zoho (căsuța `office@noma.md` e a companiei,
   parola ei nu e la noi): trimite dintr-un Gmail cu parolă de APLICAȚIE.

   Variabile de mediu (Vercel → Settings → Environment Variables), NICIUNA în cod:
     `SMTP_USER`  adresa Gmail din care pleacă mesajul (obligatorie)
     `SMTP_PASS`  parola de aplicație Google, 16 caractere (obligatorie, secretă)
     `SMTP_HOST`  implicit `smtp.gmail.com`
     `CONTACT_TO` destinatarul, implicit `office@noma.md`
   Compatibil cu setarea veche: dacă `SMTP_*` lipsesc, se citesc `ZOHO_SMTP_*`.

   Fișier AUTONOM (fără importuri relative): proiectul e `"type":"module"`, iar
   Vercel compilează funcțiile separat de aplicația Vite.
══════════════════════════════════════════════════ */
import nodemailer from 'nodemailer';
import { z } from 'zod';

/* Tipuri minime — evită dependența de @vercel/node doar pentru tipuri. */
interface Req {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}
interface Res {
  status(code: number): Res;
  setHeader(name: string, value: string): Res;
  json(body: unknown): void;
}

const SMTP_HOST = process.env.SMTP_HOST || process.env.ZOHO_SMTP_HOST || 'smtp.gmail.com';
const SMTP_USER = process.env.SMTP_USER || process.env.ZOHO_SMTP_USER || '';
const MAIL_TO = process.env.CONTACT_TO || 'office@noma.md';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ATTACHMENTS = 5;
/* Vercel taie corpul cererii la 4.5MB; base64 = ~1.37× fișierul. */
const MAX_TOTAL_BASE64 = 3_800_000;

const Attachment = z.object({
  name: z.string().max(120),
  type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  data: z.string().max(MAX_TOTAL_BASE64),
});

const Body = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().max(200).regex(EMAIL_RE),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => v.replace(/\D/g, '').length >= 8),
  message: z.string().trim().min(10).max(5000),
  terms: z.literal(true),
  package: z.string().trim().max(200).optional().default(''),
  lang: z.enum(['ro', 'ru', 'en']).catch('ro'),
  page: z.string().max(200).optional().default(''),
  /* capcană pentru roboți: câmp ascuns, un om nu-l completează niciodată */
  website: z.string().max(200).optional().default(''),
  attachments: z.array(Attachment).max(MAX_ATTACHMENTS).optional().default([]),
  /* poze care n-au putut fi micșorate în browser (ex. HEIC) — doar numele */
  skipped: z.array(z.string().max(120)).max(10).optional().default([]),
});

/* Limită simplă per instanță: 5 mesaje / 10 minute / IP. Nu e persistentă între
   instanțe, dar oprește un val de trimiteri dintr-un singur loc. */
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return false;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();

/* Verifică antetul real al fișierului, nu doar tipul declarat de client. */
function looksLikeImage(buf: Buffer, type: string): boolean {
  if (type === 'image/jpeg') return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (type === 'image/png') return buf.length > 4 && buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  if (type === 'image/webp')
    return buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP';
  return false;
}

const LANG_LABEL = { ro: 'română', ru: 'rusă', en: 'engleză' } as const;

export default async function handler(req: Req, res: Res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: 'invalid' });
  const d = parsed.data;

  /* Robot: răspundem „ok” ca să nu afle că a fost prins, dar nu trimitem nimic. */
  if (d.website.trim() !== '') return res.status(200).json({ ok: true });

  const fwd = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ ok: false, error: 'rate_limited' });

  const totalB64 = d.attachments.reduce((n, a) => n + a.data.length, 0);
  if (totalB64 > MAX_TOTAL_BASE64) return res.status(413).json({ ok: false, error: 'too_large' });

  const files = [];
  for (const a of d.attachments) {
    const buf = Buffer.from(a.data, 'base64');
    if (!looksLikeImage(buf, a.type)) return res.status(400).json({ ok: false, error: 'invalid_file' });
    const ext = a.type === 'image/png' ? 'png' : a.type === 'image/webp' ? 'webp' : 'jpg';
    const base = oneLine(a.name).replace(/\.[a-z0-9]+$/i, '').replace(/[^\w.\- ]+/g, '').slice(0, 60) || 'poza';
    files.push({ filename: `${base}.${ext}`, content: buf, contentType: a.type });
  }

  const pass = process.env.SMTP_PASS || process.env.ZOHO_SMTP_PASS;
  if (!pass || !SMTP_USER) {
    console.error('contact: lipsesc SMTP_USER / SMTP_PASS din variabilele de mediu Vercel');
    return res.status(500).json({ ok: false, error: 'not_configured' });
  }

  const name = oneLine(d.name);
  const lines = [
    `Nume: ${name}`,
    `Email: ${d.email}`,
    `Telefon: ${oneLine(d.phone)}`,
    d.package ? `Pachet / curs selectat: ${oneLine(d.package)}` : '',
    `Limba site-ului: ${LANG_LABEL[d.lang]}`,
    d.page ? `Pagina: ${oneLine(d.page)}` : '',
    files.length ? `Poze atașate: ${files.length}` : '',
    d.skipped.length ? `Poze care n-au putut fi atașate: ${d.skipped.map(oneLine).join(', ')}` : '',
    '',
    'Mesaj:',
    d.message,
  ].filter((l, i, arr) => l !== '' || arr[i - 1] !== '');
  const text = lines.join('\n');
  const html =
    `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222">` +
    lines
      .map((l) => (l === '' ? '<br>' : `<div>${esc(l)}</div>`))
      .join('') +
    `</div>`;

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: 465,
      secure: true,
      auth: { user: SMTP_USER, pass },
    });
    await transporter.sendMail({
      from: { name: 'Site noma.md', address: SMTP_USER },
      to: MAIL_TO,
      replyTo: { name, address: d.email },
      subject: `Mesaj nou de pe noma.md: ${name}`.slice(0, 150),
      text,
      html,
      attachments: files,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact: trimiterea prin SMTP a eșuat', err instanceof Error ? err.message : err);
    return res.status(502).json({ ok: false, error: 'send_failed' });
  }
}
