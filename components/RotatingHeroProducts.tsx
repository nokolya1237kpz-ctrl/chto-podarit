"use client";

import { useEffect, useMemo, useState } from 'react';
import SafeProductImage from '@/components/SafeProductImage';
import type { Product } from '@/types/product';
import { getProductFinalUrl } from '@/lib/affiliate';

interface RotatingHeroProductsProps {
  products: Product[];
}

function pickProducts(products: Product[], count = 2) {
  if (products.length <= count) return products;
  const shuffled = [...products].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function formatPrice(product?: Product) {
  if (!product || !product.price) return 'Цена уточняется';
  return `${Math.round(product.price).toLocaleString('ru-RU')} ₽`;
}

export default function RotatingHeroProducts({ products }: RotatingHeroProductsProps) {
  const activeProducts = useMemo(() => products.filter((product) => product.status === 'active' && product.isActive), [products]);
  const [visibleProducts, setVisibleProducts] = useState<Product[]>(() => activeProducts.slice(0, 2));
  const [rotationKey, setRotationKey] = useState(0);

  useEffect(() => {
    setVisibleProducts(pickProducts(activeProducts));
    setRotationKey((key) => key + 1);

    if (activeProducts.length <= 2) return;
    const interval = window.setInterval(() => {
      setVisibleProducts(pickProducts(activeProducts));
      setRotationKey((key) => key + 1);
    }, 12000);

    return () => window.clearInterval(interval);
  }, [activeProducts]);

  const displayProducts = visibleProducts.length > 0 ? visibleProducts : [];
  const mainProduct = displayProducts[0];
  const secondaryProduct = displayProducts[1];

  return (
    <div className="relative w-full max-w-[460px] overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950/90 p-5 shadow-[0_40px_130px_rgba(15,23,42,0.45),_inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/12 backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.22),transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.16),transparent_36%)]" />
      <div className="relative space-y-4">
        <div className="flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.24em] text-purple-200">
          <span>Живая витрина</span>
          <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-[11px] text-slate-300">
            {activeProducts.length ? `${activeProducts.length} active` : 'Демо'}
          </span>
        </div>

        {mainProduct ? (
          <HeroProductCard product={mainProduct} variant="large" rotationKey={rotationKey} />
        ) : (
          <PremiumPlaceholder />
        )}

        {secondaryProduct ? (
          <HeroProductCard product={secondaryProduct} variant="compact" rotationKey={rotationKey} />
        ) : null}
      </div>
    </div>
  );
}

function HeroProductCard({ product, variant, rotationKey }: { product: Product; variant: 'large' | 'compact'; rotationKey: number }) {
  const productUrl = getProductFinalUrl(product);
  const isLarge = variant === 'large';

  return (
    <article
      key={`${product.id}-${rotationKey}-${variant}`}
      className={`group relative overflow-hidden rounded-[1.75rem] border border-white/11 bg-slate-950/92 shadow-[0_24px_90px_rgba(15,23,42,0.35),_inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-cyan-200/25 hover:shadow-[0_32px_120px_rgba(34,211,238,0.18),_0_24px_100px_rgba(124,58,237,0.22)] animate-[heroFade_520ms_ease-out] ${isLarge ? 'p-4' : 'grid grid-cols-[112px_1fr] gap-3 p-3'}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/8 via-transparent to-cyan-400/8 opacity-0 transition duration-500 group-hover:opacity-100" />
      <SafeProductImage
        imageUrl={product.imageUrl}
        alt={product.title || 'Товар'}
        wrapperClassName={`${isLarge ? 'h-56' : 'h-32'} relative flex items-center justify-center overflow-hidden rounded-[1.35rem] bg-white`}
        className="h-full w-full object-contain p-2"
      />
      <div className={`relative ${isLarge ? 'mt-4' : 'min-w-0'}`}>
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
            {product.marketplace || 'market'}
          </span>
          <span className="shrink-0 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-3 py-1 text-xs font-bold text-white">
            {product.wowRating || 7}/10
          </span>
        </div>
        <h3 className={`${isLarge ? 'mt-3 text-lg' : 'mt-2 text-sm'} line-clamp-2 font-semibold leading-tight text-white`}>
          {product.title || 'Товар без названия'}
        </h3>
        <div className={`${isLarge ? 'mt-4 flex items-center justify-between gap-3' : 'mt-3 space-y-2'}`}>
          <p className={`${isLarge ? 'text-2xl' : 'text-lg'} font-bold text-white`}>{formatPrice(product)}</p>
          <a
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${isLarge ? 'px-4 py-2.5' : 'w-full px-3 py-2'} inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] text-xs font-semibold text-white shadow-[0_14px_50px_rgba(124,58,237,0.28)] transition hover:brightness-110`}
          >
            Посмотреть товар
          </a>
        </div>
      </div>
    </article>
  );
}

function PremiumPlaceholder() {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-white/14 bg-white/5 p-6">
      <div className="flex h-56 items-center justify-center rounded-[1.35rem] bg-white/8 text-center text-sm text-slate-400">
        Товары появятся здесь после публикации в каталоге.
      </div>
      <div className="mt-4 h-4 w-2/3 rounded-full bg-white/10" />
      <div className="mt-3 h-4 w-1/2 rounded-full bg-white/8" />
    </div>
  );
}
