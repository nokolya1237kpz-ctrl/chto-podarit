import type { MetadataRoute } from 'next';
import { getActiveProducts, isSupabaseConfigured } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xn----8sba3adk3a1a.xn--p1ai';
  const products = isSupabaseConfigured() ? await getActiveProducts() : [];
  const tags = Array.from(new Set(products.flatMap((product) => product.tags || []).filter(Boolean))).slice(0, 100);

  return [
    '',
    '/quiz',
    '/results',
    '/compare',
    ...tags.map((tag) => `/compare?q=${encodeURIComponent(tag)}`),
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: path === '' ? 1 : 0.7,
  }));
}
