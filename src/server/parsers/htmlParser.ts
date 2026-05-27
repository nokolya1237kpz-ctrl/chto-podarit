import 'server-only';

import { extractPageMetadata } from '@features/product-import/lib/imageMetadata';

function extractCanonical(html: string, fallback: string) {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  if (!match?.[1]) return fallback;
  try {
    return new URL(match[1], fallback).toString();
  } catch {
    return fallback;
  }
}

function readJsonLdProduct(html: string) {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const script of scripts) {
    const json = script.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
    try {
      const parsed = JSON.parse(json);
      const items = Array.isArray(parsed) ? parsed : [parsed, ...(parsed['@graph'] || [])];
      const product = items.flat().find((item: any) => String(item?.['@type'] || '').toLowerCase().includes('product'));
      if (product) return product;
    } catch {
      // Ignore malformed JSON-LD.
    }
  }
  return null;
}

export function parseProductHtml(html: string, url: string) {
  const metadata = extractPageMetadata(html, url);
  const product = readJsonLdProduct(html);
  const offer = Array.isArray(product?.offers) ? product.offers[0] : product?.offers;
  const priceMatch = html.match(/(?:price|цена)[^0-9]{0,40}([0-9][0-9\s.,]{1,12})/i);
  const price = Number(offer?.price || 0) || (priceMatch ? Number(priceMatch[1].replace(/\s/g, '').replace(',', '.')) || 0 : 0);
  const image = Array.isArray(product?.image) ? product.image[0] : product?.image;

  return {
    title: product?.name || metadata.title || '',
    description: product?.description || metadata.description || '',
    imageUrl: image || metadata.imageUrl || '',
    price,
    currency: offer?.priceCurrency || 'RUB',
    originalUrl: extractCanonical(html, url),
  };
}
