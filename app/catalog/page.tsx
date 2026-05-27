import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GiftCard from '@/components/GiftCard';
import { getActiveProducts, isSupabaseConfigured } from '@/lib/supabase';
import { PUBLIC_CATEGORIES, getProductCategory } from '@entities/product/lib/categoryMapper';
import type { Product } from '@/types/product';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

function filterProducts(products: Product[], params: Record<string, string | string[] | undefined>) {
  const query = getParam(params.q).toLowerCase();
  const category = getParam(params.category);
  const source = getParam(params.source);
  const priceTo = Number(getParam(params.priceTo) || 0);
  const sort = getParam(params.sort) || 'new';

  let result = products.filter((product) => product.status === 'active' && product.isActive && product.title && product.price > 0 && product.imageUrl);

  if (query) {
    result = result.filter((product) => [
      product.title,
      product.description,
      product.categoryLabel,
      product.externalProductId,
      ...(product.tags || []),
    ].filter(Boolean).join(' ').toLowerCase().includes(query));
  }

  if (category) result = result.filter((product) => getProductCategory(product).slug === category);
  if (source) result = result.filter((product) => product.sourceProvider === source || product.marketplace === source);
  if (priceTo > 0) result = result.filter((product) => product.price <= priceTo);

  return result.sort((a, b) => {
    if (sort === 'price_asc') return a.price - b.price;
    if (sort === 'price_desc') return b.price - a.price;
    if (sort === 'popular') return (b.wowRating || 0) - (a.wowRating || 0);
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const products = isSupabaseConfigured() ? await getActiveProducts() : [];
  const filtered = filterProducts(products, params);
  const sources = Array.from(new Set(products.map((product) => product.sourceProvider || product.marketplace).filter(Boolean)));

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#05060f,#0b1020)] text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/82 p-6 shadow-[0_40px_120px_rgba(15,23,42,0.35)] backdrop-blur-2xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-300">Каталог</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black text-white sm:text-5xl">Все товары</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Активные товары из Supabase: Sadovod, фиды, ручной импорт, ePN, Admitad, Ozon и Wildberries.</p>
            </div>
            <a href="/quiz" className="inline-flex rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-5 py-3 text-sm font-semibold text-white">Подобрать подарок</a>
          </div>

          <form className="mt-6 grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]">
            <input name="q" defaultValue={getParam(params.q)} placeholder="Поиск по товарам" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-purple-300/60" />
            <select name="category" defaultValue={getParam(params.category)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm">
              <option value="">Все категории</option>
              {PUBLIC_CATEGORIES.map((category) => <option key={category.slug} value={category.slug}>{category.label}</option>)}
            </select>
            <select name="source" defaultValue={getParam(params.source)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm">
              <option value="">Все источники</option>
              {sources.map((source) => <option key={source} value={source}>{source}</option>)}
            </select>
            <input name="priceTo" defaultValue={getParam(params.priceTo)} placeholder="Цена до" inputMode="numeric" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-purple-300/60" />
            <select name="sort" defaultValue={getParam(params.sort) || 'new'} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm">
              <option value="new">Новые</option>
              <option value="price_asc">Дешевле</option>
              <option value="price_desc">Дороже</option>
              <option value="popular">Популярные</option>
            </select>
            <button className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950">Показать</button>
          </form>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PUBLIC_CATEGORIES.slice(0, 10).map((category) => {
            const count = products.filter((product) => getProductCategory(product).slug === category.slug).length;
            return (
              <a key={category.slug} href={`/catalog/${category.slug}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-purple-300/40 hover:bg-white/8">
                <div className="text-sm font-semibold text-white">{category.label}</div>
                <div className="mt-2 text-xs text-slate-400">{count} товаров</div>
              </a>
            );
          })}
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Найдено {filtered.length}</h2>
          </div>
          {filtered.length ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {filtered.map((product) => <GiftCard key={product.id} gift={product} />)}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 text-center">
              <h2 className="text-xl font-semibold">Нет результатов</h2>
              <p className="mt-2 text-sm text-slate-400">Попробуйте изменить запрос, категорию или цену.</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: filtered.slice(0, 20).map((product, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'Product',
                name: product.title,
                image: product.imageUrl,
                offers: { '@type': 'Offer', price: product.price, priceCurrency: product.currency || 'RUB' },
              },
            })),
          }),
        }}
      />
    </div>
  );
}
