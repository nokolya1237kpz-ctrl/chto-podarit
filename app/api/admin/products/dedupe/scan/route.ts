import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { searchProducts, supabaseAdmin } from '@lib/supabase';
import { groupDuplicateProducts } from '@entities/product/lib/dedupeProducts';

export async function POST() {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ success: false, error: 'Supabase не настроен' }, { status: 500 });

  const products = await searchProducts({ includeArchived: false }, supabaseAdmin as any);
  const groups = groupDuplicateProducts(products).slice(0, 100).map((group) => ({
    fingerprint: group.fingerprint,
    count: group.count,
    bestId: group.best?.id,
    bestTitle: group.best?.title,
    items: group.items.map((product) => ({
      id: product.id,
      title: product.title,
      price: product.price,
      sourceProvider: product.sourceProvider,
      externalProductId: product.externalProductId,
      status: product.status,
      updatedAt: product.updatedAt,
    })),
  }));

  return NextResponse.json({ success: true, groups, count: groups.length });
}
