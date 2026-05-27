'use client';

import ProductForm from '@/components/admin/ProductForm';
import AdminShell from '@/components/admin/AdminShell';
import type { Product } from '@/types/product';

export default function NewProductPage() {
  async function handleSubmit(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Ошибка сохранения');
    }
  }

  return (
    <AdminShell title="Добавить товар">
      <ProductForm onSubmit={handleSubmit} title="Добавить товар" />
    </AdminShell>
  );
}
