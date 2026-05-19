'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import type { Product } from '@/types/product';

export default function AdminDraftsPage() {
  const [drafts, setDrafts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDrafts();
  }, []);

  async function loadDrafts() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/products?status=draft');
      const data = await res.json();
      if (res.ok && data.success) {
        setDrafts(data.data);
      } else {
        setError(data.error || 'Не удалось загрузить черновики');
      }
    } catch (error) {
      console.error(error);
      setError('Ошибка загрузки черновиков');
    } finally {
      setLoading(false);
    }
  }

  async function publishDraft(product: Product) {
    try {
      const payload = {
        ...product,
        status: 'active',
        isActive: true,
      };
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDrafts(drafts.filter((item) => item.id !== product.id));
      } else {
        setError(data.error || 'Не удалось опубликовать черновик');
      }
    } catch (error) {
      console.error(error);
      setError('Ошибка публикации черновика');
    }
  }

  async function deleteDraft(id: string) {
    if (!confirm('Товар будет удалён из базы без восстановления. Продолжить?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setDrafts(drafts.filter((item) => item.id !== id));
      } else {
        setError(data.error || 'Не удалось удалить черновик');
      }
    } catch (error) {
      console.error(error);
      setError('Ошибка удаления черновика');
    }
  }

  async function archiveDraft(id: string) {
    try {
      const res = await fetch(`/api/admin/products/${id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: false }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDrafts(drafts.filter((item) => item.id !== id));
      } else {
        setError(data.error || 'Не удалось архивировать черновик');
      }
    } catch (error) {
      console.error(error);
      setError('Ошибка архивации черновика');
    }
  }

  return (
    <AdminShell title="Черновики">
      <div className="space-y-6">
        {error && <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div>}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-center text-white/60">Загрузка черновиков...</div>
        ) : drafts.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-center text-white/70">Черновики отсутствуют</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {drafts.map((product) => (
              <div key={product.id} className="rounded-3xl border border-white/10 bg-slate-900/80 overflow-hidden shadow-xl shadow-slate-950/20 backdrop-blur-xl">
                <div className="h-56 overflow-hidden bg-slate-950/80">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-56 items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-white/40">
                      <span className="text-xl">Нет изображения</span>
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{product.title || 'Черновик товара'}</h3>
                    <p className="mt-2 text-sm text-white/60">{product.marketplace}</p>
                  </div>
                  <div className="grid gap-2 text-sm text-white/70">
                    <div>Источник: {product.sourceProvider}</div>
                    <div>Advertiser: {product.advertiserName || '—'}</div>
                    <div>Партнёрская ссылка: {product.affiliateUrl ? '✓' : '✗'}</div>
                    <div>Создан: {product.createdAt ? new Date(product.createdAt).toLocaleString('ru-RU') : '—'}</div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                    >
                      Редактировать
                    </Link>
                    <button
                      type="button"
                      onClick={() => publishDraft(product)}
                      className="rounded-2xl bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
                    >
                      Опубликовать
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDraft(product.id)}
                      className="rounded-2xl bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/20 transition"
                    >
                      Удалить навсегда
                    </button>
                    <button
                      type="button"
                      onClick={() => archiveDraft(product.id)}
                      className="rounded-2xl bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-500/20 transition"
                    >
                      В архив
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
