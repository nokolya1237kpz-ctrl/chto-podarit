import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { createProduct } from '@/lib/supabase';
import { fetchEpnProductMetadata } from '@/lib/epn';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const affiliateUrl = searchParams.get('affiliateUrl') || undefined;
    const epnToken = searchParams.get('epnToken') || undefined;

    if (!affiliateUrl) {
      return NextResponse.json({ success: false, error: 'Не указана партнерская ссылка' }, { status: 400 });
    }

    const metadata = await fetchEpnProductMetadata(affiliateUrl, epnToken);

    if (!metadata) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: metadata });
  } catch (error) {
    console.error('Error fetching ePN metadata:', error);
    return NextResponse.json({ success: false, error: 'Ошибка получения метаданных' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const body = await request.json();
    const affiliateUrl = body.affiliateUrl || body.url;
    const epnToken = body.epnToken || body.token;
    const advertiserName = body.advertiserName || body.advertiser || 'ePN';

    if (!affiliateUrl) {
      return NextResponse.json({ success: false, error: 'Не указана партнерская ссылка' }, { status: 400 });
    }

    let metadata = null;
    let metadataError: string | null = null;

    try {
      metadata = await fetchEpnProductMetadata(affiliateUrl, epnToken);
    } catch (error) {
      metadataError = error instanceof Error ? error.message : String(error);
      console.error('Error fetching ePN metadata for quick-add:', error);
      metadata = null;
    }

    const createAsDraft = !metadata;
    const productStatus = createAsDraft ? 'draft' : (body.status === 'active' || body.status === 'draft' ? body.status : 'draft');

    const product = {
      title: body.title || metadata?.title || 'Новый товар ePN',
      description: body.description || metadata?.description || '',
      price: body.price ?? metadata?.price ?? 0,
      currency: body.currency || metadata?.currency || 'RUB',
      imageUrl: body.imageUrl || metadata?.imageUrl || '',
      originalUrl: body.originalUrl || affiliateUrl,
      affiliateUrl,
      externalProductId: body.externalProductId || metadata?.externalProductId || epnToken || undefined,
      sourceProvider: 'epn' as const,
      sourceType: 'epn' as const,
      marketplace: body.marketplace || metadata?.marketplace || 'ePN',
      advertiserName,
      epnToken: epnToken || undefined,
      tags: body.tags || metadata?.tags || [],
      recipients: body.recipients || [],
      budget: body.budget || '',
      interests: body.interests || [],
      occasions: body.occasions || [],
      giftTypes: body.giftTypes || [],
      wowRating: body.wowRating ?? 0,
      riskLevel: body.riskLevel || 'low',
      isBestPrice: body.isBestPrice ?? false,
      discountPercent: body.discountPercent ?? null,
      isActive: createAsDraft ? false : true,
      status: productStatus,
      lastSyncedAt: createAsDraft ? undefined : new Date().toISOString(),
    };

    if (!createAsDraft && product.title && product.price > 0 && product.imageUrl) {
      product.status = 'active';
    }

    const saved = await createProduct(product);
    if (!saved) {
      return NextResponse.json({ success: false, error: 'Не удалось создать товар' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: saved,
      warning: createAsDraft ? 'Автоматически получить данные товара не удалось. Черновик создан — заполните информацию вручную.' : undefined,
      metadataError: metadataError || undefined,
    });
  } catch (error) {
    console.error('Error quick-adding ePN product:', error);
    const message = error instanceof Error ? error.message : 'Ошибка создания товара';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
