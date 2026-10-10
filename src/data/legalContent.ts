import type { Language } from '../i18n/types';

/* Paginile /privacy și /terms: conținut PROVIZORIU, scris doar din fapte care
   există deja pe site sau care se verifică în cod:
   - pachetele și prețurile pe m²: pagina Servicii (src/pages/Servicii.tsx,
     src/i18n/*.ts, `features`), design exterior „ofertă individuală" (FAQ);
   - cursul: pagina /curs (src/pages/CursLanding.tsx, secțiunea „Formatul");
   - date colectate: câmpurile din HomeContactForm/Contact (nume, email,
     telefon, mesaj, pachet/curs ales, poze opționale, bifa de acord);
   - cookie-uri: niciunul; `localStorage` păstrează doar limba aleasă
     (src/i18n/LanguageContext.tsx); fără analytics; fonturile vin de la
     Google Fonts; găzduire Vercel.
   Ce NU se știe încă (denumirea juridică, durata exactă de păstrare, termene și
   condiții de plată/anulare pentru design) NU e inventat: apare în nota de la
   sfârșitul fiecărei pagini. La actualizare, schimbă și `updatedIso`/`updatedLabel`
   și `lastmod` în public/sitemap.xml. */

export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'note'; text: string };

export type LegalPageContent = {
  title: string;
  seoTitle: string;
  seoDescription: string;
  updatedIso: string;
  updatedLabel: string;
  updatedPrefix: string;
  body: LegalBlock[];
};

export type LegalKind = 'privacy' | 'terms';

const PHONE = '+373 62 167 165';
const UPDATED_ISO = '2026-10-10';

/* ───────────────────────── PRIVACY ───────────────────────── */

const PRIVACY_RO: LegalPageContent = {
  title: 'Politica de confidențialitate',
  seoTitle: 'Politica de confidențialitate | NOMA Studio',
  seoDescription:
    'Ce date personale primește NOMA Studio prin formulare, cum le folosește, ce cookie-uri are site-ul și cum îți poți exercita drepturile.',
  updatedIso: UPDATED_ISO,
  updatedLabel: '10 octombrie 2026',
  updatedPrefix: 'Ultima actualizare',
  body: [
    { type: 'p', text: 'Aici explicăm ce date personale primim prin site-ul noma.md, de ce le folosim și ce poți face în legătură cu ele.' },
    { type: 'h2', text: 'Cine suntem' },
    { type: 'p', text: `Site-ul noma.md aparține studioului NOMA Studio Design din Chișinău, Republica Moldova. Ne poți contacta prin pagina de Contact sau la telefon, la ${PHONE}.` },
    { type: 'h2', text: 'Ce date primim' },
    { type: 'p', text: 'Primim doar datele pe care ni le trimiți tu prin formularul de contact:' },
    { type: 'ul', items: ['numele tău', 'adresa de email', 'numărul de telefon', 'mesajul scris de tine', 'pachetul sau cursul ales, dacă ai ales unul', 'pozele pe care le atașezi, dacă atașezi'] },
    { type: 'p', text: 'Dacă ne scrii pe WhatsApp, Viber sau Telegram, aplicația respectivă ne arată numele și numărul tău, iar conversația urmează regulile aplicației.' },
    { type: 'h2', text: 'De ce folosim datele' },
    { type: 'p', text: 'Folosim datele ca să-ți răspundem: pentru o consultație, o ofertă de design sau înscrierea la un curs. Nu le folosim pentru alte scopuri fără acordul tău.' },
    { type: 'h2', text: 'Acordul tău' },
    { type: 'p', text: 'Formularul se trimite doar după ce bifezi acordul cu această politică. Îți poți retrage acordul oricând, scriindu-ne.' },
    { type: 'h2', text: 'Cine primește datele' },
    { type: 'p', text: 'Datele trimise prin formular sunt folosite de echipa NOMA ca să-ți răspundă. Site-ul este găzduit de Vercel, iar pentru livrarea mesajelor folosim servicii de infrastructură ale unor furnizori externi. Nu vindem datele tale.' },
    { type: 'h2', text: 'Cookie-uri și fișiere din browser' },
    { type: 'p', text: 'Site-ul nu folosește cookie-uri și nu are instrumente de analiză sau de publicitate. Browserul tău reține doar limba aleasă, ca s-o găsești la următoarea vizită; informația rămâne în browserul tău.' },
    { type: 'p', text: 'Fonturile paginii se încarcă de la Google Fonts, deci serverele Google primesc adresa ta IP când deschizi site-ul, ca la orice resursă încărcată din exterior. Serverul de găzduire poate păstra și jurnale tehnice (adresa IP, ora, pagina cerută), necesare pentru securitate și funcționare.' },
    { type: 'h2', text: 'Cât păstrăm datele' },
    { type: 'p', text: 'Păstrăm datele cât este necesar ca să-ți răspundem și să ducem colaborarea la capăt.' },
    { type: 'h2', text: 'Drepturile tale' },
    { type: 'p', text: 'Poți cere oricând să afli ce date avem despre tine, să le corectăm sau să le ștergem. Scrie-ne prin pagina de Contact sau sună-ne. Te poți adresa și autorității pentru protecția datelor personale din Republica Moldova.' },
    { type: 'h2', text: 'Modificări' },
    { type: 'p', text: 'Dacă această politică se schimbă, actualizăm pagina și data de la început.' },
    { type: 'note', text: 'Pagina urmează să fie completată cu denumirea juridică a operatorului de date și cu durata exactă de păstrare a datelor.' },
  ],
};

