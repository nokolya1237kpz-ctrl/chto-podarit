import 'server-only';

import { getCachedUrl, setCachedUrl } from './cache';
import { supabaseAdmin } from '@lib/supabase';
import { fetchWithAdaptiveRetry, getBrowserHeaders } from '@server/http/providerHttp';

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
  'dns-shop.ru',
  'www.dns-shop.ru',
  'citilink.ru',
  'www.citilink.ru',
  'megamarket.ru',
  'www.megamarket.ru',
  'mvideo.ru',
  'www.mvideo.ru',
  'eldorado.ru',
  'www.eldorado.ru',
];

let lastRequestAt = 0;
const domainState = new Map<string, { lastRequestAt: number; count: number; windowStartedAt: number; status?: string }>();

function isPrivateHost(host: string) {
  const normalized = host.toLowerCase();
  if (['localhost', '0.0.0.0', '::1'].includes(normalized)) return true;
  if (/^127\./.test(normalized) || /^10\./.test(normalized) || /^192\.168\./.test(normalized)) return true;
  const match172 = normalized.match(/^172\.(\d+)\./);
  return Boolean(match172 && Number(match172[1]) >= 16 && Number(match172[1]) <= 31);
}

export function isAllowedPublicUrl(url: string, allowAnyPublicDomain = false) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    if (isPrivateHost(host)) return false;
    if (allowAnyPublicDomain) return true;
    return allowedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

async function getSupabaseCache(url: string) {
  if (!supabaseAdmin) return null;
  try {
    const { data } = await supabaseAdmin
      .from('parser_cache')
      .select('body, expires_at')
      .eq('url', url)
      .maybeSingle();
    if (data?.body && (!data.expires_at || new Date(data.expires_at).getTime() > Date.now())) {
      return String(data.body);
    }
  } catch {
    return null;
  }
  return null;
}

async function setSupabaseCache(url: string, body: string, ttlMs: number) {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.from('parser_cache').upsert({
      url,
      body,
      expires_at: new Date(Date.now() + ttlMs).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'url' });
  } catch {
    // Optional cache table may not exist yet.
  }
}

export async function safeFetch(url: string, options: { ttlMs?: number; crawlDelayMs?: number; timeoutMs?: number; maxRequestsPerHour?: number; allowAnyPublicDomain?: boolean } = {}) {
  if (!isAllowedPublicUrl(url, options.allowAnyPublicDomain)) {
    throw new Error('Domain is not allowed for controlled parser fallback');
  }

  const cached = getCachedUrl(url);
  if (cached) return cached;
  const supabaseCached = await getSupabaseCache(url);
  if (supabaseCached) {
    setCachedUrl(url, supabaseCached, options.ttlMs);
    return supabaseCached;
  }

  const domain = new URL(url).hostname.toLowerCase();
  const domainLimit = options.maxRequestsPerHour ?? 60;
  const state = domainState.get(domain) || { lastRequestAt: 0, count: 0, windowStartedAt: Date.now() };
  if (Date.now() - state.windowStartedAt > 60 * 60 * 1000) {
    state.count = 0;
    state.windowStartedAt = Date.now();
  }
  if (state.count >= domainLimit) {
    state.status = 'limited';
    domainState.set(domain, state);
    throw new Error('Source status limited: hourly request limit reached');
  }

  const delay = options.crawlDelayMs ?? 1200;
  const waitMs = Math.max(0, Math.max(lastRequestAt, state.lastRequestAt) + delay - Date.now());
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  lastRequestAt = Date.now();
  state.lastRequestAt = lastRequestAt;
  state.count += 1;
  domainState.set(domain, state);

  const result = await fetchWithAdaptiveRetry(url, {
    headers: getBrowserHeaders(),
    redirect: 'follow',
  }, { maxRetries: 2, timeoutMs: options.timeoutMs ?? 8000 });
  if (result.warnings.length) console.warn('safeFetch sanitized headers', result.warnings);
  if (!result.response) throw new Error(`Fetch failed: ${result.reason}${result.error ? ` (${result.error})` : ''}`);
  const response = result.response;

  if (!response.ok) {
    if ([403, 429].includes(response.status)) {
      state.status = 'limited';
      domainState.set(domain, state);
      throw new Error(`Source status limited: ${response.status} (${result.reason})`);
    }
    throw new Error(`Fetch failed: ${response.status}`);
  }

  const html = await response.text();
  if (/captcha|verify you are human|докажите, что вы не робот/i.test(html)) {
    state.status = 'limited';
    domainState.set(domain, state);
    throw new Error('Source status limited: captcha detected');
  }
  const ttl = options.ttlMs ?? 30 * 60 * 1000;
  setCachedUrl(url, html, ttl);
  await setSupabaseCache(url, html, ttl);
  return html;
}
