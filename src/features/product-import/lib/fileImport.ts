import 'server-only';

import { parseFeed, normalizeFeedItem } from '@features/product-import/lib/feedImport';
import { inflateRawSync } from 'node:zlib';

export type ColumnMapping = Record<string, string>;

export const importFields = ['title', 'description', 'price', 'oldPrice', 'imageUrl', 'productUrl', 'affiliateUrl', 'marketplace', 'category', 'tags', 'externalProductId', 'availability'];

function readUInt32LE(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);
}

function readUInt16LE(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function decodeXml(bytes: Uint8Array) {
  return new TextDecoder('utf-8').decode(bytes);
}

function unzipXlsx(bytes: Uint8Array) {
  const files = new Map<string, string>();
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i -= 1) {
    if (readUInt32LE(bytes, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('Invalid XLSX file');
  const total = readUInt16LE(bytes, eocd + 10);
  let offset = readUInt32LE(bytes, eocd + 16);
  for (let i = 0; i < total; i += 1) {
    if (readUInt32LE(bytes, offset) !== 0x02014b50) break;
    const method = readUInt16LE(bytes, offset + 10);
    const compressedSize = readUInt32LE(bytes, offset + 20);
    const fileNameLength = readUInt16LE(bytes, offset + 28);
    const extraLength = readUInt16LE(bytes, offset + 30);
    const commentLength = readUInt16LE(bytes, offset + 32);
    const localOffset = readUInt32LE(bytes, offset + 42);
    const name = decodeXml(bytes.slice(offset + 46, offset + 46 + fileNameLength));
    const localNameLength = readUInt16LE(bytes, localOffset + 26);
    const localExtraLength = readUInt16LE(bytes, localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataStart, dataStart + compressedSize);
    const content = method === 8 ? inflateRawSync(compressed) : compressed;
    files.set(name, decodeXml(content));
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  return files;
}

function stripXml(value = '') {
  return value.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

function columnIndex(cellRef: string) {
  const letters = (cellRef.match(/[A-Z]+/i)?.[0] || 'A').toUpperCase();
  return [...letters].reduce((acc, letter) => acc * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function parseXlsx(bytes: Uint8Array): Record<string, any>[] {
  const files = unzipXlsx(bytes);
  const sharedXml = files.get('xl/sharedStrings.xml') || '';
  const shared = [...sharedXml.matchAll(/<si[^>]*>([\s\S]*?)<\/si>/g)].map((match) => stripXml(match[1]));
  const sheetName = [...files.keys()].find((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name));
  if (!sheetName) return [];
  const sheet = files.get(sheetName) || '';
  const rows = [...sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
    const row: string[] = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c[^>]*r=["']([^"']+)["'][^>]*(?:t=["']([^"']+)["'])?[^>]*>([\s\S]*?)<\/c>/g)) {
      const index = columnIndex(cellMatch[1]);
      const type = cellMatch[2];
      const body = cellMatch[3];
      const raw = body.match(/<v[^>]*>([\s\S]*?)<\/v>/)?.[1] || body.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] || '';
      row[index] = type === 's' ? shared[Number(raw)] || '' : stripXml(raw);
    }
    return row;
  }).filter((row) => row.some(Boolean));
  const headers = (rows.shift() || []).map((item) => String(item || '').trim());
  return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ''])));
}

export function parseImportFile(input: string | Uint8Array, fileName = '', contentType = '') {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.xlsx')) {
    if (typeof input === 'string') throw new Error('XLSX must be uploaded as binary file');
    return parseXlsx(input);
  }
  return parseFeed(typeof input === 'string' ? input : new TextDecoder('utf-8').decode(input), contentType);
}

