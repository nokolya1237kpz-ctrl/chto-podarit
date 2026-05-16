'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types/product';
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
    isActive: initialProduct?.isActive !== false,
    sourceType: initialProduct?.sourceType || 'manual',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await onSubmit(formData);
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
            <h2 className="text-2xl font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Product Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30"
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30 min-h-20"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="number"
                  placeholder="Price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
                  required
                />
                <input
                  type="number"
                  placeholder="Old Price (optional)"
                  value={formData.oldPrice || ''}
                  onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
                />
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
                >
                  <option value="RUB">RUB</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          </div>

          {/* URLs & Marketplace */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Marketplace & URLs</h2>
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
                placeholder="Original URL (required)"
                value={formData.originalUrl}
                onChange={(e) => setFormData({ ...formData, originalUrl: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30"
                required
              />
              <input
                type="url"
                placeholder="Affiliate URL (optional - used instead of original URL)"
                value={formData.affiliateUrl || ''}
                onChange={(e) => setFormData({ ...formData, affiliateUrl: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30"
              />
              <p className="text-sm text-white/50">
                💡 If affiliateUrl is filled, site will use it instead of originalUrl
              </p>
            </div>
          </div>

          {/* Admitad */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Admitad Configuration</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Admitad Deeplink (optional)"
                value={formData.admitadDeeplink || ''}
                onChange={(e) => setFormData({ ...formData, admitadDeeplink: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Campaign ID (optional)"
                  value={formData.admitadCampaignId || ''}
                  onChange={(e) => setFormData({ ...formData, admitadCampaignId: e.target.value })}
                  className="px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30"
                />
                <input
                  type="text"
                  placeholder="Offer ID (optional)"
                  value={formData.admitadOfferId || ''}
                  onChange={(e) => setFormData({ ...formData, admitadOfferId: e.target.value })}
                  className="px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30"
                />
              </div>
            </div>
          </div>

          {/* Categorization */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Categorization</h2>
            <div className="space-y-4">
              <select
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white"
              >
                <option value="">Select Budget</option>
                {BUDGET_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <div>
                <label className="block text-sm mb-2">Recipients (comma-separated)</label>
                <textarea
                  placeholder="girlfriend, boyfriend, mom, dad"
                  value={formData.recipients.join(', ')}
                  onChange={(e) => handleArrayInput('recipients', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30 min-h-20"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Interests (comma-separated)</label>
                <textarea
                  placeholder="музыка, спорт, книги"
                  value={formData.interests.join(', ')}
                  onChange={(e) => handleArrayInput('interests', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30 min-h-20"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Occasions (comma-separated)</label>
                <textarea
                  placeholder="день рождения, новый год"
                  value={formData.occasions.join(', ')}
                  onChange={(e) => handleArrayInput('occasions', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30 min-h-20"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Gift Types (comma-separated)</label>
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
            <h2 className="text-2xl font-semibold mb-4">Rating & Assessment</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-2">Wow Rating (1-10)</label>
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
                <label className="block text-sm mb-2">Risk Level</label>
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
                <label className="block text-sm mb-2">Discount Percent (optional)</label>
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
            <h2 className="text-2xl font-semibold mb-4">Status</h2>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.isBestPrice}
                  onChange={(e) => setFormData({ ...formData, isBestPrice: e.target.checked })}
                  className="w-5 h-5"
                />
                <span>Best Price</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5"
                />
                <span>Active</span>
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
              {submitting || isLoading ? 'Saving...' : 'Save Product'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
