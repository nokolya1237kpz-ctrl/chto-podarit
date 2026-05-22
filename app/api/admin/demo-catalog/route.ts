import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { importNormalizedProduct } from '@/lib/importProduct';
import seed from '@/data/demoCatalogSeed.json';

export async function POST() {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });

  const budgets = [990, 1490, 2490, 3990, 6990, 9990, 14990, 24990, 39990, 59990];
  let imported = 0;
  let drafted = 0;

  for (let i = 0; i < 300; i += 1) {
    const item = seed[i % seed.length] as any;
    const variant = Math.floor(i / seed.length) + 1;
    const price = budgets[i % budgets.length];
    const saved = await importNormalizedProduct({
      title: variant > 1 ? `${item.title} ${variant}` : item.title,
      description: `Curated seed item for fast catalog start. Категория: ${item.category}.`,
      price,
      oldPrice: Math.round(price * 1.18),
      imageUrl: '',
      originalUrl: '',
      affiliateUrl: '',
      marketplace: item.marketplace,
      externalProductId: `demo:${i + 1}`,
      sourceProvider: 'manual',
      sourceType: 'manual',
      category: item.category,
      tags: [...(item.tags || []), 'demo-catalog', item.category],
      status: 'draft',
      isActive: false,
    });
    if (saved) imported += 1;
    if (saved?.status === 'draft') drafted += 1;
  }

  return NextResponse.json({ success: true, imported, drafted, total: 300 });
}
