import React from 'react';
import { getActiveProducts } from '@/lib/supabase';
import SafeProductImage from '@/components/SafeProductImage';
import Link from 'next/link';

export default async function VkResults({ searchParams }: { searchParams: any }) {
  const products = await getActiveProducts();

  // Optionally filter by query params from quiz
  // For simplicity, show active products

  return (
    <div className="vk-root">
      <main style={{ maxWidth: 440, margin: '0 auto', padding: 8 }}>
        <h2 className="text-xl font-semibold text-white mb-4">Идеи подарков</h2>
        <div className="space-y-4">
          {products.map((p) => (
            <div key={p.id} className="vk-result-card p-3">
              <div className="rounded-lg overflow-hidden mb-3">
                <SafeProductImage imageUrl={p.imageUrl} alt={p.title} wrapperClassName="h-40 w-full bg-white" className="h-full w-full object-contain" />
              </div>
              <div className="text-white font-semibold mb-1">{p.title}</div>
              <div className="text-sm text-slate-300 mb-3">{Math.round(p.price).toLocaleString('ru-RU')} ₽ • {p.wowRating}/10</div>
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
