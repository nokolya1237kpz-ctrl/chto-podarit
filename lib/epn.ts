import type { Product } from '@/types/product';
import { fetchPageMetadata } from '@/lib/imageMetadata';

interface EpnTokenCache {
  ssidToken?: string;
  ssidExpiresAt?: number;
  accessToken?: string;
  accessExpiresAt?: number;
  refreshToken?: string;
  refreshExpiresAt?: number;
  captchaRequired?: boolean;
  cooldownUntil?: number;
  importJobRunning?: boolean;
  lastAuthDebug?: EpnAuthDebug;
}

type EpnAuthDebug = {
  env: {
    hasClientId: boolean;
    hasClientSecret: boolean;
    apiBaseUrl: string;
    oauthBaseUrl: string;
  };
  ssid?: {
    method: 'GET';
    url: string;
    status?: number;
    responseBody?: any;
  };
  token?: {
    method: 'POST';
    url: string;
    grantType: string;
    headers: Record<string, string>;
    requestBody: Record<string, any>;
    status?: number;
    responseBody?: any;
  };
  tokenExpiresAt?: string | null;
  lastAuthError?: string;
};

export interface EpnStatusResult {
  success: boolean;
  connected: boolean;
  hasClientId: boolean;
  hasClientSecret: boolean;
  ssidReceived: boolean;
  tokenReceived: boolean;
  message: string;
  error?: string;
  details?: any;
  tokenCached?: boolean;
  cooldownUntil?: string | null;
  captchaRequired?: boolean;
  ssidExpiresAt?: string | null;
  tokenExpiresAt?: string | null;
  lastAuthDebug?: EpnAuthDebug;
}

export interface EpnOffer {
  id: string;
  name: string;
  image?: string;
  logo?: string;
  logoSmall?: string;
  status?: string;
  category?: string;
  commission?: number | string;
  commissionText?: string;
  cashbackMaxRate?: string | number;
  cashbackRateSymbol?: string;
  allowed?: boolean;
  available?: boolean;
  creativePlacement?: boolean;
  exportSupport?: boolean;
  deeplinkSupport?: boolean;
  marketplace?: string;
  rating?: string | number;
  hosts?: string[];
  cookieLive?: string | number;
  cr?: string | number;
  confirm?: string | number;
  tag?: string | string[];
  directUrl?: string;
  epnUrl?: string;
}

export interface EpnGood {
  id: string;
  title: string;
  price: number;
  currency: string;
  image?: string;
  directUrl?: string;
  cashback?: number;
  cashbackPercent?: number;
  category?: string;
  offerId?: string;
  originalUrl?: string;
  affiliateUrl?: string;
  marketplace?: string;
  offerStatus?: string;
  status?: string;
}

export interface EpnCreative {
  id: string;
  title: string;
  originalUrl: string;
  affiliateUrl: string;
  deeplinkUrl: string;
  token: string;
  offerName?: string;
  offerId?: string;
  marketplace: string;
  createdAt?: string;
  type?: string;
}

class EpnApiError extends Error {
  details?: any;
  status?: number;

  constructor(message: string, details?: any, status?: number) {
    super(message);
    this.details = details;
    this.status = status;
  }
}

const tokenCache: EpnTokenCache = {};
const EPN_CAPTCHA_MESSAGE = 'ePN временно требует капчу. Остановите импорт и попробуйте позже.';

function getMasked(value?: string) {
  if (!value) return '';
  if (value.length <= 6) return '***';
  return `${value.slice(0, 3)}***${value.slice(-3)}`;
}

function getBasicAuthHeader(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
}

function setLastAuthDebug(update: Partial<EpnAuthDebug>) {
  const config = getEpnConfig();
  tokenCache.lastAuthDebug = {
    env: {
      hasClientId: Boolean(config.clientId),
      hasClientSecret: Boolean(config.clientSecret),
      apiBaseUrl: config.apiBaseUrl,
      oauthBaseUrl: config.oauthBaseUrl,
    },
    ...tokenCache.lastAuthDebug,
    ...update,
  };
}

