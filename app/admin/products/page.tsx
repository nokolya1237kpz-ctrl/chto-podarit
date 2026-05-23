'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Product } from '@/types/product';
import { getMarketplaceName } from '@/lib/marketplaces';
import AdminShell from '@/components/admin/AdminShell';

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [marketplace, setMarketplace] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [status, setStatus] = useState('');
  const [isActive, setIsActive] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [search, marketplace, sourceType, status, isActive]);

  async function fetchProducts() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('query', search);
      if (marketplace) params.append('marketplace', marketplace);
      if (sourceType) params.append('sourceType', sourceType);
      if (status) params.append('status', status);
      if (isActive) params.append('isActive', isActive);

      const res = await fetch(`/api/admin/products?${params}`);

      if (res.status === 401) {
        router.push('/admin');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Ошибка загрузки товаров');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Товар будет удалён из базы без восстановления. Продолжить?')) return;

    try {
      const res = await fetch(`/api/admin/products/${id}?force=true`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Не удалось удалить товар');
      }
    } catch (err) {
      setError('Сетевая ошибка');
      console.error(err);
    }
  }

  async function handleCleanup(action: string) {
    if (!confirm('Будут удалены товары по выбранному правилу. Продолжить?')) return;
    try {
      const res = await fetch('/api/admin/products/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Cleanup failed');
        return;
      }
      await fetchProducts();
    } catch {
      setError('Ошибка cleanup');
    }
  }

  async function handleArchive(id: string) {
    try {
      const res = await fetch(`/api/admin/products/${id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: false }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts((prev) => status === 'archived'
          ? prev.map((product) => product.id === id ? data.data : product)
          : prev.filter((product) => product.id !== id)
        );
      } else {
        setError(data.error || 'Не удалось архивировать товар');
      }
    } catch (err) {
      setError('Сетевая ошибка');
      console.error(err);
    }
  }

  async function handleRestore(id: string) {
    try {
      const res = await fetch(`/api/admin/products/${id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts((prev) => status === 'archived'
          ? prev.filter((product) => product.id !== id)
          : prev.map((product) => product.id === id ? data.data : product)
        );
      } else {
        setError(data.error || 'Не удалось восстановить товар');
      }
    } catch (err) {
      setError('Сетевая ошибка');
      console.error(err);
    }
  }

  async function handlePublish(id: string) {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active', isActive: true }),
      });

      if (!res.ok) {
        setError('Не удалось опубликовать товар');
        return;
      }

      const data = await res.json();
      if (data.success && data.data) {
        setProducts((prev) => prev.map((product) => product.id === id ? data.data : product));
      } else {
        setError(data.error || 'Не удалось опубликовать товар');
      }
    } catch (err) {
      setError('Сетевая ошибка');
      console.error(err);
    }
  }

  async function handleMarkTrend(product: Product) {
    try {
      const tags = Array.from(new Set([...(product.tags || []), 'trend', 'viral']));
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          tags,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setProducts((prev) => prev.map((item) => item.id === product.id ? data.data : item));
      } else {
        setError(data.error || 'Не удалось пометить трендом');
      }
    } catch (err) {
      setError('Сетевая ошибка');
      console.error(err);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  }

  return (
    <AdminShell title="Товары">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-white/60">Список товаров</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/products/new"
              className="rounded-2xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 transition"
            >
              Добавить товар
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Выход
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
          <p className="text-sm font-semibold text-white">Инструменты очистки</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ['draft_feed', 'Удалить черновики из фидов'],
              ['no_image', 'Удалить без картинки'],
              ['zero_price', 'Удалить с ценой 0'],
              ['soft_deleted', 'Удалить скрытые'],
              ['failed_imports', 'Очистить неудачные импорты'],
            ].map(([action, label]) => (
              <button key={action} onClick={() => handleCleanup(action)} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-white/10">
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
          {/* Filters */}
        <div className="bg-slate-900 border border-white/10 rounded-lg p-6 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
            />
            <select
              value={marketplace}
              onChange={(e) => setMarketplace(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
            >
              <option value="">Все маркетплейсы</option>
              <option value="ozon">Ozon</option>
              <option value="wildberries">Wildberries</option>
              <option value="yandex_market">Яндекс Маркет</option>
              <option value="aliexpress">AliExpress</option>
              <option value="amazon">Amazon</option>
              <option value="other">Другой</option>
            </select>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
            >
              <option value="">Все источники</option>
              <option value="manual">Вручную</option>
              <option value="admitad">Admitad</option>
              <option value="api">API</option>
              <option value="feed">Фид</option>
              <option value="search_api">Поисковый API</option>
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
            >
              <option value="">Активные и черновики</option>
              <option value="active">Активные</option>
              <option value="draft">Черновики</option>
              <option value="archived">Архив</option>
              <option value="all">Все</option>
            </select>
            <select
              value={isActive}
              onChange={(e) => setIsActive(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
            >
              <option value="">Все активности</option>
              <option value="true">Активен</option>
              <option value="false">Неактивен</option>
            </select>
          </div>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg mb-8">{error}</div>}

        {loading ? (
          <div className="text-center py-12">Загрузка...</div>
        ) : (
          <div className="table-shell rounded-lg bg-slate-900">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Название</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Цена</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Маркетплейс</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Источник</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Статус</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Активность</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.filter((product) => product.title).map((product) => (
                  <tr key={product.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4 text-sm">
                      <div>{product.title}</div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {product.sourceType === 'feed' ? <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[11px] text-purple-100">импортирован</span> : null}
                        {product.status === 'draft' ? <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-100">черновик</span> : null}
                        {(!product.imageUrl || !product.price) ? <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] text-rose-100">неполный</span> : null}
                        {product.enrichmentStatus === 'enriched' ? <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-100">обогащён</span> : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{product.price.toLocaleString('ru-RU')} ₽</td>
                    <td className="px-6 py-4 text-sm">{getMarketplaceName(product.marketplace)}</td>
                    <td className="px-6 py-4 text-sm text-purple-300">{translateSourceType(product.sourceType)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={product.status === 'active' ? 'text-green-400' : product.status === 'archived' ? 'text-slate-400' : 'text-yellow-300'}>
                        {product.status === 'active' ? 'Опубликован' : product.status === 'archived' ? 'Архив' : 'Черновик'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={product.isActive ? 'text-green-400' : 'text-gray-400'}>
                        {product.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        Редактировать
                      </Link>
                      {product.status === 'archived' ? (
                        <button
                          onClick={() => handleRestore(product.id)}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          Восстановить
                        </button>
                      ) : null}
                      {product.status !== 'archived' && (!product.isActive || product.status !== 'active') ? (
                        <button
                          onClick={() => handlePublish(product.id)}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          Опубликовать
                        </button>
                      ) : null}
                      {product.status !== 'archived' ? (
                        <button
                          onClick={() => handleArchive(product.id)}
                          className="text-amber-300 hover:text-amber-200"
                        >
                          В архив
                        </button>
                      ) : null}
                      {product.status !== 'archived' ? (
                        <button
                          onClick={() => handleMarkTrend(product)}
                          className="text-cyan-300 hover:text-cyan-200"
                        >
                          Тренд
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Удалить навсегда
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="text-center py-8 text-white/50">Товары не найдены</div>
            )}
          </div>
        )}
        </div>
      </div>
    </AdminShell>
  );
}

function translateSourceType(sourceType?: string) {
  if (sourceType === 'manual') return 'Вручную';
  if (sourceType === 'feed') return 'Фид';
  if (sourceType === 'search_api') return 'Поисковый API';
  if (sourceType === 'api') return 'API';
  return sourceType || '—';
}
