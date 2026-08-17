import type { Language } from './types';

/* Traducerile etichetelor de mobilier de pe planul tehnic SVG (planTehnicPaths.ts).
   Cheia e textul RO exact (așa cum apare în array-ul PLAN_LABELS) — fișierul acela
   e prea mare (~400KB, un singur array pe o linie) ca să fie editat direct, așa că
   traducerea se face la randare, în ProjectInquirySketch.tsx, printr-un lookup pe
   acest dicționar. Numerele camerelor ("1"-"6") și etichetele universale ("WC", "TV")
   nu au nevoie de intrare — rămân neschimbate în orice limbă. */
export const PLAN_LABEL_TRANSLATIONS: Record<string, Partial<Record<Language, string>>> = {
  'Frigider': { ru: 'Холодильник', en: 'Fridge' },
  'Chiuvetă': { ru: 'Мойка', en: 'Sink' },
  'Blat': { ru: 'Столешница', en: 'Countertop' },
  'Cazan': { ru: 'Бойлер', en: 'Boiler' },
  'Cuptor': { ru: 'Духовка', en: 'Oven' },
  'Mașină de': { ru: 'Машина для', en: 'Machine for' },
  'spălat vase': { ru: 'мытья посуды', en: 'washing dishes' },
  'Plită cu': { ru: 'Плита с', en: 'Cooktop with' },
  'inducție': { ru: 'индукцией', en: 'induction' },
  'Măsuță chei+': { ru: 'Столик для ключей+', en: 'Key table +' },
  'oglindă': { ru: 'зеркало', en: 'mirror' },
  'Dulap': { ru: 'Шкаф', en: 'Wardrobe' },
  'Șezut': { ru: 'Сидение', en: 'Seat' },
  'Duș': { ru: 'Душ', en: 'Shower' },
  'spălat/uscat': { ru: 'стирки/сушки', en: 'washing/drying' },
  'Construcție WC': { ru: 'Конструкция WC', en: 'WC structure' },
  'Construcție': { ru: 'Конструкция', en: 'Structure for' },
  'duș încorporat': { ru: 'встроенный душ', en: 'built-in shower' },
  'Lavoar': { ru: 'Раковина', en: 'Washbasin' },
  'Pat': { ru: 'Кровать', en: 'Bed' },
  'Birou': { ru: 'Письменный стол', en: 'Desk' },
  'Puf': { ru: 'Пуф', en: 'Pouf' },
  'Măsuță suspendată': { ru: 'Подвесной столик', en: 'Wall-mounted table' },
  'Noptieră': { ru: 'Тумбочка', en: 'Nightstand' },
  'Măsuță de machiaj': { ru: 'Туалетный столик', en: 'Vanity table' },
  'Canapea extensibilă': { ru: 'Раскладной диван', en: 'Sofa bed' },
  'Măsuță de cafea': { ru: 'Журнальный столик', en: 'Coffee table' },
  'Rafturi cu orientare': { ru: 'Полки, ориентированные', en: 'Shelves facing' },
  'spre lavoar': { ru: 'к раковине', en: 'the washbasin' },
  'cafea': { ru: 'кофе', en: 'coffee' },
  'Ușă cu deschidere': { ru: 'Дверь с открыванием', en: 'Door opening' },
  'în exterior': { ru: 'наружу', en: 'outward' },
  'Masa': { ru: 'Стол', en: 'Table' },
  'Uscător': { ru: 'Сушильная машина', en: 'Dryer' },
};

export function translatePlanLabel(text: string, language: Language): string {
  if (language === 'ro') return text;
  return PLAN_LABEL_TRANSLATIONS[text]?.[language] ?? text;
}
