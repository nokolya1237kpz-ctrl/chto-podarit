import GiftSeoPage from '@/components/GiftSeoPage';
import { getGiftSeoProducts } from '@/lib/giftSeo';

export const metadata = { title: 'Подарки девушке', description: 'Идеи подарков девушке с ценами, рейтингом и ссылками.' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  return <GiftSeoPage title="Подарки девушке" description="Подборка товаров для девушки под разные поводы и бюджеты." products={await getGiftSeoProducts({ recipient: 'girlfriend' })} />;
}
