import { getCachedUrl, setCachedUrl } from './cache';
import { supabaseAdmin } from '@/lib/supabase';
import { ASCII_USER_AGENT, sanitizeHeaders } from '@/lib/httpHeaders';

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
const domainState = new Map<string, { lastRequestAt: number; count: number; windowStartedAt: number; status?: string }>();

export function isAllowedPublicUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
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

export async function safeFetch(url: string, options: { ttlMs?: number; crawlDelayMs?: number; timeoutMs?: number; maxRequestsPerHour?: number } = {}) {
  if (!isAllowedPublicUrl(url)) {
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 8000);
  let response: Response;
  try {
    const { headers, warnings } = sanitizeHeaders({
      'User-Agent': ASCII_USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
    });
    if (warnings.length) {
      console.warn('safeFetch sanitized non-ASCII headers', warnings);
    }
    response = await fetch(url, {
      headers,
      redirect: 'follow',
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
  clearTimeout(timeout);

  if (!response.ok) {
    if ([403, 429].includes(response.status)) {
      state.status = 'limited';
      domainState.set(domain, state);
      throw new Error(`Source status limited: ${response.status}`);
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
