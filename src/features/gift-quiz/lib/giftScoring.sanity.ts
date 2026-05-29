import type { Product } from '@entities/product/types';
import { scoreProductForGift } from './recommendationEngine';

function fixture(overrides: Partial<Product>): Product {
  return {
    id: overrides.id || String(overrides.title),
    title: overrides.title || 'Товар',
    description: overrides.description || 'Описание товара для проверки',
    price: Number(overrides.price || 0),
    currency: 'RUB',
    marketplace: 'sadovod',
    originalUrl: '',
    imageUrl: 'https://example.com/image.webp',
    recipients: [],
    budget: '',
    interests: [],
    occasions: [],
    giftTypes: [],
    tags: [],
    wowRating: 7,
    riskLevel: 'low',
    isActive: true,
    status: 'active',
    sourceProvider: 'sadovod',
    ...overrides,
  };
}

export function runGiftScoringSanityCheck() {
  const answers = { recipient: 'girlfriend', occasions: ['8 марта'], budget: '1000–3000 ₽' };
  const cases = [
    { product: fixture({ title: 'Мужской ремень кожаный', price: 250 }), shouldBlock: true },
    { product: fixture({ title: 'Женская сумочка', price: 6000 }), shouldBlock: true },
    { product: fixture({ title: 'Помада матовая', price: 1500 }), shouldBlock: false },
    { product: fixture({ title: 'Духи женские', price: 2500 }), shouldBlock: false },
    { product: fixture({ title: 'Ароматизатор авто', price: 1200 }), shouldBlock: true },
    { product: fixture({ title: 'Наушники беспроводные', price: 2500 }), shouldBlock: false },
  ];

  return cases.map(({ product, shouldBlock }) => {
    const result = scoreProductForGift(product, answers);
    return {
      title: product.title,
      passed: result.blocked === shouldBlock,
      expectedBlocked: shouldBlock,
      actualBlocked: result.blocked,
      score: result.score,
      penalties: result.penalties,
      reasons: result.reasons,
    };
  });
}
