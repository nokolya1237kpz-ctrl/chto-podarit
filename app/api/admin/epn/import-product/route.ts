import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { createProduct } from '@/lib/supabase';
import { mapEpnGoodToProduct, detectMarketplaceFromUrl, generateEpnDeeplink } from '@/lib/epn';
import { applyAutoFillToProduct } from '@/lib/productAutoFill';

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const body = await request.json();
    const good = body?.good;
    const recipients = Array.isArray(body?.recipients) ? body.recipients : [];
    const interests = Array.isArray(body?.interests) ? body.interests : [];
    const occasions = Array.isArray(body?.occasions) ? body.occasions : [];
    const giftTypes = Array.isArray(body?.giftTypes) ? body.giftTypes : [];
    const tags = Array.isArray(body?.tags) ? body.tags : [];

    if (!good || typeof good !== 'object') {
      return NextResponse.json({ success: false, error: 'Не указан товар для импорта' }, { status: 400 });
    }

    const productData = mapEpnGoodToProduct(good);

    if (!productData.originalUrl) {
      return NextResponse.json({ success: false, error: 'Товар не содержит ссылку для сохранения' }, { status: 400 });
    }

    let affiliateUrl = productData.affiliateUrl || '';
    let deeplinkWarning: string | undefined;

    if (!affiliateUrl && productData.originalUrl) {
      try {
        const deeplinkResult = await generateEpnDeeplink(productData.originalUrl, {
          offerId: productData.offerId,
        });
        affiliateUrl = deeplinkResult.affiliateUrl;
      } catch (error) {
        console.warn('ePN deeplink generation failed during import:', error);
        deeplinkWarning = 'Партнёрская ссылка не создана. Сохранена оригинальная ссылка.';
      }
    }

    const product = applyAutoFillToProduct({
      title: productData.title,
      description: productData.description,
      price: productData.price,
      currency: productData.currency,
      imageUrl: productData.imageUrl,
      originalUrl: productData.originalUrl,
      affiliateUrl: affiliateUrl || productData.originalUrl,
      marketplace: productData.marketplace || detectMarketplaceFromUrl(productData.originalUrl),
      externalProductId: productData.externalProductId || productData.id,
      sourceProvider: 'epn' as const,
      sourceType: 'epn' as const,
      epnToken: affiliateUrl || productData.originalUrl,
      advertiserName: productData.title,
      recipients,
      budget: '',
      interests,
      occasions,
      giftTypes,
      tags,
      wowRating: 5,
      riskLevel: 'low' as const,
      isActive: productData.price > 0,
      status: productData.price > 0 ? 'active' as const : 'draft' as const,
    });

    const savedProduct = await createProduct(product);
    if (!savedProduct) {
      return NextResponse.json({ success: false, error: 'Не удалось сохранить товар' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: savedProduct,
      warning: deeplinkWarning,
    });
  } catch (error) {
    console.error('Error importing ePN product:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Ошибка импорта товара' },
      { status: 500 }
    );
  }
}
