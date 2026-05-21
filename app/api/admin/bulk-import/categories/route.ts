import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { delayEpnRequest, finishEpnImportJob, getEpnHotGoods, mapEpnGoodToProduct, tryStartEpnImportJob } from '@/lib/epn';
import { importNormalizedProduct } from '@/lib/importProduct';

const defaultCategories = [
  'Наушники',
  'Косметика',
  'Подарки девушке',
  'Техника для кухни',
  'Игровые аксессуары',
  'Спорт',
  'Товары для авто',
  'Автоаксессуары',
];

export async function POST(request: NextRequest) {
  let started = false;
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    started = tryStartEpnImportJob();
    if (!started) {
      return NextResponse.json({ success: false, error: 'Уже запущен ePN импорт. Дождитесь завершения.' }, { status: 409 });
    }
    const categories = (Array.isArray(body.categories) && body.categories.length ? body.categories : defaultCategories).slice(0, 5);
    const perCategory = Math.min(Number(body.perCategory || 2), 2);

    let imported = 0;
    let drafted = 0;
    let failed = 0;

    for (const category of categories) {
      await delayEpnRequest();
      const goods = await getEpnHotGoods({ q: category, limit: perCategory });
      for (const good of goods) {
        try {
          const mapped = mapEpnGoodToProduct(good);
          const saved = await importNormalizedProduct({
            ...mapped,
            sourceProvider: 'epn',
            sourceType: 'epn',
            tags: ['epn', category, mapped.category, mapped.marketplace].filter(Boolean),
          });
          if (saved?.status === 'draft') drafted += 1;
          if (saved) imported += 1;
        } catch (error) {
          console.error('Category import item failed:', error);
          failed += 1;
        }
        await delayEpnRequest();
      }
    }

    return NextResponse.json({ success: true, imported, drafted, failed, categories: categories.length });
  } catch (error) {
    console.error('Category import error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Ошибка импорта категорий' },
      { status: (error as any)?.status === 429 ? 429 : 500 }
    );
  } finally {
    if (started) finishEpnImportJob();
  }
}
