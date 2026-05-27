import { ASCII_PRODUCT_METADATA_USER_AGENT, sanitizeHeaders } from '@server/http/httpHeaders';

export function resolveRelativeUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

function extractMetaContent(html: string, attr: string, name: string): string | null {
  const regex = new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractLinkHref(html: string, rel: string): string | null {
  const regex = new RegExp(`<link[^>]+rel=["']${rel}["'][^>]+href=["']([^"']+)["']`, 'i');
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

export function extractImageFromHtml(html: string): string | null {
  const candidates = [
    extractMetaContent(html, 'property', 'og:image'),
    extractMetaContent(html, 'name', 'og:image'),
    extractMetaContent(html, 'property', 'twitter:image'),
    extractMetaContent(html, 'name', 'twitter:image'),
    extractMetaContent(html, 'itemprop', 'image'),
    extractMetaContent(html, 'name', 'image'),
    extractLinkHref(html, 'image_src'),
  ];

  return candidates.find(Boolean) || null;
}

export function extractTitleFromHtml(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

export function extractDescriptionFromHtml(html: string): string | null {
  return (
    extractMetaContent(html, 'name', 'description') ||
    extractMetaContent(html, 'property', 'og:description') ||
    extractMetaContent(html, 'name', 'twitter:description') ||
    null
  );
}

export function extractPageMetadata(html: string, baseUrl: string) {
  const title = extractTitleFromHtml(html) || undefined;
  const description = extractDescriptionFromHtml(html) || undefined;
  const rawImage = extractImageFromHtml(html);
  const imageUrl = rawImage ? resolveRelativeUrl(rawImage, baseUrl) : undefined;

  return {
    title,
    description,
    imageUrl,
  };
}

export async function fetchProductImageFromUrl(url: string): Promise<string | null> {
  try {
    const { headers } = sanitizeHeaders({
      'User-Agent': ASCII_PRODUCT_METADATA_USER_AGENT,
      Accept: 'text/html,image/*,*/*;q=0.8',
    });
    const response = await fetch(url, {
      headers,
      redirect: 'follow',
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const imageUrl = extractImageFromHtml(html);
    return imageUrl ? resolveRelativeUrl(imageUrl, response.url) : null;
  } catch (error) {
    console.error('Error fetching product image from URL:', error);
    return null;
  }
}

export async function fetchPageMetadata(url: string) {
  try {
    const { headers } = sanitizeHeaders({
      'User-Agent': ASCII_PRODUCT_METADATA_USER_AGENT,
      Accept: 'text/html,image/*,*/*;q=0.8',
    });
    const response = await fetch(url, {
      headers,
      redirect: 'follow',
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    return extractPageMetadata(html, response.url);
  } catch (error) {
    console.error('Error fetching page metadata:', error);
    return null;
  }
}
