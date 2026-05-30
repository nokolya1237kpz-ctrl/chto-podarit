import GiftSeoPage from '@/components/GiftSeoPage';
import { getGiftSeoProducts } from '@/lib/giftSeo';

export const metadata = { title: 'Подарки до 3000 рублей', description: 'Идеи подарков до 3000 ₽.', alternates: { canonical: '/gifts/by-budget/do-3000' } };
export const dynamic = 'force-dynamic';

export default async function Page() {
  return <GiftSeoPage title="Подарки до 3000 ₽" description="Подборка подарков до 3000 рублей для разных получателей." canonical="/gifts/by-budget/do-3000" products={await getGiftSeoProducts({ budget: 'до 3000 ₽' })} />;
}
