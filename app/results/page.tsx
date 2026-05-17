import { getActiveProducts } from '@/lib/supabase';
import { mockProvider } from '@/lib/providers/mockProvider';
import { isSupabaseConfigured } from '@/lib/supabase';
import { matchProducts, getUniversalProducts } from '@/lib/productMatcher';
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

  // Get products from Supabase or fallback to mock
  let products;
  if (isSupabaseConfigured()) {
    products = await getActiveProducts();
    // Fall back to mock if empty
    if (products.length === 0) {
      products = await mockProvider.searchProducts({ limit: 100 });
    }
  } else {
    products = await mockProvider.searchProducts({ limit: 100 });
  }

  // Parse search params
  const recipient = getSearchParam(resolvedSearchParams.recipient);
  const budget = getSearchParam(resolvedSearchParams.budget);
  const occasion = getSearchParam(resolvedSearchParams.occasion);
  const interest = getSearchParam(resolvedSearchParams.interest);
  const giftType = getSearchParam(resolvedSearchParams.giftType);

  // Match products based on filters
  let matched;
  if (recipient || budget || interest || occasion || giftType) {
    matched = matchProducts(products, {
      recipient: recipient || undefined,
      budget: budget || undefined,
      interests: interest ? [interest] : undefined,
      occasions: occasion ? [occasion] : undefined,
      giftTypes: giftType ? [giftType] : undefined,
    });
  } else {
    matched = getUniversalProducts(products);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.16),transparent_0%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.1),transparent_25%),linear-gradient(180deg,#05060f,#090d1a)] text-white overflow-hidden">
      <Header />
      <main className="pt-24 px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-9">
          <div className="premium-card rounded-[2.5rem] border-white/10 bg-slate-950/80 p-8 sm:p-10 shadow-[0_40px_120px_rgba(15,23,42,0.45)] backdrop-blur-3xl">
            <h1 className="text-3xl font-bold text-white mb-2">Ваши идеи подарков</h1>
            <p className="mt-3 text-sm text-slate-400">Мы подобрали <span className="text-purple-300 font-semibold">{matched.length} лучших вариантов</span> под ваши ответы.</p>
            <div className="mt-7 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.26em]">
              {recipient ? <span className="rounded-full bg-gradient-to-r from-purple-500/16 to-pink-500/14 border border-white/12 px-4 py-2.5 text-slate-300 group-hover:text-slate-100 transition">👤 {recipient}</span> : null}
              {budget ? <span className="rounded-full bg-gradient-to-r from-purple-500/16 to-pink-500/14 border border-white/12 px-4 py-2.5 text-slate-300 group-hover:text-slate-100 transition">💳 {budget}</span> : null}
              {occasion ? <span className="rounded-full bg-gradient-to-r from-purple-500/16 to-pink-500/14 border border-white/12 px-4 py-2.5 text-slate-300 group-hover:text-slate-100 transition">🎉 {occasion}</span> : null}
              {interest ? <span className="rounded-full bg-gradient-to-r from-purple-500/16 to-pink-500/14 border border-white/12 px-4 py-2.5 text-slate-300 group-hover:text-slate-100 transition">✨ {interest}</span> : null}
              {giftType ? <span className="rounded-full bg-gradient-to-r from-purple-500/16 to-pink-500/14 border border-white/12 px-4 py-2.5 text-slate-300 group-hover:text-slate-100 transition">💎 {giftType}</span> : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-7 xl:grid-cols-2">
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
