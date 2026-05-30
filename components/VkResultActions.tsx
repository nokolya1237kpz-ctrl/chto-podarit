'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trackAnalyticsEvent } from '@/src/hooks/useTrackEvent';

type VkResultActionsProps = {
  productId: string;
  title: string;
  marketplace: string;
  category?: string;
  price: number;
  url?: string;
  resultCount?: number;
  viewTracker?: boolean;
};

export default function VkResultActions(props: VkResultActionsProps) {
  const [favorite, setFavorite] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (props.viewTracker) {
      trackAnalyticsEvent('vk_gift_result_view', { metadata: { results_count: props.resultCount || 0, source_page: '/vk/results' } });
    }
  }, [props.resultCount, props.viewTracker]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('favoriteProducts') || '[]') as string[];
    setFavorite(stored.includes(props.productId));
  }, [props.productId]);

  function trackClick() {
    trackAnalyticsEvent('vk_product_click', {
      productId: props.productId,
      category: props.category,
      marketplace: props.marketplace,
      metadata: { product_id: props.productId, price: props.price, source_page: '/vk/results' },
    });
  }

  async function copyLink() {
    if (!props.url) return;
    try {
      await navigator.clipboard.writeText(props.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function toggleFavorite() {
    const stored = JSON.parse(localStorage.getItem('favoriteProducts') || '[]') as string[];
    const next = stored.includes(props.productId) ? stored.filter((id) => id !== props.productId) : [props.productId, ...stored];
    localStorage.setItem('favoriteProducts', JSON.stringify(next));
    const added = next.includes(props.productId);
    setFavorite(added);
    trackAnalyticsEvent(added ? 'favorite_add' : 'favorite_remove', {
      productId: props.productId,
      category: props.category,
      marketplace: props.marketplace,
      metadata: { product_id: props.productId, source_page: '/vk/results' },
    });
  }

  return (
    <div className="grid gap-2">
      {props.url ? (
        <a onClick={trackClick} href={props.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-4 py-3 text-center text-sm font-semibold text-white">
          Посмотреть товар
        </a>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        {props.url ? <button type="button" onClick={copyLink} className="min-h-12 rounded-xl border border-white/10 bg-white/6 px-3 py-3 text-sm font-semibold text-slate-100">{copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}</button> : null}
        <button type="button" onClick={toggleFavorite} className="min-h-12 rounded-xl border border-white/10 bg-white/6 px-3 py-3 text-sm font-semibold text-slate-100">{favorite ? 'В избранном' : 'В избранное'}</button>
      </div>
      <Link href="/vk" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-purple-300/20 bg-purple-500/10 px-4 py-3 text-center text-sm font-semibold text-purple-100">
        Пройти подбор ещё раз
      </Link>
    </div>
  );
}
