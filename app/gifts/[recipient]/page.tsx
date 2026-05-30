import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GiftSeoPage from '@/components/GiftSeoPage';
import { getGiftSeoProducts } from '@/lib/giftSeo';

const pages: Record<string, { recipient: string; title: string; description: string }> = {
  'for-colleague': { recipient: 'colleague', title: 'Подарки коллеге', description: 'Идеи нейтральных и уместных подарков коллеге: полезные аксессуары, книги, товары для офиса, сладости и универсальные варианты с ценами и ссылками на продавцов.' },
  'for-child': { recipient: 'child', title: 'Подарки ребёнку', description: 'Подборка подарков ребёнку: игрушки, книги, творческие наборы, спортивные товары и детские гаджеты. В выдаче исключены взрослые и неподходящие категории.' },
};

export async function generateMetadata({ params }: { params: Promise<{ recipient: string }> }): Promise<Metadata> {
  const { recipient } = await params;
  const page = pages[recipient];
  if (!page) return {};
  return { title: `${page.title} — идеи с ценами`, description: page.description, alternates: { canonical: `/gifts/${recipient}` } };
}

export default async function Page({ params }: { params: Promise<{ recipient: string }> }) {
  const { recipient } = await params;
  const page = pages[recipient];
  if (!page) notFound();
  return <GiftSeoPage {...page} canonical={`/gifts/${recipient}`} products={await getGiftSeoProducts({ recipient: page.recipient })} />;
}