function isEpnCaptchaBody(body: any) {
  const text = typeof body === 'string' ? body : JSON.stringify(body || {});
  return text.toLowerCase().includes('captcha') || text.toLowerCase().includes('need captcha');
}

function setEpnCaptchaCooldown() {
  tokenCache.captchaRequired = true;
  tokenCache.cooldownUntil = Date.now() + 30 * 60 * 1000;
}

export function getEpnRuntimeStatus() {
  const cooldownActive = Boolean(tokenCache.cooldownUntil && tokenCache.cooldownUntil > Date.now());
  if (!cooldownActive && tokenCache.cooldownUntil) {
    tokenCache.cooldownUntil = undefined;
    tokenCache.captchaRequired = false;
  }

  return {
    tokenCached: Boolean(tokenCache.accessToken && tokenCache.accessExpiresAt && tokenCache.accessExpiresAt > Date.now()),
    ssidCached: Boolean(tokenCache.ssidToken && tokenCache.ssidExpiresAt && tokenCache.ssidExpiresAt > Date.now()),
    cooldownUntil: cooldownActive && tokenCache.cooldownUntil ? new Date(tokenCache.cooldownUntil).toISOString() : null,
    captchaRequired: Boolean(tokenCache.captchaRequired && cooldownActive),
    importJobRunning: Boolean(tokenCache.importJobRunning),
    ssidExpiresAt: tokenCache.ssidExpiresAt ? new Date(tokenCache.ssidExpiresAt).toISOString() : null,
    tokenExpiresAt: tokenCache.accessExpiresAt ? new Date(tokenCache.accessExpiresAt).toISOString() : null,
    lastAuthDebug: tokenCache.lastAuthDebug,
  };
}

export function assertEpnAvailable() {
  const status = getEpnRuntimeStatus();
  if (status.captchaRequired || status.cooldownUntil) {
    throw new EpnApiError(EPN_CAPTCHA_MESSAGE, { cooldownUntil: status.cooldownUntil }, 429);
  }
}

export function tryStartEpnImportJob() {
  assertEpnAvailable();
  if (tokenCache.importJobRunning) {
    return false;
  }
  tokenCache.importJobRunning = true;
  return true;
}

export function finishEpnImportJob() {
  tokenCache.importJobRunning = false;
}

export async function delayEpnRequest(ms = 3500) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function getEpnConfig() {
  const clientId = process.env.EPN_CLIENT_ID;
  const clientSecret = process.env.EPN_CLIENT_SECRET;
  const apiBaseUrl = process.env.EPN_API_BASE_URL || 'https://app.epn.bz';
  const oauthBaseUrl = process.env.EPN_OAUTH_BASE_URL || 'https://oauth2.epn.bz';

  return { clientId, clientSecret, apiBaseUrl, oauthBaseUrl };
}

function formatEpnErrorMessage(body: any, status: number, statusText: string) {
  if (!body) {
    return `ePN API error: ${status} ${statusText}`;
  }

  const details = body?.data?.attributes || body?.error || body?.message || body;
  const detailText = typeof details === 'string' ? details : JSON.stringify(details);
  return `ePN API error: ${status} ${statusText} - ${detailText}`;
}

function isViewRulesError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes('viewrules') || message.includes('view_rules') || message.includes('view rules');
}

export interface EpnOffersFetchResult {
  offers: EpnOffer[];
  requestParams: Record<string, any>;
  responseBody: any;
  successfulViewRules?: string;
  triedViewRules: string[];
}

