import GiftSeoPage from '@/components/GiftSeoPage';
import { getGiftSeoProducts } from '@/lib/giftSeo';

export const metadata = { title: 'Трендовые подарки', description: 'Viral и трендовые идеи подарков.' };

export default async function Page() {
  return <GiftSeoPage title="Трендовые подарки" description="Товары, которые хорошо подходят для рекламы, SEO и быстрых подборок." products={await getGiftSeoProducts({ trend: true })} />;
}
