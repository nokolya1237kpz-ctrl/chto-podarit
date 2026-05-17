'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types/product';
import SafeProductImage from '@/components/SafeProductImage';
import { MARKETPLACE_OPTIONS } from '@/lib/marketplaces';

interface ProductFormProps {
  productId?: string;
  initialProduct?: Partial<Product>;
  onSubmit: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  isLoading?: boolean;
  title: string;
}

const BUDGET_OPTIONS = ['до 1000 ₽', '1000–3000', '3000–5000', '5000–10000', '10000–20000', '20000+'];
const RISK_LEVELS = ['low', 'medium', 'high'];
const WOW_RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const RECIPIENTS = ['girlfriend', 'boyfriend', 'mom', 'dad', 'wife', 'friend', 'colleague', 'brother', 'sister', 'teenager', 'grandma'];
const INTERESTS = ['музыка', 'спорт', 'книги', 'технологии', 'красота', 'кулинария', 'путешествия', 'интерьер', 'мода', 'здоровье'];
const OCCASIONS = ['день рождения', 'новый год', 'к 8 марта', 'к 23 февраля', 'день святого валентина', 'выпускной', 'новоселье', 'без повода'];
const GIFT_TYPES = ['гаджет', 'книга', 'косметика', 'украшение', 'аксессуары', 'для дома', 'спорт', 'техника', 'впечатление', 'подписка', 'гигиена', 'для кухни', 'инструменты', 'сувенир'];