const PRIVACY_RU: LegalPageContent = {
  title: 'Политика конфиденциальности',
  seoTitle: 'Политика конфиденциальности | NOMA Studio',
  seoDescription:
    'Какие персональные данные получает NOMA Studio через формы, как их использует, какие файлы cookie есть на сайте и как реализовать свои права.',
  updatedIso: UPDATED_ISO,
  updatedLabel: '10 октября 2026',
  updatedPrefix: 'Последнее обновление',
  body: [
    { type: 'p', text: 'Здесь мы объясняем, какие персональные данные получаем через сайт noma.md, зачем их используем и что вы можете с ними делать.' },
    { type: 'h2', text: 'Кто мы' },
    { type: 'p', text: `Сайт noma.md принадлежит студии NOMA Studio Design из Кишинёва, Республика Молдова. Связаться с нами можно через страницу «Контакт» или по телефону ${PHONE}.` },
    { type: 'h2', text: 'Какие данные мы получаем' },
    { type: 'p', text: 'Мы получаем только те данные, которые вы сами отправляете через форму обратной связи:' },
    { type: 'ul', items: ['ваше имя', 'адрес электронной почты', 'номер телефона', 'ваше сообщение', 'выбранный пакет или курс, если вы его выбрали', 'фотографии, если вы их прикрепили'] },
    { type: 'p', text: 'Если вы пишете нам в WhatsApp, Viber или Telegram, соответствующее приложение показывает нам ваше имя и номер, а переписка подчиняется правилам этого приложения.' },
    { type: 'h2', text: 'Зачем мы используем данные' },
    { type: 'p', text: 'Мы используем данные, чтобы ответить вам: для консультации, предложения по дизайну или записи на курс. Мы не используем их для других целей без вашего согласия.' },
    { type: 'h2', text: 'Ваше согласие' },
    { type: 'p', text: 'Форма отправляется только после того, как вы отметите согласие с этой политикой. Вы можете отозвать согласие в любой момент, написав нам.' },
    { type: 'h2', text: 'Кто получает данные' },
    { type: 'p', text: 'Данные, отправленные через форму, использует команда NOMA, чтобы ответить вам. Сайт размещён на Vercel, а для доставки сообщений мы пользуемся инфраструктурными сервисами внешних поставщиков. Мы не продаём ваши данные.' },
    { type: 'h2', text: 'Файлы cookie и данные в браузере' },
    { type: 'p', text: 'Сайт не использует файлы cookie и не имеет инструментов аналитики или рекламы. Браузер запоминает только выбранный язык, чтобы вы нашли его при следующем визите; эта информация остаётся в вашем браузере.' },
    { type: 'p', text: 'Шрифты страницы загружаются с Google Fonts, поэтому серверы Google получают ваш IP-адрес при открытии сайта, как и при любом ресурсе, загружаемом извне. Сервер хостинга также может хранить технические журналы (IP-адрес, время, запрошенная страница), необходимые для безопасности и работы сайта.' },
    { type: 'h2', text: 'Как долго мы храним данные' },
    { type: 'p', text: 'Мы храним данные столько, сколько нужно, чтобы ответить вам и довести сотрудничество до конца.' },
    { type: 'h2', text: 'Ваши права' },
    { type: 'p', text: 'Вы можете в любой момент узнать, какие данные о вас у нас есть, попросить исправить или удалить их. Напишите нам через страницу «Контакт» или позвоните. Вы также можете обратиться в орган по защите персональных данных Республики Молдова.' },
    { type: 'h2', text: 'Изменения' },
    { type: 'p', text: 'Если эта политика изменится, мы обновим страницу и дату в начале.' },
    { type: 'note', text: 'Страница будет дополнена юридическим наименованием оператора данных и точным сроком хранения данных.' },
  ],
};

