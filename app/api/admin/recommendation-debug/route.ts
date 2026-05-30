import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getActiveProducts, supabaseAdmin } from '@/lib/supabase';
import { getProductCategory } from '@entities/product/lib/categoryMapper';
import { detectProductGender } from '@entities/product/lib/detectProductGender';
import { recommendationEngineVersion, scoreProductForGift, type GiftQuizAnswers } from '@features/gift-quiz/lib/recommendationEngine';

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const answers: GiftQuizAnswers = {
      recipient: body.recipient || undefined,
      budget: body.budget || undefined,
      occasions: body.occasion ? [body.occasion] : body.occasions || [],
      interests: body.interests ? String(body.interests).split(',').map((item) => item.trim()).filter(Boolean) : [],
      giftTypes: body.giftTypes ? String(body.giftTypes).split(',').map((item) => item.trim()).filter(Boolean) : [],
    };

    const products = await getActiveProducts(supabaseAdmin as any);
    const scored = products.map((product) => {
      const category = getProductCategory(product);
      const detectedGender = detectProductGender({ ...product, categorySlug: category.slug });
      const result = scoreProductForGift(product, answers);
      return {
        id: product.id,
        title: product.title,
        price: product.price,
        categorySlug: category.slug,
        categoryLabel: category.label,
        detectedGender,
        score: result.score,
        reasons: result.reasons,
        penalties: result.penalties,
        blocked: result.blocked,
      };
    });

    const topResults = scored
      .filter((item) => !item.blocked && item.score >= 50)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
    const blockedExamples = scored
      .filter((item) => item.blocked)
      .slice(0, 30);

    return NextResponse.json({
      success: true,
      route: '/api/admin/recommendation-debug',
      source: 'local_catalog',
      recommendationEngineVersion,
      answers,
      total: products.length,
      allowedCount: scored.filter((item) => !item.blocked && item.score >= 50).length,
      blockedCount: scored.filter((item) => item.blocked).length,
      topResults,
      blockedExamples,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Ошибка диагностики' }, { status: 500 });
  }
}
