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
  /** doar pentru <title> din <head>, când `title` + sufixul „| NOMA Design" depășește ~65 de caractere */
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
  /* 2026-10-19 — articolele despre curs scriu DOAR fapte deja publicate pe
     /curs și /cursuri (CursLanding.tsx, Cursuri.tsx). Durata, prețul total,
     data de start și formatul grup/individual sunt INTENȚIONAT lipsă: cele
     două pagini se contrazic, iar oferta reală o confirmă Mihaela. Fiecare h2
     e o întrebare de cursant, cu răspunsul complet imediat sub ea (40–80 de
     cuvinte), ca paragraful să poată fi citat singur. */
  {
    slug: 'ghid-curs-design-interior-noma',
    date: '2026-10-19',
    dateLabel: { ro: '19 octombrie 2026' },
    translations: {
      ro: {
        title: 'Cursul de design interior NOMA: tot ce trebuie să știi',
        excerpt:
          'Ce înveți la cursul NOMA School din Chișinău, cum decurg lecțiile live, de ce ai nevoie, cum te înscrii și ce primești la absolvire, pe scurt.',
        readingTime: '5 min',
        body: [
          {
            type: 'p',
            text: 'Cursul de design interior NOMA School te învață să faci un proiect de interior complet, de la măsurătorile pe șantier până la albumul tehnic și randările pe care le predai clientului. Lecțiile sunt live, lunea și vinerea, iar partea practică o faci pe un șantier real și în showroomuri. Mai jos găsești răspunsurile la întrebările pe care ni le pun cel mai des cei care vor să se înscrie.',
          },
          { type: 'h2', text: 'Ce înveți la cursul de design interior?' },
          {
            type: 'p',
            text: 'Înveți să duci un proiect real de la început până la predare. În AutoCAD faci releveul, planul de mobilier, electricitatea, iluminatul, apeductul și canalizarea, desfășurările pereților și borderourile de materiale. În 3Ds Max modelezi spațiul, lucrezi cu lumina și materialele și scoți randări de portofoliu și un tur virtual 360°. Separat înveți cum comunici cu clientul, cum lucrezi cu furnizorii și meșterii și cum predai proiectul final.',
          },
          { type: 'p', text: 'Modulele cursului:' },
          {
            type: 'ul',
            items: [
              'Softul AutoCAD',
              'Softul 3Ds Max',
              'Lucrări de șantier: electricitate, apeduct și canalizare',
              'Psihologia clientului',
              'Metoda de lucru: etapele corecte ale unui proiect',
              'Relații profesionale cu furnizorii, clienții și meșterii',
              'Implementare: produse și coduri reale, detalii practice de șantier',
              'Moodboard',
              'Poziționarea ta pe piață',
              'Primii clienți',
              'Prezentarea finală a proiectului',
            ],
          },
          { type: 'h2', text: 'Ce programe folosești la curs?' },
          {
            type: 'p',
            text: 'Lucrezi în AutoCAD pentru planurile tehnice și în 3Ds Max pentru vizualizările 3D și turul virtual, împreună cu Corona, V-Ray, Multitexture și Floor Generator. Moodboardul îl faci în Canva, cu stilul potrivit clientului tău. Programele de proiectare nu le instalezi singur: după înscriere ți le instalăm noi, de la distanță, pe calculatorul tău.',
          },
          { type: 'h2', text: 'Pot veni la curs dacă nu am nicio experiență?' },
          {
            type: 'p',
            text: 'Da. Cursul e potrivit pentru începători, dar și pentru cei care au mai studiat sau lucrează deja în domeniu. Pornești de la noțiunile de bază din construcții și design, iar nivelul tehnic e destul de ridicat încât și cei cu experiență află lucruri noi, mai ales despre albumul tehnic, lucrul pe șantier și comunicarea cu clientul.',
          },
          { type: 'h2', text: 'De ce ai nevoie ca să participi la curs?' },
          {
            type: 'p',
            text: 'Îți trebuie un laptop sau un PC cu Windows, un mouse, o cameră și un microfon, ca să ne vedem și să vorbim la lecții. Dacă nu ai un calculator potrivit, te ajutăm cu recomandări de specificații. AutoCAD și 3Ds Max, cu pluginurile necesare, le instalăm noi după înscriere, așa că nu ai nevoie de cunoștințe tehnice ca să le configurezi.',
          },
          { type: 'h2', text: 'Cursul se face online sau la birou?' },
          {
            type: 'p',
            text: 'Lecțiile sunt live, pe Zoom, iar linkul de conectare îl primești pe Telegram la fiecare lecție. Practica se face fizic, împreună cu noi: măsurători pe un șantier real și vizite în showroomuri. Așa înveți din ecran tot ce ține de proiectare și vezi pe teren cum arată în realitate ce ai desenat.',
          },
          { type: 'h2', text: 'În ce zile și la ce oră sunt lecțiile?' },
          {
            type: 'p',
            text: 'Lecțiile live au loc lunea și vinerea, între 17:30 și 19:30, deci fiecare lecție durează două ore. Pe parcurs mai sunt lecții live și în unele sâmbete, pentru verificarea temelor sau pentru prezentarea unor subiecte separate. Aceste sâmbete le anunțăm pe parcursul cursului.',
          },
          { type: 'h2', text: 'Ce se întâmplă dacă ratezi o lecție?' },
          {
            type: 'p',
            text: 'Nu pierzi lecția. Imediat după fiecare lecție live primești înregistrarea ei, ca să o revezi oricând ai nevoie. Cu ajutorul înregistrării îți faci și tema pentru acasă. Toate materialele cursului, adică măsurătorile, lecțiile extra și fișierele DWG, le găsești organizate în grupul de Telegram al cursului.',
          },
          { type: 'h2', text: 'Cum arată o lecție și cum primești feedback?' },
          {
            type: 'p',
            text: 'Profesorul își partajează ecranul și îți arată fiecare pas de proiectare în 2D și 3D, iar la final urmează o sesiune de întrebări și răspunsuri. Acasă faci tema și o trimiți profesorului, care îți deschide fișierul și îți scrie feedback. Corectezi proiectul și îl retrimiți. Unele teme le verificăm live, sâmbăta, cu control de la distanță pe calculatorul tău.',
          },
          {
            type: 'note',
            text: 'Temele pentru acasă sunt obligatorii și trebuie trimise profesorului în termenul stabilit.',
          },
          { type: 'h2', text: 'Cine predă la cursul de design interior NOMA?' },
          {
            type: 'p',
            text: 'Cursul îl țin Mihaela și Nicu, fondatorii NOMA, designeri de interior activi, cu proiecte și implementări premium. Cursul e construit din experiența lor reală de proiectare și implementare, așa că înveți metoda după care lucrează studioul pe proiectele lui, de la prima discuție cu clientul până la șantier.',
          },
          { type: 'h2', text: 'Facem practică pe un șantier real?' },
          {
            type: 'p',
            text: 'Da. Din prima zi primești propriul carnet NOMA și un metru rulant, cu care faci primele măsurători pe un șantier real de 6 etaje. Apoi mergem la showroomuri, ca să știi cu ce furnizori să lucrezi și să vezi de aproape materialele și piesele pe care le pui în proiect. Furnizorii te pot ajuta și cu detalii tehnice pentru proiectul tău.',
          },
          { type: 'h2', text: 'Cum te înscrii la curs?' },
          {
            type: 'p',
            text: 'Înscrierea are patru pași și începe cu un mesaj pe WhatsApp sau pe Instagram. Discutăm toate detaliile despre curs și plată înainte să plătești ceva, apoi achiți avansul de 200 €, ești înregistrat la curs și semnăm contractul. Pașii, pe rând:',
          },
          {
            type: 'ul',
            items: [
              'Ne scrii pe WhatsApp sau pe Instagram că vrei să te înscrii.',
              'Discutăm toate detaliile despre curs și plată.',
              'Achiți avansul de 200 € și ești înregistrat la curs.',
              'Semnăm contractul.',
            ],
          },
          { type: 'h2', text: 'Cum se plătește cursul?' },
          {
            type: 'p',
            text: 'Plătești întâi un avans de 200 €, care îți rezervă locul și intră în prețul cursului, nu se adaugă la el. Restul îl poți achita în două sau mai multe tranșe. Prețul exact și calendarul plăților le stabilim împreună la înscriere, când discutăm toate detaliile despre curs.',
          },
          { type: 'h2', text: 'Ce se întâmplă după ce te înscrii?' },
          {
            type: 'p',
            text: 'Stabilim o zi și o oră și îți instalăm de la distanță 3Ds Max cu Corona și AutoCAD. Intri în grupul de Telegram al cursului, unde stau toate materialele, și într-un grup de discuții libere, unde cursanții comunică și se ajută între ei. Când ai nevoie, primești ajutor și feedback și din partea profesorilor.',
          },
          {
            type: 'note',
            text: 'Data de început, durata și prețul următorului curs le confirmăm la înscriere. Scrie-ne pe WhatsApp sau pe Instagram și îți trimitem detaliile actuale.',
          },
        ],
      },
    },
  },
  {
    slug: 'ce-poti-face-dupa-un-curs-de-design-interior',
    date: '2026-10-19',
    dateLabel: { ro: '19 octombrie 2026' },
    translations: {
      ro: {
        title: 'Ce poți face după un curs de design interior',
        excerpt:
          'Ce poți lucra după cursul de design interior NOMA, pe cont propriu sau angajat, și cum au ajuns trei absolvente să lucreze deja la proiecte reale.',
        readingTime: '3 min',
        body: [
          {
            type: 'p',
            text: 'După cursul de design interior NOMA poți lucra pe cont propriu, cu clienții tăi, sau te poți angaja într-o companie, ca proiectant 2D, vizualizator 3D sau designer de interior. Pleci cu un portofoliu, cu un proiect gata de predat unui client și cu certificatul de absolvire.',
          },
          { type: 'h2', text: 'Ce primești la finalul cursului?' },
          {
            type: 'p',
            text: 'La ultima întâlnire primești certificatul de absolvire și treci, punct cu punct, prin tot parcursul tău: ce ai făcut bine și unde mai ai de lucrat. Pleci cu un portofoliu final bine dezvoltat, gata de arătat oricărui client, și cu un proiect implementabil, printat, pe care îl poți preda unui client real.',
          },
          { type: 'h2', text: 'Cum arată absolvirea?' },
          {
            type: 'p',
            text: 'Absolvirea are loc într-un loc frumos, iar fiecare cursant își prezintă proiectul final într-un album, exact cum l-ar prezenta unui client real. Tot atunci ai o mini ședință foto pentru prima ta postare pe Instagram, iar un specialist în social media îți arată cum să-ți prezinți munca și cum să-ți atragi primii clienți.',
          },
          { type: 'h2', text: 'Poți lucra pe cont propriu după curs?' },
          {
            type: 'p',
            text: 'Da. Poți presta singur servicii de design, iar cursul te pregătește și pentru partea de afacere: cum îți construiești imaginea pe piață, cum ajungi la primii clienți și cum le explici valoarea serviciilor tale. Poți lua proiecte întregi sau doar o parte din ele:',
          },
          {
            type: 'ul',
            items: [
              'Pachet complet de design',
              'Doar volumul 2D sau doar partea 3D',
              'Doar moodboard',
              'Consultanță online sau pe șantier',
            ],
          },
          { type: 'h2', text: 'La ce joburi te poți angaja după curs?' },
          {
            type: 'p',
            text: 'Te poți angaja într-o companie ca proiectant 2D, care face planurile și albumul tehnic în AutoCAD, ca vizualizator 3D, care face randările și turul virtual în 3Ds Max, sau ca designer de interior, care duce proiectul de la prima discuție cu clientul până la predare. La curs exersezi partea fiecăruia dintre aceste roluri.',
          },
          { type: 'h2', text: 'Te ajută NOMA cu practica după curs?' },
          {
            type: 'p',
            text: 'După curs există posibilitatea de practică și de integrare în echipa NOMA. Locul în practică se câștigă: Andreea, de exemplu, a câștigat stagiul în compania noastră și lucrează deja la primul ei proiect. Inesa a ajuns tot prin practică proiectant 2D principal în echipă.',
          },
          { type: 'h2', text: 'Ce au făcut absolventele NOMA după curs?' },
          {
            type: 'p',
            text: 'Trei absolvente, trei drumuri. Au între 17 și 22 de ani și au pornit din situații foarte diferite. Una a ajuns proiectant principal în echipa NOMA, una a schimbat complet meseria și lucrează la primul ei proiect, iar a treia a început să lucreze în design încă din liceu:',
          },
          {
            type: 'ul',
            items: [
              'Inesa, 22 de ani, a făcut două cursuri NOMA, apoi practica la NOMA, și a devenit proiectant 2D principal în echipă. De un an lucrează la proiecte reale, iar acum face și proiecte 3D complete, cu moodboard.',
              'Andreea, 21 de ani, a renunțat la jobul de barber ca să învețe design interior. A câștigat stagiul de practică la NOMA și execută primul ei proiect: participă la discuțiile cu clientul, a luat măsurătorile și îl va duce până la capăt, cu verificarea noastră atentă.',
              'Ana Maria, 17 ani, e încă elevă la liceu. După curs lucrează deja la primul ei proiect de design interior: amenajarea unui salon de frumusețe.',
            ],
          },
          {
            type: 'note',
            text: 'Vrei să afli ce înveți la curs, cum decurg lecțiile și cum te înscrii? Citește pe blogul nostru ghidul complet al cursului de design interior NOMA.',
          },
        ],
      },
    },
  },
  {
    slug: 'cat-costa-un-proiect-de-design-interior',
    date: '2026-08-25',
    dateLabel: { ro: '25 august 2026' },
    translations: {
      ro: {
        title: 'Cât costă un proiect de design interior la NOMA Design',
        seoTitle: 'Cât costă un proiect de design interior',
        excerpt:
          'Cele trei pachete NOMA, de la 17€/m² la 37€/m²: ce conține fiecare, prin ce diferă concret și cum alegi fără să plătești pentru lucruri de care nu ai nevoie.',
        readingTime: '5 min',
        body: [
          {
            type: 'p',
            text: 'Prima întrebare pe care o primim aproape de fiecare dată este „cât costă". Răspunsul scurt: la NOMA Design, un proiect de design interior pornește de la 17€/m² și ajunge la 37€/m², în funcție de pachetul ales. Răspunsul lung, cel care chiar te ajută să decizi, e mai jos.',
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
            text: 'NOMA Basic, de la 17€/m²',
          },
          {
            type: 'p',
            text: 'Pachetul de intrare, gândit pentru cine vrea o direcție clară și un plan corect, fără nivelul de detaliu tehnic al unui proiect de execuție complet. Include:',
          },
          {
            type: 'ul',
            items: [
              'Vizita inițială pe șantier, ca să vedem spațiul real, nu doar planul de la dezvoltator',
              'Planul releveu: situația exactă a spațiului, cu măsurători corecte',
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
            text: 'NOMA Tehnic, de la 28€/m²',
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
            text: 'NOMA Signature, de la 37€/m²',
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
            text: 'Prețurile din acest articol sunt cele valabile la data publicării. Pentru o estimare exactă pe suprafața ta, scrie-ne și răspundem cu un calcul concret, nu cu un interval.',
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
