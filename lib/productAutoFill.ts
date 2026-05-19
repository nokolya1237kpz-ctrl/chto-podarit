import type { Product, RiskLevel } from '@/types/product';

export type ProductAutoFillInput = Partial<Product> & {
  category?: string;
};

export type ProductAutoFillResult = {
  recipients: string[];
  interests: string[];
  occasions: string[];
  giftTypes: string[];
  budget: string;
  discountPercent?: number;
  wowRating: number;
  riskLevel: RiskLevel;
};

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function getBudgetByPrice(price?: number | null) {
  const value = Number(price || 0);
  if (value <= 0) return '';
  if (value <= 1000) return 'до 1000 ₽';
  if (value <= 3000) return 'до 3000 ₽';
  if (value <= 7000) return 'до 7000 ₽';
  return 'премиум';
}

export function calculateDiscountPercent(price?: number | null, oldPrice?: number | null) {
  const current = Number(price || 0);
  const old = Number(oldPrice || 0);
  if (current <= 0 || old <= current) return undefined;
  return Math.round(((old - current) / old) * 100);
}

export function autoFillProductFields(productInput: ProductAutoFillInput): ProductAutoFillResult {
  const text = [
    productInput.title,
    productInput.description,
    productInput.marketplace,
    productInput.category,
    productInput.originalUrl,
    productInput.affiliateUrl,
  ].filter(Boolean).join(' ').toLowerCase();

  const recipients: string[] = [];
  const interests: string[] = [];
  const occasions = ['день рождения', 'новый год', 'праздник'];
  const giftTypes: string[] = [];

  const isBeauty = includesAny(text, ['косметика', 'помада', 'уход', 'beauty', 'украшения', 'сумка', 'макияж']);
  const isKitchen = includesAny(text, ['кухня', 'мультиварка', 'дом', 'техника для кухни', 'готовка', 'кулинар']);
  const isSport = includesAny(text, ['спорт', 'фитнес', 'валик', 'тренажер', 'йога']);
  const isGadget = includesAny(text, ['гаджет', 'наушники', 'электроника', 'технолог', 'музыка']);
  const isBook = includesAny(text, ['книга', 'литрес', 'чтение', 'саморазвитие']);

  if (isBeauty) {
    recipients.push('girlfriend', 'wife', 'sister', 'mom', 'teenage_girl');
    interests.push('косметика', 'макияж', 'beauty', 'уход за собой');
    occasions.push('8 марта', 'свидание');
    giftTypes.push('косметика', 'beauty', 'уход');
  }

  if (isKitchen) {
    recipients.push('mom', 'dad', 'wife', 'husband', 'family', 'parents');
    interests.push('кулинария', 'кухня', 'дом', 'здоровое питание');
    occasions.push('новоселье', 'годовщина');
    giftTypes.push('бытовая техника', 'техника для кухни', 'подарок для дома');
  }

  if (isSport) {
    recipients.push('girlfriend', 'boyfriend', 'wife', 'husband', 'friend');
    interests.push('спорт', 'фитнес', 'здоровье', 'йога');
    giftTypes.push('спорт', 'здоровье', 'аксессуар');
  }

  if (isGadget) {
    recipients.push('girlfriend', 'boyfriend', 'friend', 'colleague', 'brother', 'sister');
    interests.push('технологии', 'музыка', 'гаджеты');
    giftTypes.push('гаджет', 'электроника', 'аксессуар');
  }

  if (isBook) {
    interests.push('книги', 'саморазвитие', 'чтение');
    giftTypes.push('книга', 'саморазвитие');
  }

  if (recipients.length === 0) {
    recipients.push('friend', 'colleague');
  }
  if (interests.length === 0) {
    interests.push('подарки');
  }
  if (giftTypes.length === 0) {
    giftTypes.push('подарок');
  }

  return {
    recipients: unique(recipients),
    interests: unique(interests),
    occasions: unique(occasions),
    giftTypes: unique(giftTypes),
    budget: getBudgetByPrice(productInput.price),
    discountPercent: calculateDiscountPercent(productInput.price, productInput.oldPrice),
    wowRating: isBeauty || isGadget ? 8 : 7,
    riskLevel: 'low',
  };
}

export function applyAutoFillToProduct<T extends Partial<Product>>(product: T): T {
  const auto = autoFillProductFields(product);

  return {
    ...product,
    recipients: product.recipients?.length ? product.recipients : auto.recipients,
    interests: product.interests?.length ? product.interests : auto.interests,
    occasions: product.occasions?.length ? product.occasions : auto.occasions,
    giftTypes: product.giftTypes?.length ? product.giftTypes : auto.giftTypes,
    budget: product.budget || auto.budget,
    discountPercent: product.discountPercent ?? auto.discountPercent,
    wowRating: product.wowRating || auto.wowRating,
    riskLevel: product.riskLevel || auto.riskLevel,
  };
}
