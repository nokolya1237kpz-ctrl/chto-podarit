'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Product } from '@/types/product';
import AdminShell from '@/components/admin/AdminShell';
import {
  archiveAdminProduct,
  deleteAdminProduct,
  fetchAdminProducts,
  markAdminProductTrend,
  ProductTable,
  publishAdminProduct,
  type AdminProductFilters,
} from '@features/admin-products';

export default function AdminProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [marketplace, setMarketplace] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [status, setStatus] = useState('');
  const [isActive, setIsActive] = useState('');
  const filters: AdminProductFilters = useMemo(() => ({ search, marketplace, sourceType, status, isActive }), [search, marketplace, sourceType, status, isActive]);
  const queryKey = useMemo(() => ['admin-products', filters] as const, [filters]);

  const productsQuery = useQuery({
    queryKey,
    queryFn: () => fetchAdminProducts(filters),
    staleTime: 60_000,
    retry: false,
  });
  const products = productsQuery.data || [];

  useEffect(() => {
    if (productsQuery.error instanceof Error) {
      if (productsQuery.error.message === 'unauthorized') {
        router.push('/admin');
      }
      setError(productsQuery.error.message === 'unauthorized' ? '' : productsQuery.error.message);
    }
  }, [productsQuery.error, router]);

  const invalidateProducts = () => queryClient.invalidateQueries({ queryKey: ['admin-products'] });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminProduct,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Product[]>(queryKey);
      queryClient.setQueryData<Product[]>(queryKey, (current) => (current || []).filter((product) => product.id !== id));
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      setError(err instanceof Error ? err.message : 'Не удалось удалить товар');
    },
    onSettled: invalidateProducts,
  });

  const archiveMutation = useMutation({
    mutationFn: archiveAdminProduct,
    onError: (err) => setError(err instanceof Error ? err.message : 'Не удалось изменить архив'),
    onSuccess: invalidateProducts,
  });

  const publishMutation = useMutation({
    mutationFn: publishAdminProduct,
    onError: (err) => setError(err instanceof Error ? err.message : 'Не удалось опубликовать товар'),
    onSuccess: invalidateProducts,
  });

  const trendMutation = useMutation({
    mutationFn: markAdminProductTrend,
    onError: (err) => setError(err instanceof Error ? err.message : 'Не удалось пометить трендом'),
    onSuccess: invalidateProducts,
  });

  async function handleDelete(id: string) {
    if (!confirm('Товар будет удалён из базы без восстановления. Продолжить?')) return;

    try {
      deleteMutation.mutate(id);
    } catch {}
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
        setError(data.error || 'Очистка не выполнена');
        return;
      }
      await invalidateProducts();
    } catch {
      setError('Ошибка очистки');
    }
  }

  async function handleRecalculate() {
    if (!confirm('Пересчитать категории и рекомендации для товаров?')) return;
    try {
      const res = await fetch('/api/admin/products/recalculate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Пересчёт не выполнен');
        return;
      }
      await invalidateProducts();
    } catch {
      setError('Ошибка пересчёта');
    }
  }

  async function handleArchive(id: string) {
    try {
      archiveMutation.mutate({ id, restore: false });
    } catch {}
  }

  async function handleRestore(id: string) {
    try {
      archiveMutation.mutate({ id, restore: true });
    } catch {}
  }

  async function handlePublish(id: string) {
    try {
      publishMutation.mutate(id);
    } catch {}
  }

  async function handleMarkTrend(product: Product) {
    try {
      trendMutation.mutate(product);
    } catch {}
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
            <button onClick={handleRecalculate} className="rounded-2xl border border-emerald-300/20 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/20">
              Пересчитать категории и рекомендации
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
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

        <ProductTable
          products={products}
          loading={productsQuery.isLoading}
          onDelete={handleDelete}
          onArchive={handleArchive}
          onRestore={handleRestore}
          onPublish={handlePublish}
          onMarkTrend={handleMarkTrend}
        />
        </div>
      </div>
    </AdminShell>
  );
}
