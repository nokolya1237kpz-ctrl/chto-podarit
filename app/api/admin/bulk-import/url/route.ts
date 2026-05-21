import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { browserParser } from '@/lib/parsers/browserParser';
import { normalizeParsedProduct } from '@/lib/parsers/normalizeParsedProduct';
import { importNormalizedProduct } from '@/lib/importProduct';

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const body = await request.json();
    const urls = Array.isArray(body.urls) ? body.urls : String(body.url || '').split(/\s+/).filter(Boolean);
    if (urls.length === 0) {
      return NextResponse.json({ success: false, error: 'Не указан URL' }, { status: 400 });
    }

    let imported = 0;
    let drafted = 0;
    let failed = 0;

    for (const url of urls.slice(0, 30)) {
      try {
        const parsed = await browserParser(url);
        const saved = await importNormalizedProduct(normalizeParsedProduct(parsed, 'manual'));
        if (saved?.status === 'draft') drafted += 1;
        if (saved) imported += 1;
      } catch (error) {
        console.error('URL import failed:', error);
        failed += 1;
      }
    }

    return NextResponse.json({ success: true, imported, drafted, failed, total: urls.length });
  } catch (error) {
    console.error('URL bulk import error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Ошибка импорта URL' },
      { status: 500 }
    );
  }
}
