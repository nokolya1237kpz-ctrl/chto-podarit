"use client";
import type { Product } from '@/types/product';

interface HeroPreviewProps {
  products: Product[];
}

export default function HeroPreview({ products }: HeroPreviewProps) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950/88 p-6 shadow-[0_40px_120px_rgba(15,23,42,0.4),_inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/12 backdrop-blur-2xl inner-glow">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.24),transparent_50%)]" />
      <div className="relative grid gap-5">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-purple-300">
          <span>Идеи из подборки</span>
          <span className="rounded-full border border-white/12 bg-gradient-to-r from-purple-500/12 to-pink-500/10 px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur-sm">{products.length} товаров</span>
        </div>

        <div className="grid gap-3.5">
          {products.map((product) => (
            <div
              key={product.id}
              className="relative overflow-hidden rounded-[1.75rem] border border-white/11 bg-slate-950/92 shadow-[0_24px_90px_rgba(15,23,42,0.35),_inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition duration-300 hover:border-white/15 hover:bg-slate-950/96 hover:shadow-[0_32px_120px_rgba(124,58,237,0.28),_inset_0_1px_0_rgba(255,255,255,0.08)] group">
              <div className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-purple-500/6 via-transparent to-pink-500/6 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none" />
              <div className="overflow-hidden rounded-[1.75rem] bg-slate-900/80">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-slate-400">
                    <div className="text-center">
                      <div className="mb-3 text-3xl">🛍️</div>
                      <p className="text-sm font-medium">Товар без картинки</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative p-5">
                <h3 className="text-base font-semibold text-white leading-tight group-hover:text-pink-100 transition">{product.title || 'Новый товар'}</h3>
                <p className="mt-2 text-xs text-slate-400 leading-5 group-hover:text-slate-300 transition">{product.marketplace || 'Маркетплейс'}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xl font-bold text-white">{Math.round(product.price).toLocaleString('ru-RU')} ₽</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-400 transition">Цена</p>
                  </div>
                  <div className="rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-3 py-1.5 text-xs font-bold text-white shadow-[0_12px_40px_rgba(124,58,237,0.28)] transition">{product.wowRating}/10</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
