export interface PriceOffer {
  id?: string;
  title: string;
  price: number;
  oldPrice?: number;
  imageUrl?: string;
  marketplace: string;
  productUrl?: string;
  affiliateUrl?: string;
  availability?: string;
  delivery?: string;
  rating?: number;
  sourceProvider?: string;
}
