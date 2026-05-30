import type { Metadata } from 'next';
import GiftSeoPage from '@/components/GiftSeoPage';
import { getActiveProducts } from '@/lib/supabase';
import { withTimeout } from '@lib/utils/timeout';
import { searchLocalProducts } from '@features/product-comparison/lib/localProductSearch';

const slugMap: Record<string, string> = {
  'iphone-15': 'iphone 15',
  airpods: 'airpods',
  'naushniki-jbl': 'наушники jbl',
  dyson: 'dyson',
  naushniki: 'наушники',
  kosmetika: 'косметика',
  pomada: 'помада',
  multivarka: 'мультиварка',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const query = slugMap[slug] || slug.replace(/-/g, ' ');
  return {
    title: `Сравнить цены на ${query}`,
    description: `Предложения по запросу «${query}» из локального каталога. Сравните цены и перейдите к подходящему товару.`,
    alternates: { canonical: `/compare/${slug}` },
    openGraph: { title: `Сравнить цены на ${query}`, description: 'Найдите подходящий товар и сравните доступные предложения.' },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const query = slugMap[slug] || slug.replace(/-/g, ' ');
  const products = searchLocalProducts(await withTimeout(getActiveProducts(), 4000, []), query).slice(0, 24);
  return (
    <GiftSeoPage
      title={`Сравнить цены на ${query}`}
      description={`Собрали доступные предложения по запросу «${query}» из опубликованного каталога. Сравните цены, изучите карточки товаров и перейдите к продавцу. Если нужного предложения пока нет, воспользуйтесь поиском сравнения цен: каталог постепенно расширяется после импорта новых источников.`}
      canonical={`/compare/${slug}`}
      products={products}
    />
  );
}
