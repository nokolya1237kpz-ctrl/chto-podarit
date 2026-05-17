import { getActiveProducts } from '@/lib/supabase';
import { mockProvider } from '@/lib/providers/mockProvider';
import { isSupabaseConfigured } from '@/lib/supabase';
import { matchProducts } from '@/lib/productMatcher';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GiftCard from '@/components/GiftCard';
import ResultsTracker from '@/components/ResultsTracker';

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

  // Get products from Supabase or fallback to mock if not configured
  let products = [];
  if (isSupabaseConfigured()) {
    products = await getActiveProducts();
  } else {
    products = await mockProvider.searchProducts({ limit: 100 });
  }

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
                ? 'Пока точных совпадений нет — показываем популярные идеи.'
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
              <GiftCard key={product.id} gift={product} />
            ))}
          </div>

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
