/* Textele paginii 404, într-un singur loc, fără React: le folosesc și pagina
   React (NotFound.tsx, pentru navigările din interiorul aplicației) și pagina
   statică 404.html generată la build (scripts/notFoundPage.ts), ca cele două
   să nu se desincronizeze.

   Titlul pornește de la ideea studioului („camera” pe care o cauți). Explicația
   clară vine imediat dedesubt, iar <title>-ul rămâne literal („Pagina nu a fost
   găsită”), ca tab-ul browserului și istoricul să spună exact ce s-a întâmplat. */
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
    title: 'Camera asta nu există.',
    text: 'Pagina pe care o cauți a fost mutată sau adresa are o greșeală.',
    cta: 'Scrie-ne',
    home: 'Acasă',
    services: 'Servicii',
    portfolio: 'Portofoliu',
    contact: 'Contact',
    viewProject: 'Vezi proiectul',
  },
  ru: {
    pageTitle: 'Страница не найдена',
    title: 'Такой комнаты у нас нет.',
    text: 'Страница, которую вы ищете, была перемещена, либо в адресе допущена ошибка.',
    cta: 'Написать нам',
    home: 'Главная',
    services: 'Услуги',
    portfolio: 'Портфолио',
    contact: 'Контакт',
    viewProject: 'Смотреть проект',
  },
  en: {
    pageTitle: 'Page not found',
    title: "This room doesn't exist.",
    text: 'The page you are looking for has moved, or the address has a typo.',
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
