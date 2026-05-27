import type { Product } from '@entities/product/types';

export type AdminProductFilters = {
  search?: string;
  marketplace?: string;
  sourceType?: string;
  status?: string;
  isActive?: string;
};

function buildProductParams(filters: AdminProductFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.append('query', filters.search);
  if (filters.marketplace) params.append('marketplace', filters.marketplace);
  if (filters.sourceType) params.append('sourceType', filters.sourceType);
  if (filters.status) params.append('status', filters.status);
  if (filters.isActive) params.append('isActive', filters.isActive);
  return params;
}

export async function fetchAdminProducts(filters: AdminProductFilters): Promise<Product[]> {
  const response = await fetch(`/api/admin/products?${buildProductParams(filters).toString()}`);
  if (response.status === 401) throw new Error('unauthorized');
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body.error || 'Ошибка загрузки товаров');
  return body.data || [];
}

export async function deleteAdminProduct(id: string) {
  const response = await fetch(`/api/admin/products/${id}?force=true`, { method: 'DELETE' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Не удалось удалить товар');
  return body;
}

export async function archiveAdminProduct({ id, restore }: { id: string; restore: boolean }) {
  const response = await fetch(`/api/admin/products/${id}/archive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ restore }),
  });
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body.error || 'Не удалось изменить архив');
  return body.data as Product;
}

export async function publishAdminProduct(id: string) {
  const response = await fetch(`/api/admin/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'active', isActive: true }),
  });
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body.error || 'Не удалось опубликовать товар');
  return body.data as Product;
}

export async function markAdminProductTrend(product: Product) {
  const tags = Array.from(new Set([...(product.tags || []), 'trend', 'viral']));
  const response = await fetch(`/api/admin/products/${product.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...product, tags }),
  });
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body.error || 'Не удалось пометить трендом');
  return body.data as Product;
}
