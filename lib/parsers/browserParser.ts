import { safeFetch } from './safeFetch';
import { parseProductHtml } from './htmlParser';

export async function browserParser(url: string, options: { allowAnyPublicDomain?: boolean } = {}) {
  // Browser rendering is intentionally not automated here. We keep this fallback
  // API-first and cache-first; HTML fetch is used only for public pages.
  const html = await safeFetch(url, { allowAnyPublicDomain: options.allowAnyPublicDomain });
  return parseProductHtml(html, url);
}
