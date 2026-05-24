import { parseFeed, normalizeFeedItem } from '@/lib/feedImport';
import { inflateRawSync } from 'node:zlib';

export type ColumnMapping = Record<string, string>;

export const importFields = ['title', 'description', 'price', 'oldPrice', 'imageUrl', 'productUrl', 'affiliateUrl', 'marketplace', 'category', 'tags'];

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

export function applyColumnMapping(row: Record<string, any>, mapping: ColumnMapping) {
  const mapped: Record<string, any> = {};
  Object.entries(mapping).forEach(([target, source]) => {
    if (source && row[source] !== undefined) mapped[target] = row[source];
  });
  const imageValue = mapped.imageUrl ?? row.imageUrl ?? row.coverImageUrl ?? row.image_url ?? row.image ?? row.picture ?? row.images;
  return {
    title: mapped.title ?? row.title ?? row.name,
    description: mapped.description ?? row.description ?? row.richDescription ?? row.desc,
    price: mapped.price ?? row.cardPrice ?? row.price ?? row.priceDecimal,
    oldPrice: mapped.oldPrice ?? row.originalPrice ?? row.oldPrice ?? row.old_price,
    imageUrl: Array.isArray(imageValue) ? imageValue[0] : imageValue,
    productUrl: mapped.productUrl ?? row.productUrl ?? row.product_url ?? row.url ?? row.link,
    affiliateUrl: mapped.affiliateUrl ?? row.affiliateUrl ?? row.affiliate_url,
    marketplace: mapped.marketplace ?? row.marketplace,
    category: mapped.category ?? row.category,
    tags: mapped.tags ?? row.tags,
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
    affiliateUrl: row.affiliateUrl || normalized.affiliateUrl,
    tags: Array.isArray(row.tags) ? row.tags : String(row.tags || normalized.tags?.join(',') || '').split(',').map((tag) => tag.trim()).filter(Boolean),
  };
}
