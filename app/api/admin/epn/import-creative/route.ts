import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { fetchPageMetadata } from '@/lib/imageMetadata';
import { createProduct } from '@/lib/supabase';
import { detectMarketplaceFromProductUrl, type EpnCreative } from '@/lib/epn';
import { applyAutoFillToProduct } from '@/lib/productAutoFill';

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const body = await request.json();
    const creative = body?.creative as Partial<EpnCreative> | undefined;

    if (!creative || typeof creative !== 'object') {
      return NextResponse.json({ success: false, error: 'Не указан креатив для импорта' }, { status: 400 });
    }

    const originalUrl = creative.originalUrl || '';
    const affiliateUrl = creative.affiliateUrl || creative.deeplinkUrl || '';

    if (!originalUrl) {
      return NextResponse.json({ success: false, error: 'Креатив не содержит URL товара' }, { status: 400 });
    }
    if (!affiliateUrl) {
      return NextResponse.json({ success: false, error: 'Креатив не содержит партнёрскую ссылку' }, { status: 400 });
    }

    const metadata = !creative.title || !creative.title.trim()
      ? await fetchPageMetadata(originalUrl)
      : await fetchPageMetadata(originalUrl);

    const title = metadata?.title || creative.title || creative.offerName || 'ePN товар';
    const description = metadata?.description || creative.offerName || '';
    const imageUrl = metadata?.imageUrl || undefined;
    const hasUsefulMetadata = Boolean(metadata?.title || metadata?.imageUrl);
    const status = hasUsefulMetadata ? 'active' : 'draft';

    const product = applyAutoFillToProduct({
      title,
      description,
      price: 0,
      currency: 'RUB',
      imageUrl,
      originalUrl,
      affiliateUrl,
      marketplace: creative.marketplace || detectMarketplaceFromProductUrl(originalUrl),
      externalProductId: creative.token || creative.id || affiliateUrl,
      sourceProvider: 'epn',
      sourceType: 'epn',
      epnToken: creative.token || affiliateUrl,
      advertiserName: creative.offerName || creative.title || 'ePN',
      recipients: [],
      budget: '',
      interests: [],
      occasions: [],
      giftTypes: [],
      tags: ['epn', creative.marketplace || detectMarketplaceFromProductUrl(originalUrl)].filter(Boolean),
      wowRating: 5,
      riskLevel: 'low',
      isActive: status === 'active',
      status,
    });

    const savedProduct = await createProduct(product);

    if (!savedProduct) {
      return NextResponse.json({ success: false, error: 'Не удалось сохранить товар' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: savedProduct,
      metadataFound: hasUsefulMetadata,
    });
  } catch (error) {
    console.error('Error importing ePN creative:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Ошибка импорта креатива ePN' },
      { status: 500 }
    );
  }
}
