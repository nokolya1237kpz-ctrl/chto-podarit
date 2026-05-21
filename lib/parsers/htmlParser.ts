import { extractPageMetadata } from '@/lib/imageMetadata';

export function parseProductHtml(html: string, url: string) {
  const metadata = extractPageMetadata(html, url);
  const priceMatch = html.match(/(?:price|цена)[^0-9]{0,40}([0-9][0-9\s.,]{1,12})/i);
  const price = priceMatch ? Number(priceMatch[1].replace(/\s/g, '').replace(',', '.')) || 0 : 0;

  return {
    title: metadata.title || '',
    description: metadata.description || '',
    imageUrl: metadata.imageUrl || '',
    price,
    originalUrl: url,
  };
}
