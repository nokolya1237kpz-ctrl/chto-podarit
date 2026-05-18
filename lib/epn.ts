import type { Product } from '@/types/product';
import { fetchPageMetadata } from '@/lib/imageMetadata';

interface EpnTokenCache {
  ssidToken?: string;
  ssidExpiresAt?: number;
  accessToken?: string;
  accessExpiresAt?: number;
  refreshToken?: string;
  refreshExpiresAt?: number;
}

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
}

export interface EpnOffer {
  id: string;
  name: string;
  logo?: string;
  status?: string;
  category?: string;
  commission?: number;
  allowed?: boolean;
  available?: boolean;
  directUrl?: string;
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

class EpnApiError extends Error {
  details?: any;
  constructor(message: string, details?: any) {
    super(message);
    this.details = details;
  }
}

const tokenCache: EpnTokenCache = {};

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

export async function getEpnSsidToken(): Promise<string> {
  const { clientId, clientSecret, oauthBaseUrl } = getEpnConfig();

  if (!clientId || !clientSecret) {
    throw new EpnApiError('Missing EPN_CLIENT_ID or EPN_CLIENT_SECRET');
  }

  if (tokenCache.ssidToken && tokenCache.ssidExpiresAt && tokenCache.ssidExpiresAt > Date.now()) {
    return tokenCache.ssidToken;
  }

  const url = `${oauthBaseUrl}/ssid?v=2&client_id=${encodeURIComponent(clientId)}`;
  const response = await fetch(url, { method: 'GET' });
  const bodyText = await response.text();
  let body: any = null;

  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = bodyText;
  }

  if (!response.ok) {
    throw new EpnApiError(formatEpnErrorMessage(body, response.status, response.statusText), body);
  }

  const token = body?.data?.attributes?.ssid_token || body?.ssid_token;
  if (!token) {
    throw new EpnApiError('Unable to parse ssid_token from ePN response', body);
  }

  tokenCache.ssidToken = token;
  tokenCache.ssidExpiresAt = Date.now() + 9 * 60 * 1000;
  return token;
}

export async function getEpnAccessToken(): Promise<string> {
  const { clientId, clientSecret, oauthBaseUrl } = getEpnConfig();
  if (!clientId || !clientSecret) {
    throw new EpnApiError('Missing EPN_CLIENT_ID or EPN_CLIENT_SECRET');
  }

  if (tokenCache.accessToken && tokenCache.accessExpiresAt && tokenCache.accessExpiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  const ssidToken = await getEpnSsidToken();
  const url = `${oauthBaseUrl}/token?v=2`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      ssid_token: ssidToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credential',
      check_ip: false,
    }),
  });

  const bodyText = await response.text();
  let body: any = null;

  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = bodyText;
  }

  if (!response.ok) {
    throw new EpnApiError(formatEpnErrorMessage(body, response.status, response.statusText), body);
  }

  const accessToken = body?.data?.attributes?.access_token || body?.access_token || body?.accessToken;
  const refreshToken = body?.data?.attributes?.refresh_token || body?.refresh_token || body?.refreshToken;
  const expiresIn = Number(body?.data?.attributes?.expires_in || body?.expires_in || 24 * 60 * 60);

  if (!accessToken) {
    throw new EpnApiError('Unable to parse access_token from ePN response', body);
  }

  tokenCache.accessToken = accessToken;
  tokenCache.accessExpiresAt = Date.now() + (expiresIn - 60) * 1000;

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

  if (response.status === 401 && options.retry !== false) {
    tokenCache.accessToken = undefined;
    return epnFetch(path, { ...options, retry: false });
  }

  if (!response.ok) {
    throw new EpnApiError(formatEpnErrorMessage(body, response.status, response.statusText), body);
  }

  return body;
}

export async function getEpnOffers(): Promise<EpnOffer[]> {
  const response = await epnFetch('/offers/list', {
    query: { v: '2', locale: 'ru', limit: 50 },
  });
  return normalizeEpnOfferList(response);
}

export async function searchEpnOffers(query: string, limit = 20): Promise<EpnOffer[]> {
  if (!query || query.trim().length === 0) {
    return getEpnOffers();
  }

  const response = await epnFetch('/offers/list', {
    query: { v: '2', locale: 'ru', q: query.trim(), limit },
  });
  return normalizeEpnOfferList(response);
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

export function mapEpnGoodToProduct(good: any) {
  const title = good.name || good.title || good.product_name || 'ePN товар';
  const price = Number(good.price || good.price_total || good.sale_price || 0) || 0;
  const currency = good.currency || good.currency_code || 'RUB';
  const image = good.image || good.logo || good.images?.[0] || good.photo || '';
  const directUrl = good.direct_url || good.url || good.link || good.original_link || '';
  const affiliateUrl = good.affiliate_url || good.deeplink || directUrl || '';
  const offerId = String(good.offer_id || good.offer?.id || good.offer_id || good.advertiser_id || '');
  const category = good.category || good.category_name || good.offer?.category?.name || '';
  const cashback = Number(good.cashback || good.commission || 0) || 0;
  const cashbackPercent = Number(good.cashback_percent || good.commission_percent || 0) || 0;
  const offerStatus = good.status || good.offer?.status || '';

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
    externalProductId: String(good.id || good.good_id || good.affiliate_id || ''),
    marketplace: detectMarketplaceFromUrl(directUrl),
    offerStatus,
    status: good.status || '',
  };
}

export interface GenerateEpnDeeplinkOptions {
  offerId?: string;
  placementId?: string;
}

export interface EpnDeeplinkResult {
  affiliateUrl: string;
  creativeId?: string;
  originalUrl: string;
  offerId?: string;
  placementId?: string;
}

function normalizeEpnDeeplinkBody(response: any) {
  const deeplink = response?.data?.attributes?.deeplink || response?.deeplink || response?.data?.attributes?.url || response?.url;
  const creativeId = response?.data?.id || response?.id || response?.creative_id || response?.data?.attributes?.id;

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
      url,
      client_id: process.env.EPN_CLIENT_ID,
    };

    if (options.offerId) {
      body.offer_id = options.offerId;
    }
    if (options.placementId) {
      body.placement_id = options.placementId;
    }

    const response = await epnFetch('/creatives', {
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
    throw new EpnApiError(message, details);
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

function normalizeEpnOffer(offer: any): EpnOffer {
  return {
    id: String(offer.id || offer.offer_id || offer.attributes?.id || ''),
    name: offer.name || offer.title || offer.attributes?.name || 'ePN оффер',
    logo: offer.logo || offer.image || offer.attributes?.logo || offer.attributes?.image,
    status: offer.status || offer.attributes?.status || offer.offer_state,
    category: offer.category || offer.category_name || offer.attributes?.category || offer.offer_category,
    commission: Number(offer.commission || offer.commission_rate || offer.attributes?.commission || 0) || 0,
    allowed: offer.allowed ?? offer.is_allowed ?? offer.attributes?.allowed,
    available: offer.available ?? offer.is_available ?? offer.attributes?.available,
    directUrl: offer.url || offer.link || offer.attributes?.url,
  };
}

function normalizeEpnOfferList(response: any): EpnOffer[] {
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
