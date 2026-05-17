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
    if (!confirm('Вы действительно хотите удалить этот товар?')) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        setError('Не удалось удалить товар');
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
              <option value="yandex_market">Yandex.Market</option>
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
              <option value="manual">Manual</option>
              <option value="admitad">Admitad</option>
              <option value="api">API</option>
              <option value="mock">Mock</option>
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
            >
              <option value="">Все статусы</option>
              <option value="active">Опубликован</option>
              <option value="draft">Черновик</option>
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
          <div className="bg-slate-900 border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800">
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
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4 text-sm">{product.title}</td>
                    <td className="px-6 py-4 text-sm">{product.price.toLocaleString('ru-RU')} ₽</td>
                    <td className="px-6 py-4 text-sm">{getMarketplaceName(product.marketplace)}</td>
                    <td className="px-6 py-4 text-sm text-purple-300">{product.sourceType}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={product.status === 'active' ? 'text-green-400' : 'text-yellow-300'}>
                        {product.status === 'active' ? 'Опубликован' : 'Черновик'}
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
                      {!product.isActive || product.status !== 'active' ? (
                        <button
                          onClick={() => handlePublish(product.id)}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          Опубликовать
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Удалить
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
