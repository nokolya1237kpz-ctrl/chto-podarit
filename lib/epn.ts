import type { Product } from '@/types/product';

export async function fetchEpnProductMetadata(
  affiliateUrl: string,
  token?: string
): Promise<Partial<Product> | null> {
  const apiKey = process.env.EPN_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    // TODO: Реализовать запрос к ePN API или метаданные по партнёрской ссылке.
    // При наличии официального API нужно подставлять token и возвращать структуру Product.
    return null;
  } catch (error) {
    console.error('Error fetching ePN metadata:', error);
    return null;
  }
}
