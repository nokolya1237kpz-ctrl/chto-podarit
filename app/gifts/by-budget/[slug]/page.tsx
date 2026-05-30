import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GiftSeoPage from '@/components/GiftSeoPage';
import { getGiftSeoProducts } from '@/lib/giftSeo';

const pages: Record<string, number> = { 'do-5000': 5000, 'do-10000': 10000 };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const maxPrice = pages[slug];
  if (!maxPrice) return {};
  return { title: `Подарки до ${maxPrice.toLocaleString('ru-RU')} ₽`, description: `Идеи подарков до ${maxPrice.toLocaleString('ru-RU')} рублей с ценами, рейтингом и ссылками на товары.`, alternates: { canonical: `/gifts/by-budget/${slug}` } };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const maxPrice = pages[slug];
  if (!maxPrice) notFound();
  return <GiftSeoPage title={`Подарки до ${maxPrice.toLocaleString('ru-RU')} ₽`} description={`Подборка идей подарков стоимостью до ${maxPrice.toLocaleString('ru-RU')} рублей. Сравнивайте варианты и переходите к подходящим товарам.`} canonical={`/gifts/by-budget/${slug}`} products={await getGiftSeoProducts({ maxPrice })} />;
}
