import GiftSeoPage from '@/components/GiftSeoPage';
import { getGiftSeoProducts } from '@/lib/giftSeo';

export const metadata = { title: 'Подарки до 1000 рублей', description: 'Недорогие подарки до 1000 ₽.', alternates: { canonical: '/gifts/by-budget/do-1000' } };
export const dynamic = 'force-dynamic';

export default async function Page() {
  return <GiftSeoPage title="Подарки до 1000 ₽" description="Бюджетные идеи подарков с быстрым переходом к покупке." canonical="/gifts/by-budget/do-1000" products={await getGiftSeoProducts({ budget: 'до 1000 ₽' })} />;
}
