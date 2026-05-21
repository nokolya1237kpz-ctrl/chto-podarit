type CacheEntry = {
  expiresAt: number;
  value: string;
};

const cache = new Map<string, CacheEntry>();

export function getCachedUrl(url: string) {
  const entry = cache.get(url);
  if (!entry || entry.expiresAt < Date.now()) {
    cache.delete(url);
    return null;
  }
  return entry.value;
}

export function setCachedUrl(url: string, value: string, ttlMs = 30 * 60 * 1000) {
  cache.set(url, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}
