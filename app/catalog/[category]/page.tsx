import type { Metadata } from 'next';
import CatalogPage from '../page';
import { PUBLIC_CATEGORIES } from '@entities/product/lib/categoryMapper';
import { getActiveProducts, isSupabaseConfigured } from '@/lib/supabase';
import { ANALYTICS_EVENTS, trackEvent } from '@server/analytics';
import { withTimeout } from '@lib/utils/timeout';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const found = PUBLIC_CATEGORIES.find((item) => item.slug === category);
  return {
    title: found ? `${found.label} — каталог подарков` : 'Каталог подарков',
    description: found ? `Активные товары в категории ${found.label}: цены, карточки и ссылки на покупку.` : 'Каталог активных товаров.',
  };
}

export default async function CategoryCatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category } = await params;
  const resolvedSearchParams = await searchParams;
  const products = isSupabaseConfigured() ? await withTimeout(getActiveProducts(), 3000, []) : [];
  const productsCount = products.filter((product) => product.categorySlug === category).length;
  await trackEvent(ANALYTICS_EVENTS.categoryView, {
    category,
    metadata: {
      category,
      products_count: productsCount,
    },
  });
  return <CatalogPage searchParams={Promise.resolve({ ...resolvedSearchParams, category })} />;
}