export async function getEpnSsidToken(): Promise<string> {
  assertEpnAvailable();
  const { clientId, clientSecret, oauthBaseUrl } = getEpnConfig();

  if (!clientId || !clientSecret) {
    throw new EpnApiError('Missing EPN_CLIENT_ID or EPN_CLIENT_SECRET');
  }

  if (tokenCache.ssidToken && tokenCache.ssidExpiresAt && tokenCache.ssidExpiresAt > Date.now()) {
    return tokenCache.ssidToken;
  }

  const url = `${oauthBaseUrl}/ssid?v=2&client_id=${encodeURIComponent(clientId)}`;
  setLastAuthDebug({
    ssid: {
      method: 'GET',
      url,
    },
    lastAuthError: undefined,
  });
  const response = await fetch(url, { method: 'GET' });
  const bodyText = await response.text();
  let body: any = null;

  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = bodyText;
  }

  setLastAuthDebug({
    ssid: {
      method: 'GET',
      url,
      status: response.status,
      responseBody: body,
    },
  });
  console.info('ePN SSID request', { url, status: response.status, responseBody: body });

  if (!response.ok) {
    if (response.status === 429 || isEpnCaptchaBody(body)) {
      setEpnCaptchaCooldown();
      setLastAuthDebug({ lastAuthError: EPN_CAPTCHA_MESSAGE });
      throw new EpnApiError(EPN_CAPTCHA_MESSAGE, body, 429);
    }
    setLastAuthDebug({ lastAuthError: formatEpnErrorMessage(body, response.status, response.statusText) });
    throw new EpnApiError(formatEpnErrorMessage(body, response.status, response.statusText), body, response.status);
  }

  const token = body?.data?.attributes?.ssid_token || body?.ssid_token;
  if (!token) {
    setLastAuthDebug({ lastAuthError: 'Unable to parse ssid_token from ePN response' });
    throw new EpnApiError('Unable to parse ssid_token from ePN response', body);
  }

  tokenCache.ssidToken = token;
  tokenCache.ssidExpiresAt = Date.now() + 23 * 60 * 60 * 1000;
  return token;
}

export async function getEpnAccessToken(): Promise<string> {
  assertEpnAvailable();
  const { clientId, clientSecret, oauthBaseUrl } = getEpnConfig();
  if (!clientId || !clientSecret) {
    throw new EpnApiError('Missing EPN_CLIENT_ID or EPN_CLIENT_SECRET');
  }

  if (tokenCache.accessToken && tokenCache.accessExpiresAt && tokenCache.accessExpiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  const ssidToken = await getEpnSsidToken();
  const url = `${oauthBaseUrl}/token?v=2`;
  const grantType = 'client_credentials';
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: getBasicAuthHeader(clientId, clientSecret),
  };
  const requestBody = {
    ssid_token: ssidToken,
    client_id: clientId,
    grant_type: grantType,
    check_ip: false,
  };
  setLastAuthDebug({
    token: {
      method: 'POST',
      url,
      grantType,
      headers: { ...headers, Authorization: `Basic ${getMasked(clientId)}:${getMasked(clientSecret)}` },
      requestBody: { ...requestBody, ssid_token: getMasked(ssidToken) },
    },
    lastAuthError: undefined,
  });
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  const bodyText = await response.text();
  let body: any = null;

  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = bodyText;
  }

  setLastAuthDebug({
    token: {
      method: 'POST',
      url,
      grantType,
      headers: { ...headers, Authorization: `Basic ${getMasked(clientId)}:${getMasked(clientSecret)}` },
      requestBody: { ...requestBody, ssid_token: getMasked(ssidToken) },
      status: response.status,
      responseBody: body,
    },
  });
  console.info('ePN token request', {
    url,
    status: response.status,
    grantType,
    headers: { ...headers, Authorization: 'Basic ***' },
    requestBody: { ...requestBody, ssid_token: '***' },
    responseBody: body,
  });

  if (!response.ok) {
    if (response.status === 429 || isEpnCaptchaBody(body)) {
      setEpnCaptchaCooldown();
      setLastAuthDebug({ lastAuthError: EPN_CAPTCHA_MESSAGE });
      throw new EpnApiError(EPN_CAPTCHA_MESSAGE, body, 429);
    }
    setLastAuthDebug({ lastAuthError: formatEpnErrorMessage(body, response.status, response.statusText) });
    throw new EpnApiError(formatEpnErrorMessage(body, response.status, response.statusText), body, response.status);
  }

  const accessToken = body?.data?.attributes?.access_token || body?.access_token || body?.accessToken;
  const refreshToken = body?.data?.attributes?.refresh_token || body?.refresh_token || body?.refreshToken;
  const expiresIn = Number(body?.data?.attributes?.expires_in || body?.expires_in || 24 * 60 * 60);

  if (!accessToken) {
    setLastAuthDebug({ lastAuthError: 'Unable to parse access_token from ePN response' });
    throw new EpnApiError('Unable to parse access_token from ePN response', body);
  }

  tokenCache.accessToken = accessToken;
  const cacheSeconds = Math.min(Math.max(expiresIn - 60, 20 * 60 * 60), 23 * 60 * 60);
  tokenCache.accessExpiresAt = Date.now() + cacheSeconds * 1000;
  setLastAuthDebug({
    tokenExpiresAt: new Date(tokenCache.accessExpiresAt).toISOString(),
    lastAuthError: undefined,
  });

  if (refreshToken) {
    tokenCache.refreshToken = refreshToken;
    tokenCache.refreshExpiresAt = Date.now() + 15 * 24 * 60 * 60 * 1000;
  }

  return accessToken;
}

