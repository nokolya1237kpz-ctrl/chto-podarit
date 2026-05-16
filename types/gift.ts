export type Recipient =
  | 'Девушка'
  | 'Парню'
  | 'Маме'
  | 'Папе'
  | 'Другу'
  | 'Коллеге'
  | 'Ребёнку';

export type Budget =
  | 'До 1000 ₽'
  | '1000–3000 ₽'
  | '3000–7000 ₽'
  | '7000–15000 ₽'
  | '15000 ₽+';

export type Occasion =
  | 'День рождения'
  | 'Новый год'
  | '14 февраля'
  | '8 марта'
  | 'Без повода';

export type Interest =
  | 'Техника'
  | 'Игры'
  | 'Авто'
  | 'Красота'
  | 'Спорт'
  | 'Уют'
  | 'Путешествия';

export type GiftType =
  | 'Практичный'
  | 'Романтичный'
  | 'Необычный'
  | 'Смешной'
  | 'Премиальный';

export type RiskLevel = 'низкий' | 'средний' | 'высокий';

export interface Gift {
  id: string;
  title: string;
  description: string;
  price: number;
  recipient: Recipient[];
  budget: Budget[];
  occasion: Occasion[];
  interests: Interest[];
  giftType: GiftType[];
  wow: number; // 1-10
  risk: RiskLevel;
  url?: string;
}

export interface QuizAnswers {
  recipient: Recipient | '';
  budget: Budget | '';
  occasion: Occasion | '';
  interest: Interest | '';
  giftType: GiftType | '';
}
