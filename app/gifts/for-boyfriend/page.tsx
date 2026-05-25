import GiftSeoPage from '@/components/GiftSeoPage';
import { getGiftSeoProducts } from '@/lib/giftSeo';

export const metadata = { title: 'Подарки парню', description: 'Идеи подарков парню с ценами и ссылками.' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  return <GiftSeoPage title="Подарки парню" description="Гаджеты, спорт, аксессуары и полезные идеи для парня." products={await getGiftSeoProducts({ recipient: 'boyfriend' })} />;
}
