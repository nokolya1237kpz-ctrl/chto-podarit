import GiftSeoPage from '@/components/GiftSeoPage';
import { getGiftSeoProducts } from '@/lib/giftSeo';

export const metadata = {
  title: 'Популярные подарки',
  description: 'Популярные подарки, трендовые товары и идеи с маркетплейсов.',
  openGraph: {
    title: 'Популярные подарки',
    description: 'Популярные товары для подарков и сравнения цен.',
  },
};
export const dynamic = 'force-dynamic';

export default async function Page() {
  return (
    <GiftSeoPage
      title="Популярные подарки"
      description="Популярные товары и идеи подарков, которые подходят для рекламы, SEO и быстрых подборок."
      products={await getGiftSeoProducts({ trend: true })}
    />
  );
}
