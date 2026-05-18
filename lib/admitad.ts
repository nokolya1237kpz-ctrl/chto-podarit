/**
 * Admitad API Client
 * Server-side only integration
 */

interface AdmitadTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface AdmitadProduct {
  id?: string | number;
  name?: string;
  description?: string;
  image?: string;
  url?: string;
  price?: number;
  currency?: string;
  marketplace?: string;
  category?: string;
  brand?: string;
  rating?: number;
  commissions?: any[];
  [key: string]: any;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

// In-memory cache for token (will be lost on server restart)
let tokenCache: CachedToken | null = null;

/**
 * Get Admitad access token with caching
 */
export interface AdmitadStatusResult {
  success: boolean;
  connected: boolean;
  hasClientId: boolean;
  hasClientSecret: boolean;
  tokenReceived: boolean;
  message: string;
  error?: string;
}

export async function getAdmitadAccessToken(): Promise<string> {
  // Check if cached token is still valid
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  const clientId = process.env.ADMITAD_CLIENT_ID;
  const clientSecret = process.env.ADMITAD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing ADMITAD_CLIENT_ID or ADMITAD_CLIENT_SECRET');
  }

  try {
    const response = await fetch('https://api.admitad.com/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'public',
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Admitad token error: ${response.status} ${response.statusText}`);
    }

    const data: AdmitadTokenResponse = await response.json();

    // Cache token, expire it 60 seconds before actual expiration
    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };

    return data.access_token;
  } catch (error) {
    console.error('Failed to get Admitad token:', error);
    throw error;
  }
}

export async function getAdmitadStatus(): Promise<AdmitadStatusResult> {
  const clientId = Boolean(process.env.ADMITAD_CLIENT_ID);
  const clientSecret = Boolean(process.env.ADMITAD_CLIENT_SECRET);

  if (!clientId || !clientSecret) {
    return {
      success: false,
      connected: false,
      hasClientId: clientId,
      hasClientSecret: clientSecret,
      tokenReceived: false,
      message: 'Параметры Admitad не настроены',
      error: 'Missing ADMITAD_CLIENT_ID or ADMITAD_CLIENT_SECRET',
    };
  }

  try {
    const token = await getAdmitadAccessToken();
    return {
      success: true,
      connected: true,
      hasClientId: true,
      hasClientSecret: true,
      tokenReceived: Boolean(token),
      message: 'Admitad API подключен',
    };
  } catch (error) {
    return {
      success: false,
      connected: false,
      hasClientId: clientId,
      hasClientSecret: clientSecret,
      tokenReceived: false,
      message: 'Не удалось получить токен Admitad',
      error: error instanceof Error ? error.message : 'Token error',
    };
  }
}

/**
 * Search products in Admitad
 */
export async function searchAdmitadProducts(query: string, limit: number = 20) {
  if (!query || query.trim().length < 2) {
    throw new Error('Query must be at least 2 characters');
  }

  try {
    const token = await getAdmitadAccessToken();

    const params = new URLSearchParams({
      q: query.trim(),
      limit: Math.min(limit, 100).toString(),
      offset: '0',
    });

    const response = await fetch(`https://api.admitad.com/products/?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Admitad search error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Admitad API returns results in different formats depending on query type
    const products = data.results || data.products || [];
    
    return products.map(mapAdmitadProductToInternalProduct);
  } catch (error) {
    console.error('Failed to search Admitad products:', error);
    throw error;
  }
}

/**
 * Map Admitad product format to internal Product format
 */
export function mapAdmitadProductToInternalProduct(admitadProduct: AdmitadProduct) {
  return {
    title: admitadProduct.name || 'Unknown Product',
    description: admitadProduct.description || '',
    imageUrl: admitadProduct.image || '',
    price: Number(admitadProduct.price) || 0,
    originalUrl: admitadProduct.url || '',
    affiliateUrl: admitadProduct.url || '', // Will be set from commission URLs if available
    marketplace: admitadProduct.marketplace || 'Admitad',
    categories: admitadProduct.category ? [admitadProduct.category] : [],
    brand: admitadProduct.brand || '',
    currency: admitadProduct.currency || 'RUB',
    wowRating: Number(admitadProduct.rating) || 5,
    sourceProvider: 'admitad',
    sourceProductId: String(admitadProduct.id || ''),
    status: 'active',
    isActive: true,
    rawData: {
      admitadId: admitadProduct.id,
      commissions: admitadProduct.commissions,
    },
  };
}

/**
 * Validate that a product can be imported
 */
export function validateAdmitadProduct(product: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!product.title || product.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!product.price || Number(product.price) <= 0) {
    errors.push('Valid price is required');
  }

  if (!product.imageUrl || product.imageUrl.trim().length === 0) {
    errors.push('Image URL is required');
  }

  if (!product.originalUrl || product.originalUrl.trim().length === 0) {
    errors.push('Product URL is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
