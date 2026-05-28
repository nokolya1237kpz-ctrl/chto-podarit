import { getActiveProducts } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';
import { matchProducts } from '@/lib/productMatcher';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GiftCard from '@/components/GiftCard';
import ResultsTracker from '@/components/ResultsTracker';
import type { Product } from '@/types/product';
import { withTimeout } from '@lib/utils/timeout';
import { dedupeProducts } from '@entities/product/lib/dedupeProducts';

function getSearchParam(value: string | string[] | undefined) {
  if (!value) return '';
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;

  let products: Product[] = [];
  if (isSupabaseConfigured()) {
    products = await withTimeout(getActiveProducts(), 4000, []);
  }
  products = dedupeProducts(products);

  // Parse search params
  const recipient = getSearchParam(resolvedSearchParams.recipient);
  const budget = getSearchParam(resolvedSearchParams.budget);
  const occasion = getSearchParam(resolvedSearchParams.occasion);
  const interest = getSearchParam(resolvedSearchParams.interest);
  const giftType = getSearchParam(resolvedSearchParams.giftType);

  const hasFilters = Boolean(recipient || budget || interest || occasion || giftType);
  const filters = {
    recipient: recipient || undefined,
    budget: budget || undefined,
    interests: interest ? [interest] : undefined,
    occasions: occasion ? [occasion] : undefined,
    giftTypes: giftType ? [giftType] : undefined,
  };

  let matched = hasFilters ? matchProducts(products, filters) : products;
  const noMatchFallback = hasFilters && matched.length === 0;

  if (noMatchFallback) {
    matched = products.slice(0, 10);
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.16),transparent_0%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.1),transparent_25%),linear-gradient(180deg,#05060f,#090d1a)] text-white">
      <Header />
      <main className="w-full max-w-full overflow-x-hidden pt-20 sm:pt-24 px-3 sm:px-4 pb-20 sm:px-6 lg:px-8 box-border">
        <div className="mx-auto max-w-7xl w-full space-y-6 sm:space-y-9 box-border overflow-x-hidden">
          <div className="premium-card rounded-2xl sm:rounded-[2.5rem] border-white/10 bg-slate-950/80 p-4 sm:p-8 lg:p-10 shadow-[0_40px_120px_rgba(15,23,42,0.45)] backdrop-blur-3xl">
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Ваши идеи подарков</h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  {hasFilters
                    ? `Найдено ${matched.length} подходящих вариантов по вашему запросу.`
                    : `Показаны все товары (${products.length}).`}
                </p>
              </div>
              <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white/80">
                {hasFilters ? 'Сопоставленные товары' : 'Популярные идеи'}
              </div>
            </div>

            <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-slate-400">
              {noMatchFallback
                ? 'Подходящих товаров мало — попробуйте изменить бюджет или интересы.'
                : hasFilters
                ? 'Мы подобрали товары, соответствующие выбранным фильтрам.'
                : 'Здесь отображаются все активные товары из базы данных.'}
            </p>

            <div className="mt-4 sm:mt-7 flex flex-wrap gap-2 sm:gap-3 text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.26em]">
              {recipient ? <span className="rounded-full bg-gradient-to-r from-purple-500/16 to-pink-500/14 border border-white/12 px-3 sm:px-4 py-2 sm:py-2.5 text-slate-300 group-hover:text-slate-100 transition">👤 {recipient}</span> : null}
              {budget ? <span className="rounded-full bg-gradient-to-r from-purple-500/16 to-pink-500/14 border border-white/12 px-3 sm:px-4 py-2 sm:py-2.5 text-slate-300 group-hover:text-slate-100 transition">💳 {budget}</span> : null}
              {occasion ? <span className="rounded-full bg-gradient-to-r from-purple-500/16 to-pink-500/14 border border-white/12 px-3 sm:px-4 py-2 sm:py-2.5 text-slate-300 group-hover:text-slate-100 transition">🎉 {occasion}</span> : null}
              {interest ? <span className="rounded-full bg-gradient-to-r from-purple-500/16 to-pink-500/14 border border-white/12 px-3 sm:px-4 py-2 sm:py-2.5 text-slate-300 group-hover:text-slate-100 transition">✨ {interest}</span> : null}
              {giftType ? <span className="rounded-full bg-gradient-to-r from-purple-500/16 to-pink-500/14 border border-white/12 px-3 sm:px-4 py-2 sm:py-2.5 text-slate-300 group-hover:text-slate-100 transition">💎 {giftType}</span> : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-7 xl:grid-cols-2 w-full">
            {matched.map((product) => (
              <div key={product.id} className="space-y-3">
                <GiftCard gift={product} />
                {Array.isArray((product as any).matchReasons) && (product as any).matchReasons.length ? (
                  <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Почему подходит</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(product as any).matchReasons.map((reason: string) => (
                        <span key={reason} className="rounded-full bg-white/10 px-3 py-1 text-xs text-emerald-50">{reason}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          {matched.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 text-center text-slate-300">
              <h2 className="text-xl font-semibold text-white">Каталог пока пуст</h2>
              <p className="mt-2 text-sm text-slate-400">Добавьте товары в админке через импорт по ссылкам, файл или фид — после публикации подборки появятся здесь.</p>
            </div>
          ) : null}

          <ResultsTracker
            count={matched.length}
            params={{ recipient, budget, occasion, interest, giftType }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
