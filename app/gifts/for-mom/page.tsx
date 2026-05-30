import GiftSeoPage from '@/components/GiftSeoPage';
import { getGiftSeoProducts } from '@/lib/giftSeo';

export const metadata = { title: 'Подарки маме', description: 'Идеи подарков маме для дома, красоты и заботы.', alternates: { canonical: '/gifts/for-mom' } };
export const dynamic = 'force-dynamic';

export default async function Page() {
  return <GiftSeoPage title="Подарки маме" description="Тёплые и практичные идеи подарков маме." canonical="/gifts/for-mom" products={await getGiftSeoProducts({ recipient: 'mom' })} />;
}
