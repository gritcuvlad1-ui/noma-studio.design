import type { Language } from '../i18n/types';

/* ═══════════════════════════════════════════════════════════════
   ARTICOLE DE BLOG — conținut REAL, cu pagină proprie.

   De ce un fișier de date și nu i18n: un articol are corp lung și
   structurat (titluri, liste, note), nu șiruri scurte de interfață.
   `i18n/types.ts` ar cere fiecare cheie în TOATE cele trei limbi, deci
   n-ai putea publica un articol până nu-l traduci integral. Aici
   traducerile sunt OPȚIONALE: articolul apare doar în limbile în care
   chiar există, iar restul nu primesc nici link, nici pagină, nici
   intrare în sitemap (nimic gol trimis la indexare).

   Corpul e STRUCTURAT (blocuri tipizate), nu HTML într-un șir de text:
   se randează cu elemente semantice reale, fără `dangerouslySetInnerHTML`.

   ⚠️ La adăugarea unui articol nou se modifică ȘI:
   • `vite.config.ts`  → PRERENDERED_ROUTES (pregenerarea HTML-ului)
   • `public/sitemap.xml` → adresa articolului
   Altfel articolul există în browser, dar nu ajunge la Google.
═══════════════════════════════════════════════════════════════ */

export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'note'; text: string };

export type BlogTranslation = {
  title: string;
  /** doar pentru <title> din <head>, când `title` + sufixul „| NOMA Studio" depășește ~65 de caractere */
  seoTitle?: string;
  /** meta description + rezumatul din listă (o singură sursă, fără dublură) */
  excerpt: string;
  readingTime: string;
  body: BlogBlock[];
};