function pick(row: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function normalizePrice(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const normalized = String(value || '')
    .replace(/\s+/g, '')
    .replace(/[^\d.,]/g, '')
    .replace(',', '.');
  return Number(normalized) || 0;
}

function normalizeImageUrl(value: unknown, productUrl?: string) {
  const raw = Array.isArray(value) ? value[0] : value;
  const stringValue = typeof raw === 'object' && raw
    ? String((raw as any).url || (raw as any).src || (raw as any).imageUrl || '')
    : String(raw || '');
  let image = stringValue.split(/\r?\n|;|,\s*(?=https?:\/\/|\/\/)/).map((item) => item.trim()).find(Boolean) || '';
  if (image.startsWith('//')) image = `https:${image}`;
  if (image.startsWith('/') && productUrl) {
    try {
      image = new URL(image, productUrl).toString();
    } catch {}
  }
  return image;
}

export function applyColumnMapping(row: Record<string, any>, mapping: ColumnMapping) {
  const mapped: Record<string, any> = {};
  Object.entries(mapping).forEach(([target, source]) => {
    if (!source) return;
    if (source === 'sadovod') {
      mapped[target] = 'sadovod';
      return;
    }
    if (row[source] !== undefined) mapped[target] = row[source];
  });
  const productUrl = mapped.productUrl ?? pick(row, ['productUrl', 'product_url', 'url', 'URL', 'link', 'ссылка']);
  const imageValue = mapped.imageUrl ?? pick(row, ['imageUrl', 'coverImageUrl', 'image_url', 'image', 'picture', 'images', 'Изображения', 'Изображение']);
  return {
    title: mapped.title ?? pick(row, ['title', 'name', 'product_name', 'model', 'Название']),
    description: mapped.description ?? pick(row, ['description', 'richDescription', 'desc', 'Описание']),
    price: mapped.price ?? pick(row, ['cardPrice', 'price', 'priceDecimal', 'Цена']),
    oldPrice: mapped.oldPrice ?? pick(row, ['originalPrice', 'oldPrice', 'old_price']),
    imageUrl: normalizeImageUrl(imageValue, productUrl),
    productUrl,
    affiliateUrl: mapped.affiliateUrl ?? pick(row, ['affiliateUrl', 'affiliate_url', 'deeplink']),
    marketplace: mapped.marketplace ?? pick(row, ['marketplace', 'Маркетплейс']),
    category: mapped.category ?? pick(row, ['category', 'Категория']),
    tags: mapped.tags ?? pick(row, ['tags', 'Подкатегория']),
    externalProductId: mapped.externalProductId ?? pick(row, ['externalProductId', 'sku', 'id', 'Артикул']),
    availability: mapped.availability ?? pick(row, ['availability', 'Наличие']),
  };
}

export function normalizeMappedRow(row: Record<string, any>, sourceProvider = 'file') {
  const normalized = normalizeFeedItem({
    ...row,
    url: row.productUrl || row.url,
    image: row.imageUrl,
    old_price: row.oldPrice,
  }, sourceProvider);
  return {
    ...normalized,
    title: String(row.title || normalized.title || '').trim(),
    description: String(row.description || normalized.description || '').trim(),
    price: normalizePrice(row.price ?? normalized.price),
    oldPrice: normalizePrice(row.oldPrice ?? normalized.oldPrice) || undefined,
    imageUrl: normalizeImageUrl(row.imageUrl || normalized.imageUrl, row.productUrl || normalized.originalUrl),
    originalUrl: row.productUrl || normalized.originalUrl || '',
    affiliateUrl: row.affiliateUrl || normalized.affiliateUrl,
    marketplace: row.marketplace || normalized.marketplace,
    category: row.category || normalized.category,
    externalProductId: String(row.externalProductId || normalized.externalProductId || row.productUrl || row.title || '').trim(),
    availability: row.availability || (normalized as any).availability,
    sourceProvider,
    sourceType: 'feed' as any,
    tags: Array.isArray(row.tags) ? row.tags : String(row.tags || normalized.tags?.join(',') || '').split(',').map((tag) => tag.trim()).filter(Boolean),
  };
}
