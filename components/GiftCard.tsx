"use client";
import React from 'react';
import type { Product } from '@/types/product';
import { getProductFinalUrl } from '@/lib/affiliate';

export default function GiftCard({ gift }: { gift: Product }) {
  const [copied, setCopied] = React.useState(false);
  const productUrl = getProductFinalUrl(gift);
  
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
    <article className="premium-card rounded-[2rem] overflow-hidden bg-slate-950/95 group">
      <div className="relative h-60 overflow-hidden bg-slate-900/80">
        {gift.imageUrl ? (
          <img
            src={gift.imageUrl}
            alt={gift.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-slate-400">
            <div className="text-center px-4">
              <div className="mb-3 text-4xl">🛍️</div>
              <p className="text-sm font-semibold">Нет изображения</p>
            </div>
          </div>
        )}
      </div>
      <div className="p-7">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white group-hover:text-pink-200 transition">{gift.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400 group-hover:text-slate-300 transition">{gift.description}</p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {gift.recipients.length > 0 && (
              <span className="rounded-full bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-white/10 px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.24em] text-slate-300 group-hover:border-white/15 group-hover:text-slate-200 transition">
                {gift.recipients.join(', ')}
              </span>
            )}
            {gift.interests.length > 0 && (
              <span className="rounded-full bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-white/10 px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.24em] text-slate-300 group-hover:border-white/15 group-hover:text-slate-200 transition">
                {gift.interests.join(', ')}
              </span>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-56">
          <div className="rounded-[1.75rem] bg-gradient-to-br from-purple-500/15 to-pink-500/15 border border-white/10 px-5 py-4 text-center text-white shadow-[0_12px_40px_rgba(124,58,237,0.15)] group-hover:shadow-[0_16px_60px_rgba(124,58,237,0.25)] group-hover:border-white/15 transition">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400 group-hover:text-slate-300 transition">Цена</p>
            <p className="mt-2 text-2xl font-bold text-white">{Math.round(gift.price).toLocaleString('ru-RU')} ₽</p>
            {gift.oldPrice && (
              <p className="mt-1 text-xs text-slate-400 line-through">{Math.round(gift.oldPrice).toLocaleString('ru-RU')} ₽</p>
            )}
          </div>

          <div className="rounded-[1.75rem] bg-gradient-to-br from-purple-500/15 to-pink-500/15 border border-white/10 px-5 py-4 text-center text-slate-200 shadow-[0_12px_40px_rgba(124,58,237,0.12)] group-hover:shadow-[0_16px_60px_rgba(124,58,237,0.2)] group-hover:border-white/15 transition">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400 group-hover:text-slate-300 transition">Вау рейтинг</p>
            <p className="mt-2 text-lg font-bold text-white">{gift.wowRating}/10</p>
          </div>

          <div className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-center border transition ${riskColor}`}>
            {gift.riskLevel}
          </div>
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <a
          href={productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_80px_rgba(124,58,237,0.32)] transition hover:brightness-110 hover:shadow-[0_28px_120px_rgba(124,58,237,0.4)]"
        >
          Посмотреть
        </a>

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