export type BlogPost = {
  slug: string;
  /** ISO — pentru <time dateTime> și pentru schema BlogPosting */
  date: string;
  /** afișat în listă/articol, per limbă */
  dateLabel: Partial<Record<Language, string>>;
  translations: Partial<Record<Language, BlogTranslation>>;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'cat-costa-un-proiect-de-design-interior',
    date: '2026-08-25',
    dateLabel: { ro: '25 august 2026' },
    translations: {
      ro: {
        title: 'Cât costă un proiect de design interior la NOMA Studio',
        seoTitle: 'Cât costă un proiect de design interior',
        excerpt:
          'Cele trei pachete NOMA, de la 17€/m² la 37€/m²: ce conține fiecare, prin ce diferă concret și cum alegi fără să plătești pentru lucruri de care nu ai nevoie.',
        readingTime: '5 min',
        body: [
          {
            type: 'p',
            text: 'Prima întrebare pe care o primim aproape de fiecare dată este „cât costă". Răspunsul scurt: la NOMA Studio, un proiect de design interior pornește de la 17€/m² și ajunge la 37€/m², în funcție de pachetul ales. Răspunsul lung, cel care chiar te ajută să decizi, e mai jos.',
          },
          {
            type: 'h2',
            text: 'De ce prețul se calculează pe metru pătrat',
          },
          {
            type: 'p',
            text: 'Un proiect de design interior nu e un produs de raft, cu preț fix. Munca depinde direct de cât spațiu are de acoperit: un apartament cu o cameră și unul cu patru camere cer același tip de documentație, dar în volume complet diferite. Fiecare încăpere în plus înseamnă alt releveu, alt plan de mobilare, alte desfășurate, alte randări.',
          },
          {
            type: 'p',
            text: 'De aceea prețul se exprimă pe metru pătrat. E singurul mod în care doi clienți cu locuințe diferite plătesc proporțional cu munca reală depusă pentru fiecare, nu o sumă rotundă gândită „la mijloc". În practică, asta îți dă și un instrument bun de estimare: știi suprafața, știi pachetul, ai deja ordinul de mărime al bugetului înainte să ne scrii.',
          },
          {
            type: 'h2',
            text: 'NOMA Basic — 17€/m²',
          },
          {
            type: 'p',
            text: 'Pachetul de intrare, gândit pentru cine vrea o direcție clară și un plan corect, fără nivelul de detaliu tehnic al unui proiect de execuție complet. Include:',
          },
          {
            type: 'ul',
            items: [
              'Vizita inițială pe șantier, ca să vedem spațiul real, nu doar planul de la dezvoltator',
              'Planul releveu — situația exactă a spațiului, cu măsurători corecte',
              'Un plan de amplasare a mobilierului',
              'Planul final de compartimentare',
              'O variantă de randări 3D, fără modificări ulterioare',
            ],
          },
          {
            type: 'p',
            text: 'Detaliul important e ultimul: randările vin într-o singură variantă, fără runde de modificări. Basic e potrivit dacă ai deja o idee destul de limpede despre ce vrei și cauți pe cineva care să o așeze profesionist pe hârtie. Dacă știi din start că vei vrea să compari soluții și să ajustezi, pachetul următor te costă mai puțin nervi.',
          },
          {
            type: 'h2',
            text: 'NOMA Tehnic — 28€/m²',
          },
          {
            type: 'p',
            text: 'Aici intri în zona proiectului tehnic propriu-zis, cel după care se poate executa fără improvizații pe șantier. Include:',
          },
          {
            type: 'ul',
            items: [
              'Album tehnic complet',
              'Două variante de amplasare a mobilierului',
              'Randări 3D cu câte o modificare pe cameră',
              'Consultanță după livrarea proiectului',
            ],
          },
          {
            type: 'p',
            text: 'Diferența față de Basic nu e „mai multe pagini", ci libertatea de a compara și de a corecta. Două variante de mobilare înseamnă că vezi spațiul gândit în două logici diferite, nu doar una. O modificare pe cameră înseamnă că ai dreptul să spui „aici vreau altfel" după ce vezi randarea, ceea ce în practică se întâmplă aproape mereu.',
          },
          {
            type: 'p',
            text: 'Albumul tehnic complet e partea pe care o vei aprecia abia pe șantier: e documentul din care echipa de execuție lucrează fără să te sune la fiecare decizie.',
          },
          {
            type: 'h2',
            text: 'NOMA Signature — 37€/m²',
          },
          {
            type: 'p',
            text: 'Pachetul complet, pentru cine vrea ca proiectul să fie dus până la capăt, inclusiv în perioada de execuție. Include:',
          },
          {
            type: 'ul',
            items: [
              'Compartimentările interioare ale mobilierului',
              'Supraveghere pe șantier',
              'Consultanță după livrarea proiectului',
              'Cinci vizite în magazine partenere',
            ],
          },
          {
            type: 'p',
            text: 'Supravegherea pe șantier este elementul care schimbă cel mai mult rezultatul final. Un proiect bun executat prost rămâne un proiect prost la final, iar cele mai multe abateri nu apar din rea-voință, ci din decizii luate rapid, pe loc, de cineva care nu are proiectul în cap. Cineva care trece periodic pe la lucrare și verifică prinde acele abateri cât mai pot fi corectate ieftin.',
          },
          {
            type: 'p',
            text: 'Compartimentările interioare ale mobilierului sunt cealaltă parte subestimată: nu doar unde stă dulapul, ci cum e organizat pe dinăuntru. Iar cele cinci vizite în magazine partenere înseamnă că nu alegi finisajele singur, dintr-un catalog, ci împreună cu designerul, în fața materialului real.',
          },
          {
            type: 'h2',
            text: 'Design exterior: de ce nu are preț afișat',
          },
          {
            type: 'p',
            text: 'Pentru design exterior nu afișăm un preț fix, iar asta nu e o formă de a evita răspunsul. Proiectele de exterior variază mult prea mult ca să fie încadrate onest într-un tarif unic pe metru pătrat: o fațadă, o curte și o zonă de relaxare complet amenajată sunt lucrări de complexități diferite. Oferta se face individual, după ce vedem despre ce e vorba.',
          },
          {
            type: 'h2',
            text: 'Dacă nu ai nevoie de un proiect întreg',
          },
          {
            type: 'p',
            text: 'Nu orice situație cere un proiect complet. Uneori ai nevoie doar de un răspuns competent la două-trei întrebări: ce culoare merge pe peretele acela, cum reorganizezi o cameră care nu funcționează, dacă merită să muți un perete. Pentru astfel de cazuri există consultația de design, într-unul din trei formate: online prin video, la studio cu mostrele pe masă, sau direct pe șantier.',
          },
          {
            type: 'p',
            text: 'E o variantă mult mai rezonabilă decât un proiect complet de care nu ai nevoie, și de multe ori e suficientă.',
          },
          {
            type: 'h2',
            text: 'Cum alegi între cele trei',
          },
          {
            type: 'p',
            text: 'Întrebarea utilă nu este „care e cel mai bun pachet", ci „cât din drum vreau să merg singur". Basic îți dă direcția și documentația de bază. Tehnic îți dă proiectul complet, cu spațiu de ajustare. Signature îți dă proiectul plus prezența noastră în perioada în care se lucrează efectiv.',
          },
          {
            type: 'p',
            text: 'Dacă ești între două variante, ia în calcul un lucru: diferența de preț dintre pachete se măsoară în euro pe metru pătrat, iar costul unei greșeli de execuție se măsoară în refăcut. Pe un apartament obișnuit, saltul de la un pachet la altul e adesea mai mic decât o singură lucrare reluată.',
          },
          {
            type: 'note',
            text: 'Prețurile din acest articol sunt cele valabile la data publicării. Pentru o estimare exactă pe suprafața ta, scrie-ne — răspundem cu un calcul concret, nu cu un interval.',
          },
        ],
      },
    },
  },
];

/** Articolele disponibile într-o limbă anume (cele fără traducere sunt sărite). */
export function postsFor(language: Language): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.translations[language]);
}

export function postBySlug(slug: string | undefined): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
