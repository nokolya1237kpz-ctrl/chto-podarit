'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import SafeProductImage from '@/components/SafeProductImage';
import { MARKETPLACE_OPTIONS } from '@/lib/marketplaces';
import type { Product } from '@/types/product';

interface QuickAddForm {
  affiliateUrl: string;
  epnToken: string;
  advertiserName: string;
  marketplace: string;
  recipients: string;
  interests: string;
  occasions: string;
  giftTypes: string;
  tags: string;
}

export default function AdminQuickAddEpnPage() {
  const router = useRouter();
  const [form, setForm] = useState<QuickAddForm>({
    affiliateUrl: '',
    epnToken: '',
    advertiserName: '',
    marketplace: 'other',
    recipients: '',
    interests: '',
    occasions: '',
    giftTypes: '',
    tags: '',
  });
  const [preview, setPreview] = useState<Partial<Product> | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedProduct, setSubmittedProduct] = useState<Product | null>(null);

  function updateField(field: keyof QuickAddForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const normalizedPayload = {
    affiliateUrl: form.affiliateUrl,
    epnToken: form.epnToken,
    advertiserName: form.advertiserName,
    marketplace: form.marketplace,
    recipients: form.recipients.split(',').map((item) => item.trim()).filter(Boolean),
    interests: form.interests.split(',').map((item) => item.trim()).filter(Boolean),
    occasions: form.occasions.split(',').map((item) => item.trim()).filter(Boolean),
    giftTypes: form.giftTypes.split(',').map((item) => item.trim()).filter(Boolean),
    tags: form.tags.split(',').map((item) => item.trim()).filter(Boolean),
  };

  async function fetchPreview() {
    if (!form.affiliateUrl) {
      setMessage('Введите партнёрскую ссылку для подгрузки данных');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const params = new URLSearchParams();
      params.append('affiliateUrl', form.affiliateUrl);
      if (form.epnToken) params.append('epnToken', form.epnToken);

      const res = await fetch(`/api/admin/products/quick-add-epn?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setPreview(data.data);
        setMessage('Метаданные найдены. Проверьте предварительный просмотр.');
      } else {
        setPreview(null);
        setMessage('Автоматически получить данные товара не удалось. Черновик будет создан — заполните информацию вручную.');
      }
    } catch (error) {
      console.error(error);
      setMessage('Ошибка при получении данных ePN.');
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/products/quick-add-epn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateUrl: form.affiliateUrl,
          epnToken: form.epnToken,
          advertiserName: form.advertiserName,
          marketplace: form.marketplace,
          recipients: normalizedPayload.recipients,
          interests: normalizedPayload.interests,
          occasions: normalizedPayload.occasions,
          giftTypes: normalizedPayload.giftTypes,
          tags: normalizedPayload.tags,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSubmittedProduct(data.data);
        const nextPath = data.data?.id ? `/admin/products/${data.data.id}/edit` : '/admin/products';
        router.push(nextPath);
      } else {
        setMessage(data.error || 'Не удалось создать товар');
      }
    } catch (error) {
      console.error(error);
      setMessage('Ошибка создания товара');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell title="Быстро добавить ePN">
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
          <h2 className="text-xl font-semibold">Подтянуть товар из ePN</h2>
          <p className="mt-3 text-sm text-white/60">Введите ссылку и токен, чтобы автоматически получить метаданные ePN. Затем сохраните товар.</p>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="block space-y-2 text-sm text-white/70">
              Партнёрская ссылка
              <input
                type="url"
                value={form.affiliateUrl}
                onChange={(e) => updateField('affiliateUrl', e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-purple-500/50"
              />
            </label>
            <label className="block space-y-2 text-sm text-white/70">
              ePN токен
              <input
                value={form.epnToken}
                onChange={(e) => updateField('epnToken', e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-purple-500/50"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="block space-y-2 text-sm text-white/70">
              Advertiser name
              <input
                value={form.advertiserName}
                onChange={(e) => updateField('advertiserName', e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-purple-500/50"
              />
            </label>
            <label className="block space-y-2 text-sm text-white/70">
              Маркетплейс
              <select
                value={form.marketplace}
                onChange={(e) => updateField('marketplace', e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-purple-500/50"
              >
                {MARKETPLACE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block space-y-2 text-sm text-white/70">
              Получатель
              <input
                value={form.recipients}
                onChange={(e) => updateField('recipients', e.target.value)}
                placeholder="girlfriend, boyfriend"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-purple-500/50"
              />
            </label>
            <label className="block space-y-2 text-sm text-white/70">
              Тэги
              <input
                value={form.tags}
                onChange={(e) => updateField('tags', e.target.value)}
                placeholder="подарок, стиль"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-purple-500/50"
              />
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <label className="block space-y-2 text-sm text-white/70">
              Интересы
              <input
                value={form.interests}
                onChange={(e) => updateField('interests', e.target.value)}
                placeholder="спорт, музыка"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-purple-500/50"
              />
            </label>
            <label className="block space-y-2 text-sm text-white/70">
              Поводы
              <input
                value={form.occasions}
                onChange={(e) => updateField('occasions', e.target.value)}
                placeholder="день рождения, новый год"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-purple-500/50"
              />
            </label>
            <label className="block space-y-2 text-sm text-white/70">
              Gift types
              <input
                value={form.giftTypes}
                onChange={(e) => updateField('giftTypes', e.target.value)}
                placeholder="гаджет, книга"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-purple-500/50"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={fetchPreview}
              disabled={loading}
              className="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white hover:brightness-110 transition disabled:opacity-50"
            >
              Подтянуть данные
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !form.affiliateUrl}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition disabled:opacity-50"
            >
              Создать товар
            </button>
          </div>

          {message && <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-sm text-white/80">{message}</div>}
        </div>

        {preview ? (
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-xl">
            <h2 className="text-xl font-semibold">Предварительный просмотр</h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-[200px_1fr]">
              <div className="rounded-3xl overflow-hidden bg-slate-950/80">
                <SafeProductImage
                  imageUrl={preview.imageUrl}
                  alt={preview.title || 'preview'}
                  wrapperClassName="h-56 w-full"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-3 text-sm text-white/70">
                <div>
                  <h3 className="text-2xl font-semibold text-white">{preview.title || 'Предварительно'}</h3>
                  <p className="mt-2 text-white/60">{preview.description || 'Описание будет добавлено после загрузки.'}</p>
                </div>
                <div>Marketplace: {preview.marketplace || '—'}</div>
                <div>Advertiser: {preview.advertiserName || '-'}</div>
                <div>Партнёрская ссылка: {preview.affiliateUrl ? '✓' : '✗'}</div>
                <div>Состояние: {preview.status || 'draft'}</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
