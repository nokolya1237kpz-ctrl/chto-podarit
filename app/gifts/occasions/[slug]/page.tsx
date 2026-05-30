import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GiftSeoPage from '@/components/GiftSeoPage';
import { getGiftSeoProducts } from '@/lib/giftSeo';

const pages: Record<string, { occasion: string; title: string; description: string }> = {
  '8-marta': { occasion: '8 марта', title: 'Подарки на 8 марта', description: 'Идеи подарков на 8 марта: косметика, парфюм, украшения, женские аксессуары, сладости и товары для уюта. Алгоритм исключает нерелевантные мужские и автомобильные категории.' },
  'den-rozhdeniya': { occasion: 'день рождения', title: 'Подарки на день рождения', description: 'Подборка подарков на день рождения для близких, друзей и коллег. Выбирайте товары по бюджету и интересам, сравнивайте цены и переходите к продавцам.' },
  'noviy-god': { occasion: 'новый год', title: 'Подарки на Новый год', description: 'Новогодние идеи подарков с ценами и рейтингом: универсальные наборы, товары для дома, гаджеты, книги и приятные аксессуары для близких.' },
  '14-fevralya': { occasion: '14 февраля', title: 'Подарки на 14 февраля', description: 'Идеи подарков на 14 февраля: романтичные аксессуары, сладости, парфюм, украшения и товары для уютного вечера. Подборка помогает быстро найти уместный вариант.' },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) return {};
  return { title: `${page.title} — идеи с ценами`, description: page.description, alternates: { canonical: `/gifts/occasions/${slug}` } };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  return <GiftSeoPage title={page.title} description={page.description} canonical={`/gifts/occasions/${slug}`} products={await getGiftSeoProducts({ occasion: page.occasion, recipient: slug === '8-marta' || slug === '14-fevralya' ? 'girlfriend' : undefined })} />;
}