export async function refreshEpnTokenIfNeeded(): Promise<string> {
  return getEpnAccessToken();
}

export async function epnFetch(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    query?: Record<string, string | number | boolean | undefined>;
    body?: any;
    headers?: Record<string, string>;
    retry?: boolean;
  } = {}
): Promise<any> {
  assertEpnAvailable();
  const { apiBaseUrl } = getEpnConfig();
  const token = await getEpnAccessToken();
  const url = new URL(path.startsWith('http') ? path : `${apiBaseUrl}${path}`);

  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': 'ru',
    'X-ACCESS-TOKEN': token,
    ...options.headers,
  };

  const response = await fetch(url.toString(), {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let body: any = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (response.status === 429 || isEpnCaptchaBody(body)) {
    setEpnCaptchaCooldown();
    throw new EpnApiError(EPN_CAPTCHA_MESSAGE, {
      method: options.method || 'GET',
      url: url.toString(),
      body: options.body,
      responseBody: body,
      cooldownUntil: getEpnRuntimeStatus().cooldownUntil,
    }, 429);
  }

  if (response.status === 401 && options.retry !== false) {
    tokenCache.accessToken = undefined;
    return epnFetch(path, { ...options, retry: false });
  }

  if (!response.ok) {
    throw new EpnApiError(formatEpnErrorMessage(body, response.status, response.statusText), {
      method: options.method || 'GET',
      url: url.toString(),
      body: options.body,
      responseBody: body,
    }, response.status);
  }

  return body;
}

async function fetchEpnOffersWithViewRules(
  requestParams: Record<string, any>
): Promise<EpnOffersFetchResult> {
  const requestBase = { ...requestParams, lang: 'ru' };
  const viewRulesOptions = ['area_web', 'role_user', 'role_cashback', 'area_mobile', 'area_backit_bot'];
  const triedViewRules: string[] = [];

  for (const viewRules of viewRulesOptions) {
    triedViewRules.push(viewRules);
    const params = { ...requestBase, viewRules };

    try {
      const responseBody = await epnFetch('/offers/list', {
        query: params,
      });
      const offers = normalizeEpnOfferList(responseBody);
      return {
        offers,
        requestParams: params,
        responseBody,
        successfulViewRules: viewRules,
        triedViewRules,
      };
    } catch (error) {
      if (error instanceof EpnApiError && error.status === 422 && isViewRulesError(error)) {
        continue;
      }
      throw error;
    }
  }

  throw new EpnApiError('ePN offers request failed for all viewRules values', { triedViewRules }, 422);
}

export async function getEpnOffers(): Promise<EpnOffersFetchResult> {
  return fetchEpnOffersWithViewRules({ v: '2', lang: 'ru', limit: 50 });
}

export async function searchEpnOffers(query: string, limit = 20): Promise<EpnOffersFetchResult> {
  const trimmed = query?.trim();
  if (!trimmed) {
    return getEpnOffers();
  }

  return fetchEpnOffersWithViewRules({ v: '2', lang: 'ru', q: trimmed, limit });
}

export async function getEpnHotGoods(params: {
  q?: string;
  limit?: number;
  offset?: number;
  categoryId?: string;
  offerId?: string;
  priceMin?: number;
  priceMax?: number;
} = {}): Promise<EpnGood[]> {
  const response = await epnFetch('/goods/hot', {
    query: {
      v: '2',
      locale: 'ru',
      q: params.q,
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
      category_id: params.categoryId,
      offer_id: params.offerId,
      price_min: params.priceMin,
      price_max: params.priceMax,
    },
  });
  return normalizeEpnGoodsList(response);
}

export async function getEpnCreatives(params: {
  limit?: number;
  offset?: number;
  offerId?: string;
  description?: string;
} = {}): Promise<EpnCreative[]> {
  const response = await epnFetch('/creatives/deeplinks', {
    query: {
      fields: 'id,user_id,link,status,type,offer_type,offer_id,code,description,hash,created_at,erid',
      statuses: 'new,working',
      limit: params.limit ?? 100,
      offset: params.offset ?? 0,
      offerId: params.offerId,
      description: params.description,
      sort: '-id',
    },
  });

  return normalizeEpnCreativesList(response);
}

export function mapEpnGoodToProduct(good: any) {
  const title = good.name || good.title || good.product_name || 'ePN товар';
  const price = Number(good.price || good.price_total || good.sale_price || 0) || 0;
  const currency = good.currency || good.currency_code || 'RUB';
  const image = good.imageUrl || good.image || good.logo || good.images?.[0] || good.photo || '';
  const directUrl = good.directUrl || good.originalUrl || good.direct_url || good.url || good.link || good.original_link || '';
  const affiliateUrl = good.affiliateUrl || good.affiliate_url || good.deeplink || directUrl || '';
  const offerId = String(good.offerId || good.offer_id || good.offer?.id || good.advertiser_id || '');
  const category = good.category || good.category_name || good.offer?.category?.name || '';
  const cashback = Number(good.cashback || good.commission || 0) || 0;
  const cashbackPercent = Number(good.cashbackPercent || good.cashback_percent || good.commission_percent || 0) || 0;
  const offerStatus = good.offerStatus || good.status || good.offer?.status || '';

  return {
    title,
    description: good.description || good.short_description || good.offer?.description || '',
    imageUrl: image,
    price,
    currency,
    originalUrl: directUrl,
    affiliateUrl,
    cashback,
    cashbackPercent,
    category,
    offerId,
    id: String(good.id || good.good_id || good.affiliate_id || ''),
    externalProductId: String(good.externalProductId || good.id || good.good_id || good.affiliate_id || ''),
    marketplace: good.marketplace || detectMarketplaceFromUrl(directUrl),
    offerStatus,
    status: good.status || '',
  };
}

export interface GenerateEpnDeeplinkOptions {
  offerId?: string;
  placementId?: string;
  subId?: string;
  description?: string;
}

export interface EpnDeeplinkResult {
  affiliateUrl: string;
  creativeId?: string;
  originalUrl: string;
  offerId?: string;
  placementId?: string;
}

function normalizeEpnDeeplinkBody(response: any) {
  const firstCreative = Array.isArray(response?.data) ? response.data[0] : response?.data;
  const attributes = firstCreative?.attributes || response?.data?.attributes || response?.attributes || {};
  const deeplink = attributes.code || attributes.link || attributes.deeplink || response?.deeplink || response?.url;
  const creativeId = firstCreative?.id || response?.data?.id || response?.id || response?.creative_id || attributes.id;

  if (!deeplink) {
    throw new EpnApiError('Не удалось получить deeplink из ответа ePN', response);
  }

  return {
    affiliateUrl: deeplink,
    creativeId: creativeId ? String(creativeId) : undefined,
  };
}

function formatEpnDeeplinkError(error: Error, details?: any) {
  const message = error.message.toLowerCase();
  if (message.includes('placement') && message.includes('approve')) {
    return 'placement not approved';
  }
  if (message.includes('offer') && message.includes('unavailable')) {
    return 'offer unavailable';
  }
  if (message.includes('invalid') && message.includes('url')) {
    return 'invalid url';
  }
  if (message.includes('limit') || message.includes('quota')) {
    return 'api limit exceeded';
  }
  if (message.includes('401') || message.includes('unauthorized') || message.includes('access denied')) {
    return 'unauthorized';
  }
  return error.message;
}

export async function generateEpnDeeplink(
  url: string,
  options: GenerateEpnDeeplinkOptions = {}
): Promise<EpnDeeplinkResult> {
  if (!url || typeof url !== 'string') {
    throw new EpnApiError('Invalid url for deeplink generation');
  }

  try {
    const body: any = {
      link: url,
      offerId: Number(options.offerId),
      description: options.description || `chto-podarit ${Date.now()}`.slice(0, 100),
      type: 'deeplink',
    };

    if (options.placementId) {
      body.placementId = Number(options.placementId);
    }
    if (options.subId) {
      body.sub1 = options.subId;
    }

    const response = await epnFetch('/creative/create', {
      method: 'POST',
      body,
    });

    const normalized = normalizeEpnDeeplinkBody(response);
    console.info('ePN deeplink generated', {
      offerId: options.offerId,
      placementId: options.placementId,
      creativeId: normalized.creativeId,
    });

    return {
      ...normalized,
      originalUrl: url,
      offerId: options.offerId,
      placementId: options.placementId,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const details = (error as any)?.details;
    const message = formatEpnDeeplinkError(err, details);
    throw new EpnApiError(message, details, (error as any)?.status);
  }
}

export async function createEpnDeeplink(good: any, placementId?: string): Promise<string | null> {
  if (!good || (!good.direct_url && !good.url && !good.link)) {
    throw new EpnApiError('Не указана ссылка для создания креатива');
  }

  const url = good.direct_url || good.url || good.link;
  const result = await generateEpnDeeplink(url, {
    offerId: good.offer_id || good.offerId || good.offer?.id,
    placementId,
  });

  return result.affiliateUrl;
}

export function detectMarketplaceFromUrl(url?: string) {
  if (!url) {
    return 'other';
  }

  const normalized = url.toLowerCase();
  if (normalized.includes('ozon.')) return 'ozon';
  if (normalized.includes('wildberries.')) return 'wildberries';
  if (normalized.includes('aliexpress.') || normalized.includes('alibaba.')) return 'aliexpress';
  return 'other';
}

export function detectMarketplaceFromProductUrl(url?: string) {
  if (!url) {
    return 'other';
  }

  const normalized = url.toLowerCase();
  if (normalized.includes('ozon.ru')) return 'ozon';
  if (normalized.includes('wildberries.ru') || normalized.includes('wb.ru')) return 'wildberries';
  if (normalized.includes('aliexpress')) return 'aliexpress';
  return detectMarketplaceFromUrl(url);
}

function toBoolean(value: any) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'да';
  }
  return false;
}

