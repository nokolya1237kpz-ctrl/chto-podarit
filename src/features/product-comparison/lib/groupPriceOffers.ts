import type { PriceOffer } from '@entities/price-offer';

export function groupPriceOffers(offers: PriceOffer[]) {
  return offers.map((offer) => ({
    key: offer.title.trim().toLowerCase(),
    title: offer.title,
    offers: [offer],
  }));
}
