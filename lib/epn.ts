import type { Product } from '@/types/product';
import { fetchPageMetadata } from '@/lib/imageMetadata';

export async function fetchEpnProductMetadata(
  affiliateUrl: string,
  token?: string
): Promise<Partial<Product> | null> {
  try {
    const metadata = await fetchPageMetadata(affiliateUrl);
    if (!metadata) {
      return null;
    }

    return {
      title: metadata.title || undefined,
      description: metadata.description || undefined,
      imageUrl: metadata.imageUrl || undefined,
      originalUrl: affiliateUrl,
      affiliateUrl,
      currency: 'RUB',
      marketplace: 'ePN',
      epnToken: token,
    };
  } catch (error) {
    console.error('Error fetching ePN metadata:', error);
    return null;
  }
}
