import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getActiveProducts, isSupabaseConfigured } from '@/lib/supabase';
import { getProductFinalUrl } from '@/lib/affiliate';

export const metadata = {
  title: 'Автотовары и автоаксессуары',
  description: 'Поиск автоаксессуаров, OEM, VIN, брендов и товаров для авто.',
};

export default async function AutoPartsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const q = (params.q || '').toLowerCase();
  const products = isSupabaseConfigured() ? await getActiveProducts() : [];
  const autoProducts = products
    .filter((product) => `${product.title} ${product.description || ''} ${product.tags?.join(' ')}`.toLowerCase().includes('авто') || `${product.title} ${product.description || ''}`.toLowerCase().includes(q))
    .sort((a, b) => a.price - b.price);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-28">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Auto parts</p>
          <h1 className="mt-3 text-4xl font-bold">Автотовары и аксессуары</h1>
          <form className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
            <input name="q" defaultValue={params.q || ''} placeholder="article, OEM, VIN, бренд, модель авто" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" />
            <button className="rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950">Найти</button>
          </form>
        </section>
        <section className="mt-8 grid gap-4">
          {autoProducts.map((product) => (
            <article key={product.id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-cyan-100">cheapest first</span>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">{product.marketplace}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold">{product.title}</h2>
                  <p className="mt-2 text-sm text-slate-400">Оригинал / аналоги / быстрая доставка уточняются у продавца.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold">{Math.round(product.price).toLocaleString('ru-RU')} ₽</div>
                  <a href={getProductFinalUrl(product)} target="_blank" rel="noopener noreferrer" className="rounded-full bg-purple-600 px-5 py-3 text-sm font-semibold">К товару</a>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
