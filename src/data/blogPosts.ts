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
     cuvinte), ca paragraful să poată fi citat singur. Blocul `note` e DOAR
     pentru avertismente reale (ex. „prețuri valabile la data publicării”),
     nu pentru informații care țin de un răspuns: acelea stau în paragraf. */
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
            text: 'Profesorul își partajează ecranul și îți arată fiecare pas de proiectare în 2D și 3D, iar la final urmează o sesiune de întrebări și răspunsuri. Acasă faci tema și o trimiți profesorului, care îți deschide fișierul și îți scrie feedback. Corectezi proiectul și îl retrimiți. Unele teme le verificăm live, sâmbăta, cu control de la distanță pe calculatorul tău. Temele sunt obligatorii și trebuie trimise profesorului în termenul stabilit.',
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
            type: 'p',
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
            type: 'p',
            text: 'Vrei să afli ce înveți la curs, cum decurg lecțiile și cum te înscrii? Citește pe blogul nostru ghidul complet al cursului de design interior NOMA.',
          },
        ],
      },
    },
  },
  {
    slug: 'cat-costa-un-proiect-de-design-interior',
    date: '2026-08-25',
    dateLabel: { ro: '25 august 2026', ru: '25 августа 2026', en: '25 August 2026' },
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
      ru: {
        title: 'Сколько стоит дизайн-проект интерьера в NOMA Design',
        seoTitle: 'Сколько стоит дизайн-проект интерьера в Кишинёве',
        excerpt:
          'Три пакета NOMA, от 17€/м² до 37€/м²: что входит в каждый, чем они отличаются на деле и как выбрать, не переплачивая за то, что вам не нужно.',
        readingTime: '5 мин',
        body: [
          {
            type: 'p',
            text: 'Первый вопрос, который нам задают почти всегда: «сколько это стоит». Короткий ответ: в NOMA Design дизайн-проект интерьера стоит от 17€/м² до 37€/м², в зависимости от выбранного пакета. Длинный ответ, который действительно помогает решить, ниже.',
          },
          { type: 'h2', text: 'Почему цена считается за квадратный метр' },
          {
            type: 'p',
            text: 'Дизайн-проект интерьера не товар с полки с фиксированной ценой. Объём работы напрямую зависит от площади: однокомнатная квартира и квартира с четырьмя комнатами требуют одной и той же документации, но в совершенно разном объёме. Каждая дополнительная комната означает новые обмеры, новый план расстановки мебели, новые развёртки стен и новые визуализации.',
          },
          {
            type: 'p',
            text: 'Поэтому цена указывается за квадратный метр. Только так два клиента с разными квартирами платят пропорционально реальной работе над каждым проектом, а не круглую сумму «где-то посередине». На практике это ещё и удобный способ оценки: вы знаете площадь и пакет, значит, представляете порядок бюджета ещё до того, как нам напишете.',
          },
          { type: 'h2', text: 'NOMA Basic, от 17€/м²' },
          {
            type: 'p',
            text: 'Базовый пакет для тех, кому нужны ясное направление и правильный план, без уровня технической детализации полного рабочего проекта. В него входят:',
          },
          {
            type: 'ul',
            items: [
              'Первичный выезд на объект, чтобы увидеть реальное помещение, а не только план от застройщика',
              'План обмеров: точная фиксация помещения с правильными замерами',
              'Один план расстановки мебели',
              'Финальный план перегородок',
              'Один вариант 3D-визуализаций, без последующих правок',
            ],
          },
          {
            type: 'p',
            text: 'Важна последняя строка: визуализации делаются в одном варианте, без раундов правок. Basic подходит, если вы уже довольно чётко представляете, чего хотите, и ищете того, кто профессионально переведёт это в чертежи. Если вы с самого начала знаете, что захотите сравнивать решения и что-то менять, следующий пакет сбережёт вам нервы.',
          },
          { type: 'h2', text: 'NOMA Tehnic, от 28€/м²' },
          {
            type: 'p',
            text: 'Здесь начинается полноценный рабочий проект, по которому строители работают без импровизаций на объекте. В него входят:',
          },
          {
            type: 'ul',
            items: [
              'Полный технический альбом',
              'Два варианта расстановки мебели',
              '3D-визуализации с одной правкой на комнату',
              'Консультация после сдачи проекта',
            ],
          },
          {
            type: 'p',
            text: 'Отличие от Basic не в том, что «страниц больше», а в возможности сравнивать и исправлять. Два варианта расстановки означают, что вы видите пространство, продуманное в двух разных логиках. Одна правка на комнату означает, что после визуализации вы можете сказать «здесь хочу иначе», а на практике так бывает почти всегда.',
          },
          {
            type: 'p',
            text: 'Полный технический альбом вы оцените уже на объекте: это документ, по которому бригада работает, не звоня вам по каждому решению.',
          },
          { type: 'h2', text: 'NOMA Signature, от 37€/м²' },
          {
            type: 'p',
            text: 'Полный пакет для тех, кто хочет, чтобы проект довели до конца, в том числе во время ремонта. В него входят:',
          },
          {
            type: 'ul',
            items: [
              'Внутреннее наполнение мебели',
              'Авторский надзор на объекте',
              'Консультация после сдачи проекта',
              'Пять визитов в партнёрские магазины',
            ],
          },
          {
            type: 'p',
            text: 'Авторский надзор сильнее всего влияет на итоговый результат. Хороший проект, плохо реализованный, в итоге остаётся плохим, а большинство отклонений возникает не по злому умыслу, а из-за быстрых решений на месте, которые принимает человек, не держащий проект в голове. Тот, кто регулярно приезжает на объект и проверяет работу, замечает такие отклонения, пока их ещё дёшево исправить.',
          },
          {
            type: 'p',
            text: 'Внутреннее наполнение мебели тоже часто недооценивают: важно не только где стоит шкаф, но и как он устроен внутри. А пять визитов в партнёрские магазины означают, что вы выбираете отделку не в одиночку по каталогу, а вместе с дизайнером, глядя на настоящий материал.',
          },
          { type: 'h2', text: 'Дизайн экстерьера: почему цена не указана' },
          {
            type: 'p',
            text: 'Для дизайна экстерьера мы не указываем фиксированную цену, и это не попытка уйти от ответа. Проекты экстерьера слишком разные, чтобы честно уложить их в один тариф за квадратный метр: фасад, двор и полностью обустроенная зона отдыха отличаются по сложности. Предложение делаем индивидуально, когда понимаем задачу.',
          },
          { type: 'h2', text: 'Если вам не нужен целый проект' },
          {
            type: 'p',
            text: 'Не каждая ситуация требует полного проекта. Иногда нужен просто грамотный ответ на два-три вопроса: какой цвет подойдёт для этой стены, как переставить комнату, в которой неудобно, стоит ли переносить перегородку. Для таких случаев есть консультация дизайнера в одном из трёх форматов: онлайн по видео, в студии с образцами на столе или прямо на объекте.',
          },
          {
            type: 'p',
            text: 'Это гораздо разумнее, чем полный проект, который вам не нужен, и часто этого достаточно.',
          },
          { type: 'h2', text: 'Как выбрать из трёх пакетов' },
          {
            type: 'p',
            text: 'Полезный вопрос не «какой пакет лучший», а «какую часть пути я хочу пройти сам». Basic даёт направление и базовую документацию. Tehnic даёт полный проект с возможностью правок. Signature даёт проект плюс наше присутствие в период, когда идёт ремонт.',
          },
          {
            type: 'p',
            text: 'Если вы выбираете между двумя вариантами, учтите одно: разница в цене между пакетами измеряется в евро за квадратный метр, а цена ошибки при ремонте измеряется в переделке. В обычной квартире разница между пакетами часто меньше, чем одна переделанная работа.',
          },
          {
            type: 'note',
            text: 'Цены в статье действуют на дату публикации. Для точного расчёта на вашу площадь напишите нам, и мы ответим конкретной суммой, а не диапазоном.',
          },
        ],
      },
      en: {
        title: 'How much does an interior design project cost at NOMA Design',
        seoTitle: 'Interior design project cost in Chisinau',
        excerpt:
          'The three NOMA packages, from €17/m² to €37/m²: what each one includes, how they actually differ and how to choose without paying for things you do not need.',
        readingTime: '5 min',
        body: [
          {
            type: 'p',
            text: 'The first question we get almost every time is “how much does it cost”. The short answer: at NOMA Design an interior design project costs from €17/m² to €37/m², depending on the package you choose. The longer answer, the one that actually helps you decide, is below.',
          },
          { type: 'h2', text: 'Why the price is calculated per square metre' },
          {
            type: 'p',
            text: 'An interior design project is not an off-the-shelf product with a fixed price. The work depends directly on how much space it has to cover: a one-room flat and a four-room flat need the same kind of documentation, but in completely different volumes. Every extra room means another survey, another furniture layout, more wall elevations and more renders.',
          },
          {
            type: 'p',
            text: 'That is why the price is set per square metre. It is the only way two clients with different homes each pay in proportion to the real work on their project, instead of a round figure picked “somewhere in the middle”. It also gives you a good estimating tool: you know the area and the package, so you know the rough budget before you even write to us.',
          },
          { type: 'h2', text: 'NOMA Basic, from €17/m²' },
          {
            type: 'p',
            text: 'The entry package, for those who want a clear direction and a correct plan without the technical detail of a full construction project. It includes:',
          },
          {
            type: 'ul',
            items: [
              'An initial site visit, so we see the real space, not just the developer’s plan',
              'A survey plan: the exact current state of the space, with accurate measurements',
              'One furniture layout plan',
              'The final partition plan',
              'One version of 3D renders, without later changes',
            ],
          },
          {
            type: 'p',
            text: 'The last point matters: the renders come in a single version, with no rounds of changes. Basic suits you if you already have a fairly clear idea of what you want and need someone to put it on paper professionally. If you know from the start that you will want to compare options and adjust, the next package will cost you less stress.',
          },
          { type: 'h2', text: 'NOMA Tehnic, from €28/m²' },
          {
            type: 'p',
            text: 'This is the actual technical project, the one builders can work from without improvising on site. It includes:',
          },
          {
            type: 'ul',
            items: [
              'A complete technical album',
              'Two furniture layout variants',
              '3D renders with one revision per room',
              'Consultancy after the project is delivered',
            ],
          },
          {
            type: 'p',
            text: 'The difference from Basic is not “more pages” but the freedom to compare and correct. Two furniture layouts mean you see the space thought through in two different ways. One revision per room means you can say “I want this differently” after seeing the render, which in practice happens almost every time.',
          },
          {
            type: 'p',
            text: 'You will value the complete technical album once work starts on site: it is the document the builders work from without calling you about every decision.',
          },
          { type: 'h2', text: 'NOMA Signature, from €37/m²' },
          {
            type: 'p',
            text: 'The full package, for those who want the project carried through to the end, including the construction stage. It includes:',
          },
          {
            type: 'ul',
            items: [
              'Interior furniture compartments',
              'Site supervision',
              'Consultancy after the project is delivered',
              'Five visits to partner stores',
            ],
          },
          {
            type: 'p',
            text: 'Site supervision is what changes the final result the most. A good project built badly ends up a bad project, and most deviations do not come from bad intent but from quick decisions made on the spot by someone who does not have the project in mind. Someone who visits the site regularly and checks the work catches those deviations while they are still cheap to fix.',
          },
          {
            type: 'p',
            text: 'Interior furniture compartments are the other underrated part: not only where the wardrobe stands, but how it is organised inside. And the five visits to partner stores mean you do not choose finishes alone from a catalogue, but together with the designer, in front of the real material.',
          },
          { type: 'h2', text: 'Exterior design: why there is no listed price' },
          {
            type: 'p',
            text: 'We do not list a fixed price for exterior design, and that is not a way of dodging the question. Exterior projects vary far too much to fit honestly into one rate per square metre: a facade, a courtyard and a fully landscaped relaxation area are jobs of different complexity. We make an individual offer once we see what the project involves.',
          },
          { type: 'h2', text: 'If you do not need a full project' },
          {
            type: 'p',
            text: 'Not every situation needs a complete project. Sometimes you just need a competent answer to two or three questions: which colour works on that wall, how to rearrange a room that does not work, whether it is worth moving a wall. For cases like these there is a design consultation in one of three formats: online by video, at the studio with samples on the table, or on site.',
          },
          {
            type: 'p',
            text: 'It is a much more sensible option than a full project you do not need, and it is often enough.',
          },
          { type: 'h2', text: 'How to choose between the three' },
          {
            type: 'p',
            text: 'The useful question is not “which package is best” but “how much of the way do I want to go on my own”. Basic gives you the direction and the basic documentation. Tehnic gives you the full project, with room for changes. Signature gives you the project plus our presence while the work is actually being done.',
          },
          {
            type: 'p',
            text: 'If you are between two options, keep one thing in mind: the price difference between packages is measured in euros per square metre, while the cost of a construction mistake is measured in work redone. On a typical flat, the step from one package to the next is often smaller than a single job done twice.',
          },
          {
            type: 'note',
            text: 'The prices in this article are those valid on the date of publication. For an exact estimate for your floor area, write to us and we will reply with a concrete figure, not a range.',
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
