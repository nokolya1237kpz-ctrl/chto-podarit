import GiftSeoPage from '@/components/GiftSeoPage';
import { getGiftSeoProducts } from '@/lib/giftSeo';

export const metadata = { title: 'Подарки маме', description: 'Идеи подарков маме для дома, красоты и заботы.' };

export default async function Page() {
  return <GiftSeoPage title="Подарки маме" description="Тёплые и практичные идеи подарков маме." products={await getGiftSeoProducts({ recipient: 'mom' })} />;
}