const PRIVACY_EN: LegalPageContent = {
  title: 'Privacy policy',
  seoTitle: 'Privacy policy | NOMA Studio',
  seoDescription:
    'What personal data NOMA Studio receives through its forms, how it is used, which cookies the site has and how you can exercise your rights.',
  updatedIso: UPDATED_ISO,
  updatedLabel: 'October 10, 2026',
  updatedPrefix: 'Last updated',
  body: [
    { type: 'p', text: 'This page explains what personal data we receive through noma.md, why we use it and what you can do about it.' },
    { type: 'h2', text: 'Who we are' },
    { type: 'p', text: `The noma.md website belongs to the studio NOMA Studio Design in Chisinau, Republic of Moldova. You can reach us through the Contact page or by phone at ${PHONE}.` },
    { type: 'h2', text: 'What data we receive' },
    { type: 'p', text: 'We only receive the data you send us yourself through the contact form:' },
    { type: 'ul', items: ['your name', 'your email address', 'your phone number', 'your message', 'the package or course you chose, if you chose one', 'photos you attach, if you attach any'] },
    { type: 'p', text: "If you write to us on WhatsApp, Viber or Telegram, that app shows us your name and number, and the conversation follows the app's own rules." },
    { type: 'h2', text: 'Why we use the data' },
    { type: 'p', text: 'We use the data to reply to you: for a consultation, a design offer or a course enrollment. We do not use it for other purposes without your consent.' },
    { type: 'h2', text: 'Your consent' },
    { type: 'p', text: 'The form can only be sent after you tick the consent to this policy. You can withdraw your consent at any time by writing to us.' },
    { type: 'h2', text: 'Who receives the data' },
    { type: 'p', text: 'Data sent through the form is used by the NOMA team to reply to you. The site is hosted on Vercel, and we use infrastructure services from external providers to deliver messages. We do not sell your data.' },
    { type: 'h2', text: 'Cookies and browser storage' },
    { type: 'p', text: 'The site does not use cookies and has no analytics or advertising tools. Your browser only remembers the language you chose, so you find it on your next visit; that information stays in your browser.' },
    { type: 'p', text: 'The page fonts are loaded from Google Fonts, so Google servers receive your IP address when you open the site, as with any resource loaded from outside. The hosting server may also keep technical logs (IP address, time, requested page) needed for security and operation.' },
    { type: 'h2', text: 'How long we keep the data' },
    { type: 'p', text: 'We keep the data for as long as needed to reply to you and see the collaboration through.' },
    { type: 'h2', text: 'Your rights' },
    { type: 'p', text: 'You can ask at any time what data we hold about you, and ask us to correct or delete it. Write to us through the Contact page or call us. You can also contact the personal data protection authority of the Republic of Moldova.' },
    { type: 'h2', text: 'Changes' },
    { type: 'p', text: 'If this policy changes, we update the page and the date at the top.' },
    { type: 'note', text: 'This page will be completed with the legal name of the data controller and the exact data retention period.' },
  ],
};

