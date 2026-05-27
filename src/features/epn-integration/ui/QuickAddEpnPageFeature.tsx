'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import SafeProductImage from '@/components/SafeProductImage';
import type { Product } from '@/types/product';
import { QuickAddEpnForm } from './QuickAddEpnForm';

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
  const [deeplinkOfferId, setDeeplinkOfferId] = useState('');
  const [deeplinkPlacementId, setDeeplinkPlacementId] = useState('');
  const [deeplinkMessage, setDeeplinkMessage] = useState('');
  const [deeplinkLoading, setDeeplinkLoading] = useState(false);

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

  async function generateEpnLink() {
    if (!form.affiliateUrl) {
      setDeeplinkMessage('Укажите ссылку для генерации партнёрской ссылки.');
      return;
    }

    setDeeplinkLoading(true);
    setDeeplinkMessage('Генерация партнёрской ссылки...');

    try {
      const response = await fetch('/api/admin/epn/deeplink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: form.affiliateUrl,
          offerId: deeplinkOfferId || undefined,
          placementId: deeplinkPlacementId || undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Не удалось создать deeplink');
      }

      updateField('affiliateUrl', data.affiliateUrl);
      setDeeplinkMessage(`Партнёрская ссылка создана. Creative ID: ${data.creativeId || '—'}`);
    } catch (error) {
      setDeeplinkMessage(error instanceof Error ? error.message : 'Ошибка генерации deeplink');
    } finally {
      setDeeplinkLoading(false);
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
        <QuickAddEpnForm
          form={form}
          loading={loading}
          deeplinkLoading={deeplinkLoading}
          deeplinkOfferId={deeplinkOfferId}
          deeplinkPlacementId={deeplinkPlacementId}
          message={message}
          deeplinkMessage={deeplinkMessage}
          onFieldChange={updateField}
          onOfferIdChange={setDeeplinkOfferId}
          onPlacementIdChange={setDeeplinkPlacementId}
          onGenerateDeeplink={generateEpnLink}
          onFetchPreview={fetchPreview}
          onSubmit={handleSubmit}
        />

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
