import type { MetadataRoute } from 'next';
import { getActiveProducts, isSupabaseConfigured } from '@/lib/supabase';
import { PUBLIC_CATEGORIES } from '@entities/product/lib/categoryMapper';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xn----8sba3adk3a1a.xn--p1ai';
  const products = isSupabaseConfigured() ? await getActiveProducts() : [];
  const tags = Array.from(new Set(products.flatMap((product) => product.tags || []).filter(Boolean))).slice(0, 100);
  const giftPages = [
    '/gifts/for-girlfriend', '/gifts/for-boyfriend', '/gifts/for-mom', '/gifts/for-dad', '/gifts/for-colleague', '/gifts/for-child',
    '/gifts/by-budget/do-1000', '/gifts/by-budget/do-3000', '/gifts/by-budget/do-5000', '/gifts/by-budget/do-10000',
    '/gifts/occasions/8-marta', '/gifts/occasions/den-rozhdeniya', '/gifts/occasions/noviy-god', '/gifts/occasions/14-fevralya',
  ];
  const comparePages = ['/compare/iphone-15', '/compare/airpods', '/compare/naushniki-jbl', '/compare/dyson'];

  return [
    '',
    '/quiz',
    '/results',
    '/catalog',
    ...PUBLIC_CATEGORIES.map((category) => `/catalog/${category.slug}`),
    '/compare',
    ...giftPages,
    ...comparePages,
    ...tags.map((tag) => `/compare?q=${encodeURIComponent(tag)}`),
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: path === '' ? 1 : 0.7,
  }));
}