function firstArrayValue(value: any) {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }

  const first = value[0];
  if (typeof first === 'string' || typeof first === 'number') {
    return String(first);
  }
  if (first && typeof first === 'object') {
    return first.value || first.rate || first.name || first.title || JSON.stringify(first);
  }
  return undefined;
}

function normalizeStringArray(value: any): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function normalizeExternalUrl(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('/')) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }
  return undefined;
}

function detectMarketplaceFromOffer(offer: any) {
  const tags = normalizeStringArray(offer.tag || offer.tags || offer.attributes?.tag || offer.attributes?.tags)
    .join(' ')
    .toLowerCase();
  const hosts = normalizeStringArray(offer.hosts || offer.host || offer.attributes?.hosts || offer.attributes?.host)
    .join(' ')
    .toLowerCase();

  if (tags.includes('ali')) return 'aliexpress';
  if (hosts.includes('ozon')) return 'ozon';
  if (hosts.includes('wildberries')) return 'wildberries';
  return 'other';
}

function normalizeEpnOffer(offer: any): EpnOffer {
  const labelNames = normalizeStringArray(offer.labelNames || offer.label_names || offer.attributes?.labelNames || offer.attributes?.label_names);
  const cashbackMaxRate = offer.cashbackMaxRate ?? offer.cashback_max_rate ?? offer.attributes?.cashbackMaxRate ?? offer.attributes?.cashback_max_rate;
  const cashbackRateSymbol = offer.cashbackRateSymbol || offer.cashback_rate_symbol || offer.attributes?.cashbackRateSymbol || offer.attributes?.cashback_rate_symbol || '';
  const firstComission = firstArrayValue(offer.comission || offer.commission || offer.attributes?.comission || offer.attributes?.commission);
  const commissionText = cashbackMaxRate !== undefined && cashbackMaxRate !== null && cashbackMaxRate !== ''
    ? `${cashbackMaxRate}${cashbackRateSymbol}`
    : firstComission;
  const creativePlacement = toBoolean(offer.creative_placement ?? offer.creativePlacement ?? offer.attributes?.creative_placement ?? offer.attributes?.creativePlacement);
  const exportSupport = toBoolean(offer.export ?? offer.exportSupport ?? offer.attributes?.export ?? offer.attributes?.exportSupport);
  const image = offer.image || offer.logo || offer.logo_small || offer.attributes?.image || offer.attributes?.logo || offer.attributes?.logo_small;
  const hosts = normalizeStringArray(offer.hosts || offer.host || offer.attributes?.hosts || offer.attributes?.host);
  const directUrl = normalizeExternalUrl(
    offer.link_default ||
    offer.linkDefault ||
    offer.attributes?.link_default ||
    offer.attributes?.linkDefault ||
    offer.url ||
    offer.link ||
    offer.attributes?.url ||
    hosts[0]
  );
  const offerId = String(offer.id || offer.offer_id || offer.attributes?.id || '');

  return {
    id: offerId,
    name: offer.name || offer.title || offer.attributes?.name || 'ePN оффер',
    image,
    logo: offer.logo || offer.attributes?.logo,
    logoSmall: offer.logo_small || offer.logoSmall || offer.attributes?.logo_small || offer.attributes?.logoSmall,
    status: offer.status || offer.attributes?.status || offer.offer_state,
    category: labelNames[0] || offer.category || offer.category_name || offer.attributes?.category || offer.offer_category || 'Без категории',
    commission: commissionText ?? (Number(offer.commission || offer.commission_rate || offer.attributes?.commission || 0) || 0),
    commissionText,
    cashbackMaxRate,
    cashbackRateSymbol,
    allowed: offer.allowed ?? offer.is_allowed ?? offer.attributes?.allowed,
    available: creativePlacement || exportSupport,
    creativePlacement,
    exportSupport,
    deeplinkSupport: creativePlacement,
    marketplace: detectMarketplaceFromOffer(offer),
    rating: offer.rating ?? offer.attributes?.rating,
    hosts,
    cookieLive: offer.cookieLive ?? offer.cookie_live ?? offer.attributes?.cookieLive ?? offer.attributes?.cookie_live,
    cr: offer.cr ?? offer.attributes?.cr,
    confirm: offer.confirm ?? offer.attributes?.confirm,
    tag: offer.tag || offer.tags || offer.attributes?.tag || offer.attributes?.tags,
    directUrl,
    epnUrl: offerId ? `https://app.epn.bz/offers/${offerId}` : undefined,
  };
}

