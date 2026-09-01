import type { InvestLevel, L } from './types';

export const investLabels: Record<InvestLevel, L> = {
  low: { ro: 'investiție redusă', ru: 'невысокие инвестиции' },
  low_mid: { ro: 'investiție redusă-medie', ru: 'от невысоких до средних' },
  mid: { ro: 'investiție medie', ru: 'средние инвестиции' },
  mid_high: { ro: 'investiție medie-înaltă', ru: 'от средних до высоких' },
  high: { ro: 'investiție înaltă', ru: 'высокие инвестиции' },
  varies: { ro: 'investiția variază', ru: 'инвестиции варьируются' },
};

export const recBadgeText: L = { ro: 'Recomandat', ru: 'Рекомендуем' };
