'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Product } from '@/types/product';
import { getMarketplaceName } from '@/lib/marketplaces';

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [marketplace, setMarketplace] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [isActive, setIsActive] = useState<string>('true');

  useEffect(() => {
    fetchProducts();
  }, [search, marketplace, sourceType, isActive]);

  async function fetchProducts() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('query', search);
      if (marketplace) params.append('marketplace', marketplace);
      if (sourceType) params.append('sourceType', sourceType);
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
      setError('Failed to fetch products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        setError('Failed to delete product');
      }
    } catch (err) {
      setError('Network error');
      console.error(err);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin: Products</h1>
          <div className="space-x-4">
            <Link
              href="/admin/products/new"
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
            >
              Add Product
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-900 border border-white/10 rounded-lg p-6 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
            />
            <select
              value={marketplace}
              onChange={(e) => setMarketplace(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
            >
              <option value="">All Marketplaces</option>
              <option value="ozon">Ozon</option>
              <option value="wildberries">Wildberries</option>
              <option value="yandex_market">Yandex.Market</option>
              <option value="aliexpress">AliExpress</option>
              <option value="amazon">Amazon</option>
              <option value="other">Other</option>
            </select>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
            >
              <option value="">All Sources</option>
              <option value="manual">Manual</option>
              <option value="admitad">Admitad</option>
              <option value="api">API</option>
              <option value="mock">Mock</option>
            </select>
            <select
              value={isActive}
              onChange={(e) => setIsActive(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg mb-8">{error}</div>}

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="bg-slate-900 border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Marketplace</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Affiliate URL</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Source</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4 text-sm">{product.title}</td>
                    <td className="px-6 py-4 text-sm">{product.price} ₽</td>
                    <td className="px-6 py-4 text-sm">{getMarketplaceName(product.marketplace)}</td>
                    <td className="px-6 py-4 text-sm">
                      {product.affiliateUrl ? '✓' : '✗'}
                    </td>
                    <td className="px-6 py-4 text-sm text-purple-300">{product.sourceType}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={product.isActive ? 'text-green-400' : 'text-gray-400'}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && (
              <div className="text-center py-8 text-white/50">No products found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