export function normalizeEpnOfferList(response: any): EpnOffer[] {
  const items = response?.data?.offers || response?.data?.items || response?.offers || response?.items || response?.data || [];
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map(normalizeEpnOffer);
}

function normalizeEpnGood(good: any): EpnGood {
  const directUrl = good.direct_url || good.url || good.link || good.original_link || '';
  return {
    id: String(good.id || good.good_id || good.offer_id || good.advertiser_id || ''),
    title: good.name || good.title || good.product_name || 'ePN товар',
    price: Number(good.price || good.price_total || good.sale_price || 0) || 0,
    currency: good.currency || good.currency_code || 'RUB',
    image: good.image || good.logo || good.images?.[0] || good.photo || '',
    directUrl,
    originalUrl: directUrl,
    affiliateUrl: good.affiliate_url || good.deeplink || directUrl,
    cashback: Number(good.cashback || good.commission || 0) || 0,
    cashbackPercent: Number(good.cashback_percent || good.commission_percent || 0) || 0,
    category: good.category || good.category_name || good.offer?.category?.name || '',
    offerId: String(good.offer_id || good.offer?.id || ''),
    marketplace: detectMarketplaceFromUrl(directUrl),
    offerStatus: good.offer?.status || good.status || '',
    status: good.status || '',
  };
}