/* ───────────────────────── TERMS ───────────────────────── */

const TERMS_RO: LegalPageContent = {
  title: 'Termeni și condiții',
  seoTitle: 'Termeni și condiții | NOMA Studio',
  seoDescription:
    'Condițiile ofertelor NOMA Studio: pachetele de design interior cu prețurile pe metru pătrat, consultațiile și cursul avansat de design interior.',
  updatedIso: UPDATED_ISO,
  updatedLabel: '10 octombrie 2026',
  updatedPrefix: 'Ultima actualizare',
  body: [
    { type: 'p', text: 'Aici găsești pe scurt condițiile din ofertele publicate pe site: pachetele de design interior, consultațiile și cursul. Informațiile sunt cele afișate pe pagina Servicii și pe pagina cursului.' },
    { type: 'h2', text: 'Folosirea site-ului' },
    { type: 'p', text: 'Textele, fotografiile și randările de pe acest site prezintă proiectele NOMA Studio. Dacă vrei să le folosești în altă parte, scrie-ne mai întâi.' },
    { type: 'h2', text: 'Design interior: pachete și prețuri' },
    { type: 'p', text: 'Prețurile sunt în euro, pe metru pătrat (€/m²). Pachetele diferă prin nivelul de detaliu tehnic și de supraveghere.' },
    { type: 'p', text: 'Pachetul NOMA Basic, 17 €/m²:' },
    { type: 'ul', items: ['o vizită inițială pe șantier', 'plan releveu', 'un plan de amplasare a mobilierului', 'plan final de compartimentare', 'o variantă de randări 3D, fără modificări ulterioare'] },
    { type: 'p', text: 'Pachetul NOMA Tehnic, 28 €/m²:' },
    { type: 'ul', items: ['album tehnic', '2 variante de amplasare a mobilierului', 'randări 3D cu câte o modificare pe cameră', 'consultanță post-proiect'] },
    { type: 'p', text: 'Pachetul NOMA Signature, 37 €/m²:' },
    { type: 'ul', items: ['compartimentări interioare ale mobilierului', 'supraveghere pe șantier', 'consultanță post-proiect', '5 vizite în magazine partenere (pardoseală, corpuri de iluminat, mobilier la comandă, tare și moale, obiecte sanitare)'] },
    { type: 'p', text: 'Pentru design exterior nu avem un preț afișat: oferta se stabilește individual, în funcție de proiect.' },
    { type: 'p', text: 'Pentru o ofertă, folosește butonul „Solicită ofertă” de pe pagina Servicii sau scrie-ne prin pagina de Contact.' },
    { type: 'h2', text: 'Consultații de design' },
    { type: 'p', text: 'Consultațiile se pot face online, prin apel video, fizic la birou sau direct pe șantier, după cum ți se potrivește. Pentru programare, scrie-ne prin pagina de Contact.' },
    { type: 'h2', text: 'Cursul avansat de design interior' },
    { type: 'p', text: 'Informațiile sunt cele afișate pe pagina cursului, pentru seria care începe pe 1 februarie 2027:' },
    { type: 'ul', items: ['Durată: 4 luni, de la 1 februarie 2027 până la 11 iunie 2027', 'Lecții live: luni și vineri, între 17:30 și 19:30', 'Preț: 1500 €, care se poate plăti în 2 sau mai multe tranșe', 'Rezervare: avans de 200 €, inclus în preț, nu o sumă adițională', 'Locurile sunt limitate'] },
    { type: 'p', text: 'Cum te înscrii: discutăm detaliile cursului și plata, achiți avansul de 200 € și ești înregistrat automat la curs, apoi semnăm contractul.' },
    { type: 'p', text: 'La fiecare lecție primești pe Telegram linkul de conectare la lecția live de pe Zoom, iar înregistrarea ți-o trimitem imediat ce se termină lecția. Materialele cursului sunt organizate în grupul de Telegram al cursului.' },
    { type: 'p', text: 'La ultima întâlnire primești certificatul de absolvire, cu feedback individual.' },
    { type: 'h2', text: 'Contact' },
    { type: 'p', text: `Pentru întrebări despre aceste condiții, scrie-ne prin pagina de Contact sau sună la ${PHONE}.` },
    { type: 'note', text: 'Pagina urmează să fie completată cu termenele de realizare, condițiile de plată și de anulare pentru serviciile de design.' },
  ],
};

