import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GiftCard from '@/components/GiftCard';
import { getActiveProducts, isSupabaseConfigured } from '@/lib/supabase';

export const metadata = {
  title: 'Трендовые подарки и viral товары',
  description: 'TikTok, WB hit, Ozon hit, viral и небанальные товары для подарков.',
};

export default async function TrendsPage() {
  const products = isSupabaseConfigured() ? await getActiveProducts() : [];
  const trends = products
    .filter((product) => `${product.tags?.join(' ')} ${product.title}`.toLowerCase().match(/trend|viral|hit|tiktok|хит|популяр/))
    .concat(products.slice(0, 12))
    .slice(0, 24);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-28">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-pink-300">Trends</p>
          <h1 className="mt-3 text-4xl font-bold">Трендовые товары</h1>
          <p className="mt-3 max-w-2xl text-slate-400">Viral, WB hit, Ozon hit и небанальные идеи, которые можно быстро добавить в подборку.</p>
        </section>
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {trends.map((product) => <GiftCard key={product.id} gift={product} />)}
        </section>
        {trends.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-white/10 bg-slate-900/70 p-8 text-center">
            <h2 className="text-xl font-semibold">Раздел в разработке</h2>
            <p className="mt-2 text-sm text-slate-400">Тренды появятся после первых импортов, кликов и ручной разметки товаров.</p>
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