export default function ProductForm({
  productId,
  initialProduct,
  onSubmit,
  isLoading = false,
  title,
}: ProductFormProps) {
  const router = useRouter();
  const isCreating = !productId;

  const [formData, setFormData] = useState<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>({
    title: initialProduct?.title || '',
    description: initialProduct?.description || '',
    price: initialProduct?.price || 0,
    oldPrice: initialProduct?.oldPrice,
    currency: initialProduct?.currency || 'RUB',
    marketplace: initialProduct?.marketplace || 'other',
    originalUrl: initialProduct?.originalUrl || '',
    affiliateUrl: initialProduct?.affiliateUrl || '',
    admitadDeeplink: initialProduct?.admitadDeeplink || '',
    admitadCampaignId: initialProduct?.admitadCampaignId || '',
    admitadOfferId: initialProduct?.admitadOfferId || '',
    externalProductId: initialProduct?.externalProductId || '',
    imageUrl: initialProduct?.imageUrl || '',
    recipients: initialProduct?.recipients || [],
    budget: initialProduct?.budget || '',
    interests: initialProduct?.interests || [],
    occasions: initialProduct?.occasions || [],
    giftTypes: initialProduct?.giftTypes || [],
    wowRating: initialProduct?.wowRating || 7,
    riskLevel: initialProduct?.riskLevel || 'medium',
    tags: initialProduct?.tags || [],
    isBestPrice: initialProduct?.isBestPrice || false,
    discountPercent: initialProduct?.discountPercent,
    isActive: initialProduct?.isActive ?? (isCreating ? true : false),
    status: initialProduct?.status ?? (isCreating ? 'active' : 'draft'),
    sourceProvider: initialProduct?.sourceProvider || 'manual',
    sourceType: initialProduct?.sourceType || 'manual',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imageStatus, setImageStatus] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [checkingImage, setCheckingImage] = useState(false);
  const [fetchingImage, setFetchingImage] = useState(false);

  useEffect(() => {
    setImageStatus('');
  }, [formData.imageUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const isComplete = Boolean(
        formData.title &&
        formData.price > 0 &&
        formData.imageUrl &&
        (formData.affiliateUrl || formData.originalUrl)
      );

      const payload = {
        ...formData,
        status: isComplete ? (formData.status || 'active') : 'draft',
        isActive: isComplete ? formData.isActive : false,
      };

      await onSubmit(payload);
      router.push('/admin/products');
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  }

  function handleArrayInput(field: string, value: string) {
    const values = value.split(',').map((v) => v.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, [field]: values }));
  }

  function handleImageFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setImageStatus('');
  }

  function clearImage() {
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    setSelectedFile(null);
    setImageStatus('');
  }

  async function validateImageUrl() {
    if (!formData.imageUrl) {
      setImageStatus('Укажите URL изображения.');
      return;
    }

    setCheckingImage(true);
    setImageStatus('Проверка изображения...');

    const img = new Image();
    img.onload = () => {
      setImageStatus('Изображение доступно.');
      setCheckingImage(false);
    };
    img.onerror = () => {
      setImageStatus('Изображение не загружается.');
      setCheckingImage(false);
    };
    img.src = formData.imageUrl;
  }

  async function uploadSelectedImage() {
    if (!selectedFile) {
      setImageStatus('Выберите файл для загрузки.');
      return;
    }

    setUploadingImage(true);
    setImageStatus('Загрузка изображения...');
    const payload = new FormData();
    payload.append('file', selectedFile);

    try {
      const response = await fetch('/api/admin/products/upload-image', {
        method: 'POST',
        body: payload,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setImageStatus(data.error || 'Не удалось загрузить изображение.');
        return;
      }
      setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
      setSelectedFile(null);
      setImageStatus('Изображение загружено. URL установлен.');
    } catch (error) {
      console.error(error);
      setImageStatus('Ошибка при загрузке изображения.');
    } finally {
      setUploadingImage(false);
    }
  }

  async function fetchImageByLink() {
    const url = formData.affiliateUrl?.trim() || formData.originalUrl?.trim();
    if (!url) {
      setImageStatus('Укажите оригинальную или партнёрскую ссылку.');
      return;
    }

    setFetchingImage(true);
    setImageStatus('Попытка получить картинку по ссылке...');

    try {
      const response = await fetch('/api/admin/products/fetch-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setImageStatus(data.error || 'Картинку не удалось получить автоматически.');
        return;
      }

      setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
      setImageStatus('Картинка найдена и установлена.');
    } catch (error) {
      console.error(error);
      setImageStatus('Ошибка при получении картинки.');
    } finally {
      setFetchingImage(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">{title}</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-white/10 rounded-lg p-8 space-y-8">
          {/* Basic Info */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Основная информация</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Название товара"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30"
                required
              />
              <textarea
                placeholder="Описание"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30 min-h-20"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="number"
                  placeholder="Цена"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
                  required
                />
                <input
                  type="number"
                  placeholder="Старая цена (опционально)"
                  value={formData.oldPrice || ''}
                  onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
                />
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
                >
                  <option value="RUB">₽</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          </div>

          {/* URLs & Marketplace */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Маркетплейс и ссылки</h2>
            <div className="space-y-4">
              <select
                value={formData.marketplace}
                onChange={(e) => setFormData({ ...formData, marketplace: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
              >
                {MARKETPLACE_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <input
                type="url"
                placeholder="Ссылка на товар (обязательно)"
                value={formData.originalUrl}
                onChange={(e) => setFormData({ ...formData, originalUrl: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30"
                required
              />
              <input
                type="url"
                placeholder="Партнёрская ссылка (опционально)"
                value={formData.affiliateUrl || ''}
                onChange={(e) => setFormData({ ...formData, affiliateUrl: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30"
              />
              <p className="text-sm text-white/50">
                💡 Если указан партнёрский URL, он будет использован вместо основной ссылки
              </p>
            </div>
          </div>

          {/* Image */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Изображение товара</h2>
            <div className="grid gap-6 lg:grid-cols-[240px_1fr] items-start">
              <div className="rounded-[1.75rem] overflow-hidden border border-white/10 bg-slate-900">
                <SafeProductImage
                  imageUrl={formData.imageUrl}
                  alt={formData.title || 'Изображение товара'}
                  wrapperClassName="h-64 w-full"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-4">
                <input
                  type="url"
                  placeholder="URL изображения"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30"
                />
                <div className="grid gap-3 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={validateImageUrl}
                    disabled={checkingImage}
                    className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition disabled:opacity-50"
                  >
                    {checkingImage ? 'Проверка...' : 'Проверить изображение'}
                  </button>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm font-semibold text-white hover:border-white/20 transition"
                  >
                    Очистить изображение
                  </button>
                  <button
                    type="button"
                    onClick={fetchImageByLink}
                    disabled={fetchingImage}
                    className="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 text-sm font-semibold text-white hover:brightness-110 transition disabled:opacity-50"
                  >
                    {fetchingImage ? 'Идёт поиск...' : 'Попробовать подтянуть картинку по ссылке'}
                  </button>
                </div>
                <label className="block text-sm text-white/70">
                  Загрузить файл
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageFileChange}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white file:mr-4 file:rounded-full file:border-0 file:bg-purple-500/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={uploadSelectedImage}
                    disabled={!selectedFile || uploadingImage}
                    className="rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-4 py-3 text-sm font-semibold text-white hover:brightness-110 transition disabled:opacity-50"
                  >
                    {uploadingImage ? 'Загрузка...' : 'Загрузить файл'}
                  </button>
                  {selectedFile ? (
                    <div className="rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-slate-300">{selectedFile.name}</div>
                  ) : null}
                </div>
                {imageStatus ? (
                  <p className="text-sm text-slate-300">{imageStatus}</p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Admitad */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Настройки Admitad</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Admitad deeplink (опционально)"
                value={formData.admitadDeeplink || ''}
                onChange={(e) => setFormData({ ...formData, admitadDeeplink: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="ID кампании (опционально)"
                  value={formData.admitadCampaignId || ''}
                  onChange={(e) => setFormData({ ...formData, admitadCampaignId: e.target.value })}
                  className="px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30"
                />
                <input
                  type="text"
                  placeholder="ID оффера (опционально)"
                  value={formData.admitadOfferId || ''}
                  onChange={(e) => setFormData({ ...formData, admitadOfferId: e.target.value })}
                  className="px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30"
                />
              </div>
            </div>
          </div>

          {/* Categorization */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Категория</h2>
            <div className="space-y-4">
              <select
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
              >
                <option value="">Выберите бюджет</option>
                {BUDGET_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <div>
                <label className="block text-sm mb-2">Получатели (через запятую)</label>
                <textarea
                  placeholder="girlfriend, boyfriend, mom, dad"
                  value={formData.recipients.join(', ')}
                  onChange={(e) => handleArrayInput('recipients', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30 min-h-20"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Интересы (через запятую)</label>
                <textarea
                  placeholder="музыка, спорт, книги"
                  value={formData.interests.join(', ')}
                  onChange={(e) => handleArrayInput('interests', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30 min-h-20"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Поводы (через запятую)</label>
                <textarea
                  placeholder="день рождения, новый год"
                  value={formData.occasions.join(', ')}
                  onChange={(e) => handleArrayInput('occasions', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30 min-h-20"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Типы подарков (через запятую)</label>
                <textarea
                  placeholder="гаджет, книга, косметика"
                  value={formData.giftTypes.join(', ')}
                  onChange={(e) => handleArrayInput('giftTypes', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30 min-h-20"
                />
              </div>
            </div>
          </div>

          {/* Rating & Assessment */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Оценка</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-2">Рейтинг WOW (1-10)</label>
                <select
                  value={formData.wowRating}
                  onChange={(e) => setFormData({ ...formData, wowRating: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
                >
                  {WOW_RATINGS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Уровень риска</label>
                <select
                  value={formData.riskLevel}
                  onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as any })}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
                >
                  {RISK_LEVELS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Скидка (%)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.discountPercent || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountPercent: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Статус</h2>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block rounded-2xl border border-white/10 bg-slate-800 p-4">
                  <span className="text-sm text-white/70">Публикация</span>
                  <div className="mt-3 flex items-center gap-3">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={formData.status === 'active'}
                        onChange={() => setFormData({ ...formData, status: 'active' })}
                        className="w-4 h-4"
                      />
                      <span>Опубликован</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="status"
                        value="draft"
                        checked={formData.status === 'draft'}
                        onChange={() => setFormData({ ...formData, status: 'draft' })}
                        className="w-4 h-4"
                      />
                      <span>Черновик</span>
                    </label>
                  </div>
                </label>
                <label className="block rounded-2xl border border-white/10 bg-slate-800 p-4">
                  <span className="text-sm text-white/70">Видимость</span>
                  <div className="mt-3 flex items-center gap-3">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-5 h-5"
                      />
                      <span>Активен</span>
                    </label>
                  </div>
                </label>
              </div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.isBestPrice}
                  onChange={(e) => setFormData({ ...formData, isBestPrice: e.target.checked })}
                  className="w-5 h-5"
                />
                <span>Лучшее предложение</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting || isLoading}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
            >
              {submitting || isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
