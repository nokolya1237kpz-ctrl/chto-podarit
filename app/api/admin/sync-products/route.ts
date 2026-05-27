import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getProductSources, upsertProductByExternalId, createProduct, logProductSync } from '@/lib/supabase';
import { getProviderById } from '@server/providers';

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const providerId = body.providerId as string | undefined;
    const sources = await getProductSources();
    const enabledSources = sources.filter((source) => source.enabled && (!providerId || source.provider_id === providerId));

    const syncResults = [] as Array<{ providerId: string; imported: number; failed: number; durationMs: number; message: string }>;

    for (const source of enabledSources) {
      const provider = getProviderById(source.provider_id);
      if (!provider) {
        await logProductSync(source.provider_id, 'error', `Провайдер ${source.provider_id} не найден`, 0, 0, 0);
        syncResults.push({ providerId: source.provider_id, imported: 0, failed: 0, durationMs: 0, message: 'Провайдер не найден' });
        continue;
      }

      const startTime = Date.now();
      let imported = 0;
      let failed = 0;

      try {
        const products = await provider.searchProducts({ limit: 100 });

        for (const product of products) {
          const normalized = {
            ...product,
            sourceProvider: source.provider_id as any,
            sourceType: source.provider_id as any,
            isActive: product.isActive !== false,
            status: product.status || 'active',
            lastSyncedAt: new Date().toISOString(),
          };

          try {
            const saved = normalized.externalProductId
              ? await upsertProductByExternalId(normalized)
              : await createProduct(normalized);
            if (saved) {
              imported += 1;
            } else {
              failed += 1;
            }
          } catch (productError) {
            console.error('Error saving product', productError);
            failed += 1;
          }
        }

        const durationMs = Date.now() - startTime;
        await logProductSync(source.provider_id, 'success', `Импортировано ${imported} товаров`, imported, failed, durationMs);
        syncResults.push({ providerId: source.provider_id, imported, failed, durationMs, message: 'Готово' });
      } catch (error) {
        const durationMs = Date.now() - startTime;
        console.error('Error syncing provider', source.provider_id, error);
        await logProductSync(source.provider_id, 'error', 'Ошибка при синхронизации', imported, failed, durationMs);
        syncResults.push({ providerId: source.provider_id, imported, failed, durationMs, message: 'Ошибка при синхронизации' });
      }
    }

    return NextResponse.json({ success: true, data: syncResults });
  } catch (error) {
    console.error('Error syncing products:', error);
    return NextResponse.json({ success: false, error: 'Не удалось синхронизировать товары' }, { status: 500 });
  }
}