const TERMS_RU: LegalPageContent = {
  title: 'Условия использования',
  seoTitle: 'Условия использования | NOMA Studio',
  seoDescription:
    'Условия предложений NOMA Studio: пакеты дизайна интерьера с ценами за квадратный метр, консультации и продвинутый курс дизайна интерьера.',
  updatedIso: UPDATED_ISO,
  updatedLabel: '10 октября 2026',
  updatedPrefix: 'Последнее обновление',
  body: [
    { type: 'p', text: 'Здесь кратко изложены условия из предложений, опубликованных на сайте: пакеты дизайна интерьера, консультации и курс. Информация соответствует данным на странице «Услуги» и на странице курса.' },
    { type: 'h2', text: 'Использование сайта' },
    { type: 'p', text: 'Тексты, фотографии и визуализации на этом сайте представляют проекты NOMA Studio. Если вы хотите использовать их где-то ещё, сначала напишите нам.' },
    { type: 'h2', text: 'Дизайн интерьера: пакеты и цены' },
    { type: 'p', text: 'Цены указаны в евро за квадратный метр (€/м²). Пакеты различаются уровнем технической детализации и надзора.' },
    { type: 'p', text: 'Пакет NOMA Basic, 17 €/м²:' },
    { type: 'ul', items: ['Первичный выезд на объект', 'План обмеров', 'Один план расстановки мебели', 'Финальный план перегородок', '3D визуализации — один вариант без изменений'] },
    { type: 'p', text: 'Пакет NOMA Tehnic, 28 €/м²:' },
    { type: 'ul', items: ['Технический альбом', '2 варианта расстановки мебели', '3D визуализации с одной правкой на комнату', 'Консультация после проекта'] },
    { type: 'p', text: 'Пакет NOMA Signature, 37 €/м²:' },
    { type: 'ul', items: ['Внутренние отделения мебели', 'Авторский надзор', 'Консультация после проекта', '5 визитов в партнёрские магазины (напольное покрытие, освещение, корпусная и мягкая мебель, сантехника)'] },
    { type: 'p', text: 'Для дизайна экстерьера цена не указана: предложение определяется индивидуально, в зависимости от проекта.' },
    { type: 'p', text: 'Чтобы получить предложение, нажмите кнопку «Запросить предложение» на странице «Услуги» или напишите нам через страницу «Контакт».' },
    { type: 'h2', text: 'Консультации по дизайну' },
    { type: 'p', text: 'Консультации проходят онлайн по видеосвязи, лично в офисе или прямо на объекте, как вам удобнее. Чтобы записаться, напишите нам через страницу «Контакт».' },
    { type: 'h2', text: 'Продвинутый курс дизайна интерьера' },
    { type: 'p', text: 'Информация соответствует данным на странице курса, для потока, который начинается 1 февраля 2027 года:' },
    { type: 'ul', items: ['Длительность: 4 месяца, с 1 февраля 2027 года по 11 июня 2027 года', 'Живые занятия: по понедельникам и пятницам, с 17:30 до 19:30', 'Стоимость: 1500 €, можно оплатить в 2 или более платежа', 'Бронирование: аванс 200 €, входит в стоимость, а не является дополнительной суммой', 'Количество мест ограничено'] },
    { type: 'p', text: 'Как записаться: мы обсуждаем детали курса и оплату, вы вносите аванс 200 € и автоматически регистрируетесь на курс, затем мы подписываем договор.' },
    { type: 'p', text: 'На каждое занятие вы получаете в Telegram ссылку для подключения к живому уроку в Zoom, а запись урока мы присылаем сразу после его окончания. Материалы курса собраны в Telegram-группе курса.' },
    { type: 'p', text: 'На последней встрече вы получаете сертификат об окончании с индивидуальной обратной связью.' },
    { type: 'h2', text: 'Контакты' },
    { type: 'p', text: `По вопросам об этих условиях напишите нам через страницу «Контакт» или позвоните по телефону ${PHONE}.` },
    { type: 'note', text: 'Страница будет дополнена сроками выполнения, условиями оплаты и отмены для услуг дизайна.' },
  ],
};