function normalizeEpnGoodsList(response: any): EpnGood[] {
  const items = response?.data?.goods || response?.data?.items || response?.goods || response?.items || response?.data || [];
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map(normalizeEpnGood);
}

function extractEpnToken(value?: string) {
  if (!value) return '';
  const match = value.match(/\/o\/([a-zA-Z0-9]+)/) || value.match(/[?&](?:hash|token|deepLink)=([a-zA-Z0-9]+)/);
  return match?.[1] || '';
}

function normalizeEpnCreative(item: any): EpnCreative {
  const attributes = item?.attributes || item || {};
  const originalUrl = attributes.link || attributes.url || attributes.originalUrl || '';
  const affiliateUrl = attributes.code || attributes.deeplink || attributes.deeplinkUrl || attributes.affiliateUrl || '';
  const token = attributes.hash || attributes.token || extractEpnToken(affiliateUrl);
  const title = attributes.description || attributes.name || attributes.title || `ePN creative ${item?.id || token || ''}`.trim();
  const offerId = attributes.offer_id ?? attributes.offerId;
  const offerName = attributes.offer_type || attributes.offerName || attributes.offer_name;

  return {
    id: String(item?.id || attributes.id || token || originalUrl || affiliateUrl),
    title,
    originalUrl,
    affiliateUrl,
    deeplinkUrl: affiliateUrl,
    token: String(token || item?.id || attributes.id || ''),
    offerName,
    offerId: offerId !== undefined && offerId !== null ? String(offerId) : undefined,
    marketplace: detectMarketplaceFromProductUrl(originalUrl),
    createdAt: attributes.created_at || attributes.createdAt,
    type: attributes.type || item?.type || 'deeplink',
  };
}

function normalizeEpnCreativesList(response: any): EpnCreative[] {
  const items = response?.data?.items || response?.data || response?.items || response?.creatives || [];
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map(normalizeEpnCreative).filter((creative) => creative.originalUrl || creative.affiliateUrl);
}

export async function fetchEpnProductMetadata(
  affiliateUrl: string,
  token?: string
): Promise<Partial<Product> | null> {
  try {
    const metadata = await fetchPageMetadata(affiliateUrl);
    if (!metadata) {
      return null;
    }

    return {
      title: metadata.title || undefined,
      description: metadata.description || undefined,
      imageUrl: metadata.imageUrl || undefined,
      originalUrl: affiliateUrl,
      affiliateUrl,
      currency: 'RUB',
      marketplace: 'ePN',
      epnToken: token,
    };
  } catch (error) {
    console.error('Error fetching ePN metadata:', error);
    return null;
  }
}
