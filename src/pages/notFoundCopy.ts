/* Textele paginii 404, într-un singur loc, fără React: le folosesc și pagina
   React (NotFound.tsx, pentru navigările din interiorul aplicației) și pagina
   statică 404.html generată la build (scripts/notFoundPage.ts), ca cele două
   să nu se desincronizeze.

   Titlul spune direct ce s-a întâmplat (cineva a greșit adresa sau pagina a fost
   mutată), fără metaforă: „camera care nu există” nu se potrivea cu un link greșit.
   <title>-ul rămâne literal („Pagina nu a fost găsită”), ca tab-ul browserului
   și istoricul să spună exact ce s-a întâmplat. */
export type NotFoundLang = 'ro' | 'ru' | 'en';

export interface NotFoundCopy {
  pageTitle: string;
  title: string;
  text: string;
  cta: string;
  home: string;
  services: string;
  portfolio: string;
  contact: string;
  viewProject: string;
}

export const NOT_FOUND_COPY: Record<NotFoundLang, NotFoundCopy> = {
  ro: {
    pageTitle: 'Pagina nu a fost găsită',
    title: 'Nu am găsit pagina asta.',
    text: 'Adresa poate avea o greșeală sau pagina a fost mutată. Alege mai jos unde vrei să ajungi.',
    cta: 'Scrie-ne',
    home: 'Acasă',
    services: 'Servicii',
    portfolio: 'Portofoliu',
    contact: 'Contact',
    viewProject: 'Vezi proiectul',
  },
  ru: {
    pageTitle: 'Страница не найдена',
    title: 'Мы не нашли эту страницу.',
    text: 'В адресе может быть ошибка, либо страница была перемещена. Выберите ниже, куда хотите перейти.',
    cta: 'Написать нам',
    home: 'Главная',
    services: 'Услуги',
    portfolio: 'Портфолио',
    contact: 'Контакт',
    viewProject: 'Смотреть проект',
  },
  en: {
    pageTitle: 'Page not found',
    title: "We couldn't find that page.",
    text: "The address may have a typo, or the page has moved. Choose below where you'd like to go.",
    cta: 'Get in touch',
    home: 'Home',
    services: 'Services',
    portfolio: 'Portfolio',
    contact: 'Contact',
    viewProject: 'View project',
  },
};

/* sizes pentru poză: o coloană (lățime ecran minus padding) sub 900px, jumătate
   din containerul de 1040px peste (aproximat cu 488px) */
export const NOT_FOUND_PHOTO_SIZES = '(max-width: 899px) calc(100vw - 48px), 488px';
