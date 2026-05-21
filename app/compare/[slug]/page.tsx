import { redirect } from 'next/navigation';

const slugMap: Record<string, string> = {
  naushniki: 'наушники',
  kosmetika: 'косметика',
  pomada: 'помада',
  multivarka: 'мультиварка',
  tiktok: 'tiktok тренд',
  gifts: 'подарок',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const query = slugMap[slug] || slug.replace(/-/g, ' ');
  return {
    title: `Сравнить цены: ${query}`,
    description: `Сравнение цен по источникам и маркетплейсам для запроса ${query}.`,
    openGraph: {
      title: `Сравнить цены: ${query}`,
      description: 'Найдите лучшую цену и партнёрские ссылки на товары.',
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const query = slugMap[slug] || slug.replace(/-/g, ' ');
  redirect(`/compare?q=${encodeURIComponent(query)}`);
}
