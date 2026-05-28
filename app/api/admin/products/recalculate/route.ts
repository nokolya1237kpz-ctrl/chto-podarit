import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { autoFillProductFields } from '@entities/product/lib/productAutoFill';
import { getProductCategory } from '@entities/product/lib/categoryMapper';
import { calculateQualityScore } from '@entities/product';

export async function POST() {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ success: false, error: 'Supabase не настроен' }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .neq('status', 'archived')
    .limit(5000);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  let updated = 0;
  let failed = 0;

  for (const row of data || []) {
    const product = {
      title: row.title,
      description: row.description,
      price: row.price,
      oldPrice: row.old_price,
      marketplace: row.marketplace,
      originalUrl: row.original_url,
      affiliateUrl: row.affiliate_url,
      tags: row.tags || [],
    } as any;
    const auto = autoFillProductFields(product);
    const category = getProductCategory(product);
    const tags = Array.from(new Set([...(row.tags || []), category.slug, category.label].filter(Boolean)));
    const payload = {
      recipients: auto.recipients,
      interests: auto.interests,
      occasions: auto.occasions,
      gift_types: auto.giftTypes,
      tags,
      budget: auto.budget || row.budget || '',
      wow_rating: auto.wowRating,
      risk_level: auto.riskLevel,
      discount_percent: auto.discountPercent ?? row.discount_percent,
    };
    const result = await supabaseAdmin.from('products').update(payload).eq('id', row.id);
    if (result.error) failed += 1;
    else updated += 1;
  }

  return NextResponse.json({ success: true, updated, failed });
}