const TERMS_EN: LegalPageContent = {
  title: 'Terms and conditions',
  seoTitle: 'Terms and conditions | NOMA Studio',
  seoDescription:
    'The terms of NOMA Studio offers: interior design packages with prices per square meter, consultations and the advanced interior design course.',
  updatedIso: UPDATED_ISO,
  updatedLabel: 'October 10, 2026',
  updatedPrefix: 'Last updated',
  body: [
    { type: 'p', text: 'Here is a short summary of the terms in the offers published on the site: the interior design packages, consultations and the course. The information is the one shown on the Services page and on the course page.' },
    { type: 'h2', text: 'Using the site' },
    { type: 'p', text: 'The texts, photos and renders on this site present NOMA Studio projects. If you want to use them elsewhere, please write to us first.' },
    { type: 'h2', text: 'Interior design: packages and prices' },
    { type: 'p', text: 'Prices are in euro, per square meter (€/m²). The packages differ in the level of technical detail and supervision.' },
    { type: 'p', text: 'NOMA Basic package, €17/m²:' },
    { type: 'ul', items: ['Initial site visit', 'Survey plan', 'One furniture layout plan', 'Final partition plan', '3D renders — one version without modifications'] },
    { type: 'p', text: 'NOMA Tehnic package, €28/m²:' },
    { type: 'ul', items: ['Technical album', '2 furniture layout variants', '3D renders with one revision per room', 'Post-project consultancy'] },
    { type: 'p', text: 'NOMA Signature package, €37/m²:' },
    { type: 'ul', items: ['Interior furniture compartments', 'Site supervision', 'Post-project consultancy', '5 visits to partner stores (flooring, lighting fixtures, custom hard and soft furniture, sanitary fixtures)'] },
    { type: 'p', text: 'We do not show a price for exterior design: the offer is set individually, depending on the project.' },
    { type: 'p', text: 'To get an offer, use the “Request a quote” button on the Services page or write to us through the Contact page.' },
    { type: 'h2', text: 'Design consultations' },
    { type: 'p', text: 'Consultations can take place online by video call, in person at the office or directly on site, whichever suits you. To book one, write to us through the Contact page.' },
    { type: 'h2', text: 'Advanced interior design course' },
    { type: 'p', text: 'The information is the one shown on the course page, for the group starting on February 1, 2027:' },
    { type: 'ul', items: ['Duration: 4 months, from February 1, 2027 to June 11, 2027', 'Live lessons: Mondays and Fridays, 17:30–19:30', 'Price: €1500, payable in 2 or more installments', 'Booking: a €200 advance, included in the price, not an extra sum', 'Places are limited'] },
    { type: 'p', text: 'How to enroll: we discuss the course details and payment, you pay the €200 advance and are registered for the course automatically, then we sign the contract.' },
    { type: 'p', text: 'Before each lesson you receive on Telegram the link to join the live lesson on Zoom, and we send you the recording as soon as the lesson ends. The course materials are organized in the course Telegram group.' },
    { type: 'p', text: 'At the last meeting you receive the graduation certificate, with individual feedback.' },
    { type: 'h2', text: 'Contact' },
    { type: 'p', text: `For questions about these terms, write to us through the Contact page or call ${PHONE}.` },
    { type: 'note', text: 'This page will be completed with delivery times, payment terms and cancellation terms for the design services.' },
  ],
};

export const LEGAL_CONTENT: Record<LegalKind, Record<Language, LegalPageContent>> = {
  privacy: { ro: PRIVACY_RO, ru: PRIVACY_RU, en: PRIVACY_EN },
  terms: { ro: TERMS_RO, ru: TERMS_RU, en: TERMS_EN },
};
