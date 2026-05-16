import { Gift, QuizAnswers } from '../types/gift';

export interface ScoredGift extends Gift {
  score: number;
}

export function matchGifts(answers: QuizAnswers, gifts: Gift[]): ScoredGift[] {
  const res = gifts.map((gift) => {
    let score = 0;

    // recipient +3
    if (answers.recipient && gift.recipient.includes(answers.recipient)) score += 3;

    // budget +3
    if (answers.budget && gift.budget.includes(answers.budget)) score += 3;

    // interest +2
    if (answers.interest && gift.interests.includes(answers.interest)) score += 2;

    // occasion +1
    if (answers.occasion && gift.occasion.includes(answers.occasion)) score += 1;

    // type +1
    if (answers.giftType && gift.giftType.includes(answers.giftType)) score += 1;

    return { ...gift, score };
  });

  return res.sort((a, b) => b.score - a.score || b.wow - a.wow).slice(0, 10);
}

export default matchGifts;
