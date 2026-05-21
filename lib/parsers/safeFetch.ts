import { getCachedUrl, setCachedUrl } from './cache';

const allowedDomains = [
  'ozon.ru',
  'www.ozon.ru',
  'wildberries.ru',
  'www.wildberries.ru',
  'wb.ru',
  'www.wb.ru',
  'aliexpress.ru',
  'www.aliexpress.ru',
  'market.yandex.ru',
  'www.sportmaster.ru',
];

let lastRequestAt = 0;

export function isAllowedPublicUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return allowedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export async function safeFetch(url: string, options: { ttlMs?: number; crawlDelayMs?: number } = {}) {
  if (!isAllowedPublicUrl(url)) {
    throw new Error('Domain is not allowed for controlled parser fallback');
  }

  const cached = getCachedUrl(url);
  if (cached) return cached;

  const delay = options.crawlDelayMs ?? 1200;
  const waitMs = Math.max(0, lastRequestAt + delay - Date.now());
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  lastRequestAt = Date.now();
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ChtoPodaritBot/1.0; +https://что-подарить.online)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status}`);
  }

  const html = await response.text();
  setCachedUrl(url, html, options.ttlMs);
  return html;
}
