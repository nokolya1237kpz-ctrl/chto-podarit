import { detectMarketplaceFromProductUrl } from '@/lib/epn';
import type { ImportProductInput } from '@/lib/importProduct';

function pick(row: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  }
  return undefined;
}

function cleanXml(text: string) {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/(<\/?)[a-zA-Z0-9_-]+:/g, '$1')
    .replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/g, '&amp;');
}

function decode(value?: string) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}

export function parseCsvFeed(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const split = (line: string) => line.match(/("([^"]|"")*"|[^,;]+)/g)?.map((item) => item.trim().replace(/^"|"$/g, '').replace(/""/g, '"')) || [];
  const headers = split(lines.shift() || '');
  return lines.map((line) => {
    const cells = split(line);
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
  const xml = cleanXml(text);
  const chunks = xml.match(/<(offer|item|product)\b[\s\S]*?<\/\1>/gi) || [];
  return chunks.map((chunk) => {
    const read = (tag: string) => decode(chunk.match(new RegExp(`<${tag.replace(/^.*:/, '')}[^>]*>([\\s\\S]*?)<\\/${tag.replace(/^.*:/, '')}>`, 'i'))?.[1]);
    const attr = (name: string) => decode(chunk.match(new RegExp(`${name}=["']([^"']+)["']`, 'i'))?.[1]);
    return {
      id: attr('id') || read('g:id') || read('id'),
      title: read('name') || read('title') || read('g:title') || read('model'),
      product_name: read('product_name') || read('model'),
      description: read('description') || read('g:description'),
      price: read('price') || read('g:price') || read('priceRUB'),
      current_price: read('current_price') || read('priceRUB'),
      oldPrice: read('oldprice') || read('old_price'),
      original_price: read('original_price'),
      image: read('picture') || read('image_link') || read('g:image_link') || attr('url'),
      image_url: read('image_url'),
      url: read('url') || read('link') || read('g:link'),
      product_url: read('product_url'),
      category: read('category') || read('categoryId') || read('g:product_type') || read('categoryName'),
      vendor: read('vendor'),
      sku: read('sku') || read('vendorCode'),
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
  const originalUrl = pick(row, ['url', 'link', 'product_url', 'originalUrl', 'g:link', 'advcampaignGoodsUrl']) || '';
  const price = String(pick(row, ['price', 'sale_price', 'current_price', 'priceRUB', 'g:price']) || '').replace(/[^\d.,]/g, '').replace(',', '.');
  const oldPrice = String(pick(row, ['oldPrice', 'old_price', 'oldprice', 'compare_at_price', 'original_price']) || '').replace(/[^\d.,]/g, '').replace(',', '.');

  return {
    title: pick(row, ['name', 'title', 'product_name', 'model', 'g:title', 'vendor']) || '',
    description: pick(row, ['description', 'desc', 'g:description']) || '',
    imageUrl: pick(row, ['image', 'picture', 'image_url', 'imageUrl', 'image_link', 'g:image_link']) || '',
    price: Number(price) || 0,
    oldPrice: oldPrice ? Number(oldPrice) || undefined : undefined,
    originalUrl: pick(row, ['url', 'link', 'product_url', 'originalUrl', 'g:link', 'advcampaignGoodsUrl']) || originalUrl,
    affiliateUrl: pick(row, ['affiliateUrl', 'affiliate_url', 'deeplink']) || originalUrl,
    marketplace: pick(row, ['marketplace']) || detectMarketplaceFromProductUrl(originalUrl),
    externalProductId: String(pick(row, ['externalProductId', 'id', 'sku', 'offer_id', 'vendorCode']) || originalUrl),
    sourceProvider: sourceProvider as any,
    sourceType: 'feed' as any,
    category: pick(row, ['category', 'category_name', 'product_type']),
    tags: ['feed', pick(row, ['category', 'category_name', 'product_type'])].filter(Boolean),
    currency: 'RUB',
  };
}
