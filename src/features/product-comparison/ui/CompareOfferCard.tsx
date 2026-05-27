import SafeProductImage from '@/components/SafeProductImage';
import type { Product } from '@entities/product/types';

type CompareOfferCardProps = {
  product: Product;
  index: number;
  favorites: string[];
  watchlist: string[];
  onImport: (product: Product) => void;
  onLogClick: (product: Product) => void;
  onToggleStored: (key: 'favoriteProducts' | 'priceWatchlist', product: Product) => void;
  getPriceNote: (product: Product) => string;
};

function productStorageId(product: Product) {
  return String(product.id || product.externalProductId || product.originalUrl);
}

export function CompareOfferCard({ product, index, favorites, watchlist, onImport, onLogClick, onToggleStored, getPriceNote }: CompareOfferCardProps) {
  const url = product.affiliateUrl || product.originalUrl || '#';
  const id = productStorageId(product);

  return (
    <article className="grid min-w-0 gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 transition hover:border-cyan-300/25 md:grid-cols-[140px_minmax(0,1fr)_auto]">
      <SafeProductImage imageUrl={product.imageUrl} alt={product.title} wrapperClassName="flex h-28 items-center justify-center rounded-2xl bg-white" className="h-full w-full object-contain p-2" />
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          {index === 0 ? <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-100">Лучшая цена</span> : null}
          {(product.trendScore || 0) > 7 || product.tags?.some((tag) => /tiktok|viral|trend|хит/i.test(tag)) ? <span className="rounded-full bg-pink-500/15 px-3 py-1 text-xs font-semibold text-pink-100">Тренд TikTok</span> : null}
          {(product.wowRating || 0) >= 8 ? <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-100">Популярно</span> : null}
          {product.affiliateUrl ? <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-100">Партнёрская ссылка</span> : null}
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-cyan-100">{product.marketplace}</span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">Быстрая доставка</span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">★ {product.wowRating || 7}/10</span>
        </div>
        <h3 className="mt-3 text-lg font-semibold">{product.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-slate-400">{product.description || 'Описание появится после импорта.'}</p>
      </div>
      <div className="flex flex-col justify-center gap-3 md:min-w-48 md:items-end">
        <div className="text-2xl font-bold">{Math.round(product.price || 0).toLocaleString('ru-RU')} ₽</div>
        {product.oldPrice ? <div className="text-sm text-slate-500 line-through">{Math.round(product.oldPrice).toLocaleString('ru-RU')} ₽</div> : null}
        {product.oldPrice && product.price ? <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-100">-{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%</div> : null}
        {watchlist.includes(id) ? <div className="text-xs text-cyan-200">{getPriceNote(product)}</div> : null}
        <a onClick={() => onLogClick(product)} href={url} target="_blank" rel="noopener noreferrer" className="w-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-5 py-3 text-center text-sm font-semibold md:w-auto">
          Купить дешевле
        </a>
        <a onClick={() => onLogClick(product)} href={product.originalUrl || url} target="_blank" rel="noopener noreferrer" className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-2 text-center text-sm font-semibold text-slate-100 md:w-auto">
          Открыть товар
        </a>
        <button onClick={() => onToggleStored('favoriteProducts', product)} className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-slate-100 md:w-auto">
          {favorites.includes(id) ? 'В избранном' : 'В избранное'}
        </button>
        <button onClick={() => onToggleStored('priceWatchlist', product)} className="w-full rounded-full border border-cyan-300/20 bg-cyan-400/10 px-5 py-2 text-sm font-semibold text-cyan-100 md:w-auto">
          Следить за ценой
        </button>
        <button onClick={() => onImport(product)} className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-slate-100 md:w-auto">
          Добавить в товары
        </button>
      </div>
    </article>
  );
}
