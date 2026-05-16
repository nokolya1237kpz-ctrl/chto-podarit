'use client';

import { useEffect, useState } from 'react';
import ProductForm from '@/components/admin/ProductForm';
import type { Product } from '@/types/product';
import { useParams } from 'next/navigation';

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/admin/products`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const found = data.data.find((p: Product) => p.id === productId);
          setProduct(found || null);
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  async function handleSubmit(updates: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update product');
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center">Loading...</div>;
  }

  if (!product) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center">Product not found</div>;
  }

  return (
    <ProductForm
      productId={productId}
      initialProduct={product}
      onSubmit={handleSubmit}
      isLoading={loading}
      title="Edit Product"
    />
  );
}
