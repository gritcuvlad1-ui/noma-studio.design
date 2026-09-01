import type { ChecklistSection } from './types';

export const part1: ChecklistSection[] = [
  {
    id: 'pardoseala',
    part: 1,
    num: '01',
    title: { ro: 'Pardoseală', ru: 'Напольное покрытие' },
    fields: [
      {
        id: 'pardoseala_finisaj',
        kind: 'single',
        label: { ro: 'Finisaj principal dorit', ru: 'Желаемое основное покрытие' },
        options: [
          { id: 'parchet_stratificat', label: { ro: 'Parchet stratificat', ru: 'Инженерная доска (паркет)' }, invest: 'high' },
          { id: 'laminat', label: { ro: 'Laminat', ru: 'Ламинат' }, invest: 'low' },
          { id: 'spc', label: { ro: 'SPC', ru: 'SPC-плитка (кварц-винил)' }, invest: 'mid', rec: true },
          { id: 'gresie', label: { ro: 'Gresie', ru: 'Керамогранит' }, invest: 'mid_high', rec: true },
        ],
      },
      {
        id: 'pardoseala_incaperi',
        kind: 'text',
        label: { ro: 'Care și în ce încăpere va fi?', ru: 'Какое покрытие и в каком помещении?' },
        placeholder: { ro: 'Ex: SPC în dormitoare, hol și bucătărie; gresie în băi.', ru: 'Напр.: SPC в спальнях, прихожей и кухне; керамогранит в санузлах.' },
        rows: 2,
      },
      {
        id: 'pardoseala_montaj',
        kind: 'single',
        label: { ro: 'Montaj pentru parchet, SPC sau laminat', ru: 'Укладка для паркета, SPC или ламината' },
        options: [
          { id: 'drept', label: { ro: 'Drept', ru: 'Прямая укладка' }, invest: 'low' },
          { id: 'diagonal', label: { ro: 'Diagonal', ru: 'По диагонали' }, invest: 'mid' },
          { id: 'herringbone', label: { ro: 'Herringbone / brăduț', ru: 'Ёлочка (herringbone)' }, invest: 'high' },
          { id: 'chevron', label: { ro: 'Chevron', ru: 'Шеврон' }, invest: 'high' },
        ],
      },
      {
        id: 'pardoseala_plinte',
        kind: 'single',
        label: { ro: 'Plinte', ru: 'Плинтус' },
        options: [
          { id: 'plinta_duropolimer', label: { ro: 'Plintă aplicată din duropolimer', ru: 'Накладной плинтус из дуропластика' }, invest: 'low_mid' },
          { id: 'plinta_ascunsa', label: { ro: 'Plintă ascunsă', ru: 'Скрытый плинтус' }, invest: 'high' },
        ],
      },
    ],
  },
  {
    id: 'pereti',
    part: 1,
    num: '02',
    title: { ro: 'Pereți', ru: 'Стены' },
    fields: [
      {
        id: 'pereti_finisaj',
        kind: 'single',
        label: { ro: 'Finisaje dorite', ru: 'Желаемая отделка' },
        note: {
          ro: 'Vopseaua lavabilă poate urca la un nivel înalt de investiție atunci când optăm pentru produse de calitate superioară, ceea ce și recomandăm.',
          ru: 'Стоимость водоэмульсионной краски может доходить до высокого уровня при выборе продуктов более высокого качества — именно это мы и рекомендуем.',
        },
        important: {
          ro: 'Atunci când alegem un finisaj principal, recomandăm să păstrăm aceeași direcție în întregul interior.',
          ru: 'При выборе основной отделки рекомендуем сохранить одно направление по всему интерьеру.',
        },
        options: [
          { id: 'vopsea_lavabila', label: { ro: 'Vopsea lavabilă', ru: 'Водоэмульсионная краска' }, invest: 'low_mid', rec: true },
          { id: 'vopsea_decorativa', label: { ro: 'Vopsea decorativă', ru: 'Декоративная краска' }, invest: 'mid_high' },
          { id: 'microciment', label: { ro: 'Microciment', ru: 'Микроцемент' }, invest: 'high' },
        ],
      },
      {
        id: 'pereti_decor',
        kind: 'single',
        label: { ro: 'Decor pe pereți', ru: 'Декор на стенах' },
        note: {
          ro: 'Este suficient să indicați ce tipuri de elemente decorative v-ar plăcea să existe în interior — poziționarea rămâne în competența designerului. Dacă aveți o dorință specifică (ex. piatră decorativă pe peretele TV), menționați-o mai jos.',
          ru: 'Достаточно указать, какие декоративные элементы вам нравятся — расположение определит дизайнер. Если есть конкретное пожелание (напр. декоративный камень на стене под ТВ), укажите его ниже.',
        },
        options: [
          { id: 'riflaje_duropolimer', label: { ro: 'Riflaje din duropolimer', ru: 'Рейки из дуропластика' }, invest: 'low_mid', rec: true },
          { id: 'riflaje_mdf', label: { ro: 'Riflaje din MDF', ru: 'Рейки из МДФ' }, invest: 'high', rec: true, recNote: { ro: 'pentru interioarele premium', ru: 'для премиальных интерьеров' } },
          { id: 'moldinguri_duropolimer', label: { ro: 'Moldinguri din duropolimer', ru: 'Молдинги из дуропластика' }, invest: 'low_mid', rec: true },
          { id: 'panouri_pal', label: { ro: 'Panouri decorative din PAL', ru: 'Декоративные панели из ЛДСП' }, invest: 'high', rec: true, recNote: { ro: 'pentru interioarele premium', ru: 'для премиальных интерьеров' } },
          { id: 'panouri_furnir', label: { ro: 'Panouri decorative din furnir', ru: 'Декоративные панели из шпона' }, invest: 'high', rec: true, recNote: { ro: 'pentru interioarele premium', ru: 'для премиальных интерьеров' } },
          { id: 'piatra_decorativa', label: { ro: 'Piatră decorativă', ru: 'Декоративный камень' }, invest: 'mid_high' },
          { id: 'gresie_format_mare', label: { ro: 'Gresie de format mare', ru: 'Крупноформатный керамогранит' }, invest: 'high' },
        ],
      },
      {
        id: 'pereti_dorinte',
        kind: 'text',
        label: { ro: 'Dorințe specifice privind decorul pereților', ru: 'Конкретные пожелания по декору стен' },
        placeholder: {
          ro: 'Ex: piatră decorativă pe peretele din spatele televizorului.',
          ru: 'Напр.: декоративный камень на стене за телевизором.',
        },
        rows: 2,
      },
    ],
  },
  {
    id: 'tavan',
    part: 1,
    num: '03',
    title: { ro: 'Tavan', ru: 'Потолок' },
    fields: [
      {
        id: 'tavan_optiuni',
        kind: 'single',
        options: [
          { id: 'gips_carton', label: { ro: 'Tavan din gips-carton', ru: 'Потолок из гипсокартона' }, invest: 'mid', rec: true },
          { id: 'scafe', label: { ro: 'Scafe', ru: 'Скрытый карниз (скафа)' }, invest: 'mid_high' },
          { id: 'nise_perdele', label: { ro: 'Nișe pentru perdele', ru: 'Ниши для штор' }, invest: 'mid', rec: true },
          { id: 'profil_umbrit', label: { ro: 'Profil umbrit', ru: 'Теневой профиль' }, invest: 'high', rec: true, recNote: { ro: 'pentru un finisaj premium', ru: 'для премиальной отделки' } },
        ],
      },
    ],
  },
  {
    id: 'usi',
    part: 1,
    num: '04',
    title: { ro: 'Uși interioare', ru: 'Межкомнатные двери' },
    fields: [
      {
        id: 'usi_tip',
        kind: 'single',
        note: {
          ro: 'Ușile de calitate, atât clasice cât și ascunse, pot ridica semnificativ bugetul. Recomandăm atât ușile clasice, cât și cele ascunse. Ușile din sticlă se folosesc în încăperi specifice, iar cele glisante, de regulă, doar la necesitate.',
          ru: 'Качественные двери, как классические, так и скрытые, могут заметно повысить бюджет. Рекомендуем и классические, и скрытые двери. Стеклянные — для отдельных помещений, раздвижные — как правило, только при необходимости.',
        },
        options: [
          { id: 'usi_clasice', label: { ro: 'Uși clasice', ru: 'Классические двери' }, invest: 'mid_high', rec: true },
          { id: 'usi_filomuro', label: { ro: 'Uși filomuro / ascunse', ru: 'Скрытые двери (filomuro)' }, invest: 'high', rec: true },
          { id: 'usi_pana_tavan', label: { ro: 'Uși până în tavan', ru: 'Двери от пола до потолка' }, invest: 'high' },
          { id: 'usi_glisante', label: { ro: 'Uși glisante', ru: 'Раздвижные двери' }, invest: 'mid_high', hint: { ro: 'doar la necesitate funcțională', ru: 'только при функциональной необходимости' } },
          { id: 'usi_sticla', label: { ro: 'Uși din sticlă', ru: 'Стеклянные двери' }, invest: 'high', hint: { ro: 'pentru anumite încăperi specifice', ru: 'для отдельных помещений' } },
        ],
      },
      {
        id: 'usi_aspect',
        kind: 'single',
        label: { ro: 'Aspect', ru: 'Внешний вид' },
        options: [
          { id: 'albe', label: { ro: 'Albe', ru: 'Белые' } },
          { id: 'culoarea_peretilor', label: { ro: 'În culoarea pereților', ru: 'В цвет стен' } },
          { id: 'finisaj_lemn', label: { ro: 'Finisaj lemn', ru: 'Под дерево' } },
          { id: 'inchise_culoare', label: { ro: 'Închise la culoare', ru: 'Тёмных оттенков' } },
        ],
      },
    ],
  },
  {
    id: 'iluminat',
    part: 1,
    num: '05',
    title: { ro: 'Iluminat', ru: 'Освещение' },
    fields: [
      {
        id: 'iluminat_tip',
        kind: 'single',
        label: { ro: 'Tip de corpuri de iluminat', ru: 'Тип осветительных приборов' },
        note: {
          ro: 'Oricare dintre soluțiile de mai sus poate arăta foarte bine. În funcție de buget și de scopul renovării, adaptăm iluminatul.',
          ru: 'Любое из решений выше может смотреться отлично. Освещение адаптируем в зависимости от бюджета и цели ремонта.',
        },
        options: [
          { id: 'spoturi_incastrate', label: { ro: 'Spoturi încastrate la nivel cu tavanul', ru: 'Встроенные светильники вровень с потолком' }, invest: 'mid', rec: true },
          { id: 'spoturi_aplicate', label: { ro: 'Spoturi aplicate', ru: 'Накладные светильники' }, invest: 'low_mid' },
          { id: 'sina_magnetica', label: { ro: 'Șină magnetică', ru: 'Магнитный шинопровод' }, invest: 'mid_high' },
          { id: 'lustre', label: { ro: 'Lustre decorative', ru: 'Декоративные люстры' }, invest: 'varies', rec: true },
          { id: 'pendule', label: { ro: 'Pendule', ru: 'Подвесные светильники' }, invest: 'varies' },
          { id: 'aplice', label: { ro: 'Aplice', ru: 'Настенные бра' }, invest: 'varies', rec: true },
          { id: 'led_mobilier', label: { ro: 'LED în mobilier', ru: 'LED-подсветка в мебели' }, invest: 'mid' },
          { id: 'led_decorativ', label: { ro: 'Iluminat decorativ cu LED', ru: 'Декоративная LED-подсветка' }, invest: 'mid_high', rec: true },
        ],
      },
      {
        id: 'iluminat_exclus',
        kind: 'text',
        label: { ro: 'Nu doresc să utilizăm', ru: 'Не хочу использовать' },
        placeholder: {
          ro: 'Ex: fără lustre mari și fără lumină rece.',
          ru: 'Напр.: без больших люстр и без холодного света.',
        },
        rows: 2,
      },
      {
        id: 'iluminat_temperatura',
        kind: 'single',
        label: { ro: 'Temperatura luminii preferată', ru: 'Предпочтительная цветовая температура' },
        options: [
          { id: 'calda_2700', label: { ro: 'Caldă — 2700K', ru: 'Тёплая — 2700K' }, rec: true, recNote: { ro: 'pentru iluminatul de atmosferă', ru: 'для атмосферного освещения' } },
          { id: 'cald_neutra_3000', label: { ro: 'Cald-neutră — 3000K', ru: 'Тёпло-нейтральная — 3000K' }, rec: true, recNote: { ro: 'pentru iluminatul general', ru: 'для общего освещения' } },
          { id: 'neutra_4000', label: { ro: 'Neutră — 4000K', ru: 'Нейтральная — 4000K' } },
        ],
      },
      {
        id: 'iluminat_control',
        kind: 'single',
        label: { ro: 'Control iluminat', ru: 'Управление освещением' },
        options: [
          { id: 'intrerupatoare_clasice', label: { ro: 'Întrerupătoare clasice', ru: 'Классические выключатели' }, invest: 'low', rec: true },
          { id: 'dimmer', label: { ro: 'Dimmer', ru: 'Диммер' }, invest: 'mid' },
          { id: 'smart', label: { ro: 'Iluminat Smart', ru: 'Умное освещение' }, invest: 'high' },
        ],
      },
    ],
  },
  {
    id: 'incalzire',
    part: 1,
    num: '06',
    title: { ro: 'Încălzire și climatizare', ru: 'Отопление и климат' },
    fields: [
      {
        id: 'incalzire_tip',
        kind: 'single',
        label: { ro: 'Încălzire', ru: 'Отопление' },
        note: {
          ro: 'Ideal, atunci când condițiile tehnice și bugetul permit, recomandăm încălzirea prin pardoseală fără calorifere.',
          ru: 'В идеале, если технические условия и бюджет позволяют, рекомендуем тёплый пол без радиаторов.',
        },
        options: [
          { id: 'incalzire_pardoseala', label: { ro: 'Încălzire prin pardoseală', ru: 'Тёплый пол' }, invest: 'high', rec: true },
          { id: 'calorifere', label: { ro: 'Calorifere', ru: 'Радиаторы' }, invest: 'low_mid' },
        ],
      },
      {
        id: 'climatizare',
        kind: 'single',
        label: { ro: 'Climatizare', ru: 'Кондиционирование' },
        options: [
          { id: 'ac_clasic', label: { ro: 'Aer condiționat clasic', ru: 'Классический кондиционер' }, invest: 'low_mid', rec: true, recNote: { ro: 'pentru orice interior', ru: 'для любого интерьера' } },
          { id: 'ac_ascuns', label: { ro: 'Aer condiționat ascuns / sistem duct', ru: 'Скрытая канальная система' }, invest: 'high' },
        ],
      },
      {
        id: 'semineu',
        kind: 'single',
        label: { ro: 'Șemineu', ru: 'Камин' },
        options: [
          { id: 'semineu_electric', label: { ro: 'Șemineu electric', ru: 'Электрокамин' }, invest: 'mid' },
          { id: 'semineu_clasic', label: { ro: 'Șemineu clasic', ru: 'Классический камин' }, invest: 'high' },
          { id: 'fara_semineu', label: { ro: 'Nu doresc șemineu', ru: 'Камин не нужен' } },
        ],
      },
      {
        id: 'obs_part1_generale',
        kind: 'text',
        label: { ro: 'Observații generale — Partea I', ru: 'Общие замечания — Часть I' },
        placeholder: {
          ro: 'Orice ține de finisaje și nu a încăput mai sus: materiale care vă plac, ce vreți să evităm, restricții din bloc.',
          ru: 'Всё об отделке, что не вошло выше: материалы, которые нравятся, чего избегать, ограничения дома.',
        },
        rows: 3,
      },
    ],
  },
];
