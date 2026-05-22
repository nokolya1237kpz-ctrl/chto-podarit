"use client";
import React from 'react';
import type { Product } from '@/types/product';
import { getProductFinalUrl } from '@/lib/affiliate';
import SafeProductImage from '@/components/SafeProductImage';

export default function GiftCard({ gift }: { gift: Product }) {
  const [copied, setCopied] = React.useState(false);
  const productUrl = getProductFinalUrl(gift);
  const hasProductUrl = Boolean(productUrl);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${gift.title} — ${gift.description || ''}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // noop
    }
  };

  const riskColor = gift.riskLevel === 'low'
    ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/20 group-hover:border-emerald-500/30'
    : gift.riskLevel === 'medium'
    ? 'bg-amber-500/15 text-amber-200 border-amber-500/20 group-hover:border-amber-500/30'
    : 'bg-rose-500/15 text-rose-200 border-rose-500/20 group-hover:border-rose-500/30';

  return (
    <article className="premium-card overflow-hidden rounded-[2rem] bg-slate-950/95 shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
      <SafeProductImage
        imageUrl={gift.imageUrl}
        alt={gift.title || 'Товар'}
        wrapperClassName="relative flex items-center justify-center h-80 w-full overflow-hidden bg-white"
        className="h-full w-full object-contain"
      />

      <div className="p-6 flex flex-col gap-5">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{gift.marketplace || 'Маркетплейс'}</p>
          <h3 className="line-clamp-2 text-2xl font-semibold text-white">{gift.title || 'Товар без названия'}</h3>
          <p className="line-clamp-2 text-sm leading-6 text-slate-400">{gift.description || 'Описание появится после заполнения.'}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="rounded-[1.75rem] bg-gradient-to-br from-purple-500/15 to-pink-500/15 border border-white/10 px-5 py-4 text-center text-white shadow-[0_12px_40px_rgba(124,58,237,0.15)] transition">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Цена</p>
            <p className="mt-2 text-2xl font-bold text-white">{Math.round(gift.price).toLocaleString('ru-RU')} ₽</p>
            {gift.oldPrice && (
              <p className="mt-1 text-xs text-slate-400 line-through">{Math.round(gift.oldPrice).toLocaleString('ru-RU')} ₽</p>
            )}
          </div>

          <div className="rounded-[1.75rem] bg-gradient-to-br from-purple-500/15 to-pink-500/15 border border-white/10 px-5 py-4 text-center text-slate-200 shadow-[0_12px_40px_rgba(124,58,237,0.12)] transition">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Вау рейтинг</p>
            <p className="mt-2 text-lg font-bold text-white">{gift.wowRating}/10</p>
          </div>

          <div className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-center border transition ${riskColor}`}>
            {gift.riskLevel}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 sm:flex-row">
          {hasProductUrl ? (
            <a
              href={productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_80px_rgba(124,58,237,0.32)] transition hover:brightness-110 hover:shadow-[0_28px_120px_rgba(124,58,237,0.4)]"
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
            onClick={copy}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-white/12 bg-white/5 px-6 py-3.5 text-sm font-medium text-slate-100 transition hover:bg-white/8 hover:border-white/16 hover:text-white backdrop-blur-sm"
          >
            {copied ? 'Скопировано' : 'Скопировать'}
          </button>
        </div>
      </div>
    </article>
  );
}
