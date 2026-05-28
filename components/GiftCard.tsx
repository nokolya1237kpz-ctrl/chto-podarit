"use client";
import React from 'react';
import type { Product } from '@/types/product';
import { getProductFinalUrl } from '@/lib/affiliate';
import SafeProductImage from '@/components/SafeProductImage';
import { useTrackEvent } from '@/src/hooks/useTrackEvent';

export default function GiftCard({ gift }: { gift: Product }) {
  const trackEvent = useTrackEvent();
  const [copied, setCopied] = React.useState(false);
  const [favorite, setFavorite] = React.useState(false);
  const productUrl = getProductFinalUrl(gift);
  const hasProductUrl = Boolean(productUrl);
  const discountPercent = gift.oldPrice && gift.price ? Math.max(0, Math.round(((gift.oldPrice - gift.price) / gift.oldPrice) * 100)) : 0;
  const riskLabel = gift.riskLevel === 'low' ? 'низкий риск' : gift.riskLevel === 'medium' ? 'средний риск' : 'высокий риск';

  React.useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('favoriteProducts') || '[]') as string[];
    setFavorite(stored.includes(String(gift.id)));
    trackEvent('product_view', {
      productId: gift.id,
      category: gift.categorySlug || gift.categoryLabel,
      marketplace: gift.marketplace,
      metadata: {
        product_id: gift.id,
        category: gift.categoryLabel || gift.categorySlug,
        marketplace: gift.marketplace,
        source_page: window.location.pathname,
      },
    });
  }, [gift.id]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${gift.title} — ${gift.description || ''}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // noop
    }
  };

  const toggleFavorite = () => {
    const id = String(gift.id);
    const stored = JSON.parse(localStorage.getItem('favoriteProducts') || '[]') as string[];
    const next = stored.includes(id) ? stored.filter((item) => item !== id) : [id, ...stored].slice(0, 200);
    localStorage.setItem('favoriteProducts', JSON.stringify(next));
    setFavorite(next.includes(id));
    trackEvent(next.includes(id) ? 'favorite_add' : 'favorite_remove', {
      productId: gift.id,
      category: gift.categorySlug || gift.categoryLabel,
      marketplace: gift.marketplace,
      metadata: {
        product_id: gift.id,
        marketplace: gift.marketplace,
        category: gift.categoryLabel || gift.categorySlug,
      },
    });
  };

  const trackClick = () => {
    trackEvent('product_click', {
      productId: gift.id,
      category: gift.categorySlug || gift.categoryLabel,
      marketplace: gift.marketplace,
      metadata: {
        product_id: gift.id,
        marketplace: gift.marketplace,
        category: gift.categoryLabel || gift.categorySlug,
        source_page: window.location.pathname,
        price: gift.price,
      },
    });
  };

  const riskColor = gift.riskLevel === 'low'
    ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20 group-hover:border-emerald-500/30'
    : gift.riskLevel === 'medium'
    ? 'bg-amber-500/15 text-amber-200 border-amber-500/20 group-hover:border-amber-500/30'
    : 'bg-rose-500/15 text-rose-200 border-rose-500/20 group-hover:border-rose-500/30';

  return (
    <article className="premium-card group overflow-hidden rounded-[2rem] bg-slate-950/95 shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
      <SafeProductImage
        imageUrl={gift.imageUrl}
        alt={gift.title || 'Товар'}
        wrapperClassName="relative flex items-center justify-center h-80 w-full overflow-hidden bg-[linear-gradient(145deg,#ffffff,#eef2ff)]"
        className="h-full w-full object-contain p-4 transition duration-500 group-hover:scale-[1.03]"
      />

      <div className="p-6 flex flex-col gap-5">
        <div className="space-y-3">
          <p className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">{gift.marketplace || 'Маркетплейс'}</p>
          {gift.categoryLabel ? <p className="ml-2 inline-flex rounded-full border border-purple-300/15 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-100">{gift.categoryLabel}</p> : null}
          <h3 className="line-clamp-2 text-2xl font-semibold text-white">{gift.title || 'Товар без названия'}</h3>
          <p className="line-clamp-2 text-sm leading-6 text-slate-400">{gift.description || 'Описание появится после заполнения.'}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="rounded-[1.75rem] bg-gradient-to-br from-purple-500/18 to-pink-500/12 border border-white/10 px-5 py-4 text-center text-white shadow-[0_12px_40px_rgba(124,58,237,0.15)] transition">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Цена</p>
            <p className="mt-2 text-2xl font-bold text-white">{Math.round(gift.price).toLocaleString('ru-RU')} ₽</p>
            {gift.oldPrice && (
              <p className="mt-1 text-xs text-slate-400 line-through">{Math.round(gift.oldPrice).toLocaleString('ru-RU')} ₽</p>
            )}
            {discountPercent > 0 ? <p className="mt-2 inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-100">-{discountPercent}%</p> : null}
          </div>

          <div className="rounded-[1.75rem] bg-gradient-to-br from-cyan-400/12 to-purple-500/14 border border-white/10 px-5 py-4 text-center text-slate-200 shadow-[0_12px_40px_rgba(124,58,237,0.12)] transition">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Вау рейтинг</p>
            <p className="mt-2 text-lg font-bold text-white">{gift.wowRating}/10</p>
          </div>

          <div className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-center border transition ${riskColor}`}>
            {riskLabel}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 sm:flex-row">
          {hasProductUrl ? (
            <a
              href={productUrl}
              onClick={trackClick}
              target="_blank"
              rel="noopener noreferrer"
              className="premium-button inline-flex flex-1 items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold"
            >
              Посмотреть товар
            </a>
          ) : (
            <span className="inline-flex flex-1 items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-slate-400">
              Ссылка скоро
            </span>
          )}

          <button
            type="button"
            onClick={toggleFavorite}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-white/12 bg-white/5 px-6 py-3.5 text-sm font-medium text-slate-100 transition hover:bg-white/8 hover:border-white/16 hover:text-white backdrop-blur-sm"
          >
            {favorite ? 'В избранном' : 'В избранное'}
          </button>
        </div>
        <button
          type="button"
          onClick={copy}
          className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          {copied ? 'Скопировано' : 'Скопировать идею'}
        </button>
      </div>
    </article>
  );
}
