import GiftSeoPage from '@/components/GiftSeoPage';
import { getGiftSeoProducts } from '@/lib/giftSeo';

export const metadata = {
  title: 'Подарки из TikTok: трендовые идеи',
  description: 'Подборка viral и TikTok-inspired товаров для подарков.',
  openGraph: {
    title: 'Подарки из TikTok',
    description: 'Трендовые товары и небанальные идеи подарков.',
  },
};

export default async function Page() {
  return (
    <GiftSeoPage
      title="Подарки из TikTok"
      description="Трендовые товары, viral-находки и идеи, которые проще быстро сравнить по цене."
      products={await getGiftSeoProducts({ trend: true })}
    />
  );
}
