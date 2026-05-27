import type { PriceOffer } from '@entities/price-offer';

export function calculateCheapestOffer(offers: PriceOffer[]) {
  return offers.filter((offer) => offer.price > 0).sort((a, b) => a.price - b.price)[0] || null;
}
