import React from 'react';
import { getActiveProducts } from '@/lib/supabase';
import SafeProductImage from '@/components/SafeProductImage';
import { matchProducts } from '@/lib/productMatcher';
import { withTimeout } from '@lib/utils/timeout';
import { dedupeProducts } from '@entities/product/lib/dedupeProducts';

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (!value) return '';
  return Array.isArray(value) ? value[0] : value;
}

export default async function VkResults({ searchParams }: { searchParams: any }) {
  const resolvedSearchParams = await searchParams;
  const allProducts = dedupeProducts(await withTimeout(getActiveProducts(), 4000, []));

  const recipient = getParam(resolvedSearchParams, 'recipient');
  const budget = getParam(resolvedSearchParams, 'budget');
  const occasion = getParam(resolvedSearchParams, 'occasion');
  const interest = getParam(resolvedSearchParams, 'interest');
  const giftType = getParam(resolvedSearchParams, 'giftType');
  const hasFilters = Boolean(recipient || budget || occasion || interest || giftType);
  const products = hasFilters
    ? matchProducts(allProducts, {
        recipient: recipient || undefined,
        budget: budget || undefined,
        occasions: occasion ? [occasion] : undefined,
        interests: interest ? [interest] : undefined,
        giftTypes: giftType ? [giftType] : undefined,
      })
    : allProducts.slice(0, 20);

  return (
    <div className="vk-root">
      <main style={{ maxWidth: 440, margin: '0 auto', padding: 8 }}>
        <h2 className="text-xl font-semibold text-white mb-4">Идеи подарков</h2>
        {hasFilters && products.length === 0 ? (
          <div className="vk-result-card p-4 text-center text-slate-200">
            <div className="font-semibold text-white">Подходящих товаров мало</div>
            <p className="mt-2 text-sm text-slate-300">Попробуйте расширить бюджет или выбрать больше интересов.</p>
          </div>
        ) : null}
        <div className="space-y-4">
          {products.map((p) => (
            <div key={p.id} className="vk-result-card p-3">
              <div className="rounded-lg overflow-hidden mb-3">
                <SafeProductImage imageUrl={p.imageUrl} alt={p.title} wrapperClassName="h-40 w-full bg-white" className="h-full w-full object-contain" />
              </div>
              <div className="text-white font-semibold mb-1">{p.title}</div>
              <div className="text-sm text-slate-300 mb-3">{Math.round(p.price).toLocaleString('ru-RU')} ₽ • {p.wowRating}/10</div>
              {Array.isArray((p as any).matchReasons) && (p as any).matchReasons.length ? (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {(p as any).matchReasons.slice(0, 2).map((reason: string) => (
                    <span key={reason} className="rounded-full bg-emerald-400/15 px-2 py-1 text-[11px] text-emerald-100">{reason}</span>
                  ))}
                </div>
              ) : null}
              <div className="flex gap-2">
                <a
                  href={p.affiliateUrl || p.originalUrl || '#'}
                  target={p.affiliateUrl || p.originalUrl ? '_blank' : undefined}
                  rel={p.affiliateUrl || p.originalUrl ? 'noopener noreferrer' : undefined}
                  className="flex-1 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-4 py-2 text-sm font-semibold text-white"
                >
                  Посмотреть товар
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
