import GiftSeoPage from '@/components/GiftSeoPage';
import { getGiftSeoProducts } from '@/lib/giftSeo';

export const metadata = { title: 'Подарки папе', description: 'Идеи подарков папе: техника, авто, дом и хобби.' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  return <GiftSeoPage title="Подарки папе" description="Полезные товары для папы: от автоаксессуаров до техники." products={await getGiftSeoProducts({ recipient: 'dad' })} />;
}
