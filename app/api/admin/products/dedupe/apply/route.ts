import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { searchProducts, supabaseAdmin } from '@lib/supabase';
import { groupDuplicateProducts } from '@entities/product/lib/dedupeProducts';

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ success: false, error: 'Supabase не настроен' }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const mode = body.mode === 'delete' ? 'delete' : 'archive';
  const products = await searchProducts({ includeArchived: false }, supabaseAdmin as any);
  const groups = groupDuplicateProducts(products);
  let affected = 0;

  for (const group of groups) {
    const keepId = group.best?.id;
    const duplicateIds = group.items.map((product) => product.id).filter((id) => id !== keepId);
    if (!duplicateIds.length) continue;
    const result = mode === 'delete'
      ? await supabaseAdmin.from('products').delete().in('id', duplicateIds)
      : await supabaseAdmin.from('products').update({ status: 'archived', is_active: false, deleted_reason: 'duplicate' }).in('id', duplicateIds);
    if (!result.error) affected += duplicateIds.length;
  }

  return NextResponse.json({ success: true, affected, mode });
}
