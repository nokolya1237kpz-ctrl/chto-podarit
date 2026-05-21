import GiftSeoPage from '@/components/GiftSeoPage';
import { getGiftSeoProducts } from '@/lib/giftSeo';

export const metadata = {
  title: 'Trending gifts: популярные подарки',
  description: 'Популярные подарки, трендовые товары и идеи с маркетплейсов.',
  openGraph: {
    title: 'Trending gifts',
    description: 'Популярные товары для подарков и сравнения цен.',
  },
};

export default async function Page() {
  return (
    <GiftSeoPage
      title="Trending gifts"
      description="Популярные товары и идеи подарков, которые подходят для рекламы, SEO и быстрых подборок."
      products={await getGiftSeoProducts({ trend: true })}
    />
  );
}
