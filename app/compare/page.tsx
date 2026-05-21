import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getActiveProducts, isSupabaseConfigured } from '@/lib/supabase';
import { getProductFinalUrl } from '@/lib/affiliate';

export const metadata = {
  title: 'Сравнение цен на подарки и товары',
  description: 'Ищите товары, сравнивайте цены, маркетплейсы и переходите по партнёрским ссылкам.',
};

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ q?: string; marketplace?: string }> }) {
  const params = await searchParams;
  const q = (params.q || '').toLowerCase();
  const marketplace = params.marketplace || '';
  const products = isSupabaseConfigured() ? await getActiveProducts() : [];
  const filtered = products
    .filter((product) => !q || `${product.title} ${product.description || ''}`.toLowerCase().includes(q))
    .filter((product) => !marketplace || product.marketplace === marketplace)
    .sort((a, b) => a.price - b.price);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-28">
        <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-purple-300">Compare</p>
          <h1 className="mt-3 text-4xl font-bold">Сравнение цен</h1>
          <form className="mt-6 grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <input name="q" defaultValue={params.q || ''} placeholder="Название товара" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" />
            <select name="marketplace" defaultValue={marketplace} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3">
              <option value="">Все маркетплейсы</option>
              <option value="ozon">Ozon</option>
              <option value="wildberries">Wildberries</option>
              <option value="aliexpress">AliExpress</option>
            </select>
            <button className="rounded-2xl bg-purple-600 px-5 py-3 font-semibold">Найти</button>
          </form>
        </section>

        <section className="mt-8 grid gap-4">
          {filtered.map((product) => (
            <article key={product.id} className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/70 p-4 md:grid-cols-[120px_1fr_auto]">
              <div className="flex h-28 items-center justify-center rounded-2xl bg-white">
                {product.imageUrl ? <img src={product.imageUrl} alt={product.title} className="h-full w-full object-contain p-2" /> : null}
              </div>
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-cyan-100">{product.marketplace}</span>
                  <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-100">{product.wowRating}/10</span>
                </div>
                <h2 className="mt-3 text-lg font-semibold">{product.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-slate-400">{product.description}</p>
              </div>
              <div className="flex flex-col justify-center gap-3 md:items-end">
                <div className="text-2xl font-bold">{Math.round(product.price).toLocaleString('ru-RU')} ₽</div>
                <a href={getProductFinalUrl(product)} target="_blank" rel="noopener noreferrer" className="rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-5 py-3 text-sm font-semibold">
                  К товару
                </a>
              </div>
            </article>
          ))}
          {filtered.length === 0 ? <div className="rounded-3xl border border-white/10 p-8 text-center text-slate-400">Ничего не найдено</div> : null}
        </section>
      </main>
      <Footer />
    </div>
  );
}
