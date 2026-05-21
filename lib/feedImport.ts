import { detectMarketplaceFromProductUrl } from '@/lib/epn';
import type { ImportProductInput } from '@/lib/importProduct';

function pick(row: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  }
  return undefined;
}

export function parseCsvFeed(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = (lines.shift() || '').split(',').map((item) => item.trim().replace(/^"|"$/g, ''));
  return lines.map((line) => {
    const cells = line.split(',').map((item) => item.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] || '']));
  });
}

export function parseJsonFeed(text: string): Record<string, any>[] {
  const body = JSON.parse(text);
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.products)) return body.products;
  if (Array.isArray(body.items)) return body.items;
  if (Array.isArray(body.offers)) return body.offers;
  return [];
}

export function parseXmlFeed(text: string): Record<string, any>[] {
  const chunks = text.match(/<(offer|item|product)\b[\s\S]*?<\/\1>/gi) || [];
  return chunks.map((chunk) => {
    const read = (tag: string) => chunk.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1]?.trim();
    const attr = (name: string) => chunk.match(new RegExp(`${name}=["']([^"']+)["']`, 'i'))?.[1]?.trim();
    return {
      id: attr('id') || read('g:id') || read('id'),
      title: read('name') || read('title') || read('g:title'),
      product_name: read('product_name') || read('model'),
      description: read('description') || read('g:description'),
      price: read('price') || read('g:price'),
      current_price: read('current_price') || read('priceRUB'),
      oldPrice: read('oldprice') || read('old_price'),
      original_price: read('original_price'),
      image: read('picture') || read('image_link') || read('g:image_link') || read('enclosure'),
      image_url: read('image_url'),
      url: read('url') || read('link') || read('g:link'),
      product_url: read('product_url'),
      category: read('category') || read('categoryId') || read('g:product_type'),
    };
  });
}

export function parseFeed(text: string, contentType = '') {
  const trimmed = text.trim();
  if (contentType.includes('json') || trimmed.startsWith('{') || trimmed.startsWith('[')) return parseJsonFeed(trimmed);
  if (contentType.includes('csv') || trimmed.split(/\r?\n/)[0]?.includes(',')) return parseCsvFeed(trimmed);
  return parseXmlFeed(trimmed);
}

export function normalizeFeedItem(row: Record<string, any>, sourceProvider = 'feed'): ImportProductInput {
  const originalUrl = pick(row, ['url', 'link', 'product_url', 'originalUrl', 'g:link']) || '';
  const price = String(pick(row, ['price', 'sale_price', 'g:price']) || '').replace(/[^\d.,]/g, '').replace(',', '.');
  const oldPrice = String(pick(row, ['oldPrice', 'old_price', 'compare_at_price']) || '').replace(/[^\d.,]/g, '').replace(',', '.');

  return {
    title: pick(row, ['name', 'title', 'product_name', 'model', 'g:title']) || '',
    description: pick(row, ['description', 'desc', 'g:description']) || '',
    imageUrl: pick(row, ['image', 'picture', 'image_url', 'imageUrl', 'image_link', 'g:image_link']) || '',
    price: Number(price) || 0,
    oldPrice: oldPrice ? Number(oldPrice) || undefined : undefined,
    originalUrl: pick(row, ['url', 'link', 'product_url', 'originalUrl', 'g:link']) || originalUrl,
    affiliateUrl: pick(row, ['affiliateUrl', 'affiliate_url', 'deeplink']) || originalUrl,
    marketplace: pick(row, ['marketplace']) || detectMarketplaceFromProductUrl(originalUrl),
    externalProductId: String(pick(row, ['externalProductId', 'id', 'sku', 'offer_id']) || originalUrl),
    sourceProvider: sourceProvider as any,
    sourceType: 'feed' as any,
    category: pick(row, ['category', 'category_name', 'product_type']),
    tags: ['feed', pick(row, ['category', 'category_name', 'product_type'])].filter(Boolean),
    currency: 'RUB',
  };
}
