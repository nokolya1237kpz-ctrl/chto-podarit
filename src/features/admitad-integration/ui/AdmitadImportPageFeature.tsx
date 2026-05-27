'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';

interface ProductSearchResult {
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  originalUrl: string;
  affiliateUrl: string;
  marketplace: string;
  brand?: string;
  currency: string;
  wowRating: number;
  sourceProductId: string;
  [key: string]: any;
}

function AdmitadImportContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ProductSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Введите поисковый запрос');
      return;
    }

    setIsSearching(true);
    setError('');
    setMessage('');
    setProducts([]);

    try {
      const response = await fetch(`/api/admin/admitad/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Поиск не удался');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }

      setProducts(data.products || []);
      if (data.products.length === 0) {
        setMessage('Товары не найдены');
      } else {
        setMessage(`Найдено товаров: ${data.count}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка поиска');
      setProducts([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (product: ProductSearchResult, index: number) => {
    const key = `${product.sourceProductId}-${index}`;
    setIsImporting(prev => ({ ...prev, [key]: true }));
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/admitad/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Импорт не удался');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }

      setMessage(`✓ Товар "${product.title}" успешно импортирован`);
      
      // Remove from list
      setProducts(prev => prev.filter((_, i) => i !== index));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка импорта');
    } finally {
      setIsImporting(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-white/50 mb-2">Импорт</p>
        <h2 className="text-2xl font-bold text-white mb-2">Admitad каталог</h2>
        <p className="text-slate-400">Найдите и импортируйте товары из каталога Admitad</p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-500/30 text-red-200">
          {error}
        </div>
      )}
      {message && (
        <div className="p-4 rounded-lg bg-green-950/40 border border-green-500/30 text-green-200">
          {message}
        </div>
      )}

      <form onSubmit={handleSearch} className="glass rounded-2xl p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Поисковой запрос</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Например: ноутбук, наушники, смартфон..."
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-purple-500/50 focus:outline-none"
            disabled={isSearching}
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
        >
          {isSearching ? 'Поиск...' : 'Найти товары'}
        </button>
      </form>

      {products.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Найденные товары ({products.length})</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => {
              const key = `${product.sourceProductId}-${index}`;
              const isItemImporting = !!isImporting[key];

              return (
                <div key={key} className="glass rounded-xl p-4 space-y-3">
                  {product.imageUrl && (
                    <div className="w-full h-40 bg-slate-900/50 rounded-lg overflow-hidden flex items-center justify-center">
                      <img 
                        src={product.imageUrl} 
                        alt={product.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <h3 className="font-semibold text-white line-clamp-2">{product.title}</h3>

                  <div className="space-y-1 text-sm text-slate-400">
                    <p className="font-medium text-white">{product.price.toLocaleString('ru-RU')} {product.currency}</p>
                    <p className="text-xs">{product.marketplace}</p>
                    {product.brand && <p className="text-xs">Бренд: {product.brand}</p>}
                  </div>

                  <button
                    onClick={() => handleImport(product, index)}
                    disabled={isItemImporting}
                    className="w-full px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition text-sm"
                  >
                    {isItemImporting ? 'Импорт...' : 'Импортировать'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isSearching && products.length === 0 && searchQuery && (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-slate-400">По запросу "{searchQuery}" товары не найдены</p>
        </div>
      )}

      {!isSearching && products.length === 0 && !searchQuery && (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-slate-400 mb-4">Введите название товара для поиска в каталоге Admitad</p>
          <div className="inline-flex items-center gap-4 text-sm text-slate-500">
            <span>Подсказки:</span>
            <ul className="text-left space-y-1">
              <li>• Используйте конкретные названия</li>
              <li>• Минимум 2 символа</li>
              <li>• Ищите на русском языке</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdmitadImportPage() {
  return (
    <AdminShell title="Импорт из Admitad">
      <AdmitadImportContent />
    </AdminShell>
  );
}
