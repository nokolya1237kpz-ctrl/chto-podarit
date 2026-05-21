import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { parseFeed, normalizeFeedItem } from '@/lib/feedImport';
import { importNormalizedProduct } from '@/lib/importProduct';

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let feedText = '';
    let sourceProvider = 'feed';

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file');
      const url = String(form.get('url') || '');
      sourceProvider = String(form.get('sourceProvider') || 'feed');
      if (file instanceof File) {
        feedText = await file.text();
      } else if (url) {
        const response = await fetch(url, { headers: { Accept: 'application/xml,text/xml,application/json,text/csv,*/*' } });
        feedText = await response.text();
      }
    } else {
      const body = await request.json();
      sourceProvider = body.sourceProvider || 'feed';
      if (body.url) {
        const response = await fetch(body.url, { headers: { Accept: 'application/xml,text/xml,application/json,text/csv,*/*' } });
        feedText = await response.text();
      } else {
        feedText = body.content || '';
      }
    }

    if (!feedText) {
      return NextResponse.json({ success: false, error: 'Не указан feed URL или файл' }, { status: 400 });
    }

    const rows = parseFeed(feedText).slice(0, 500);
    let imported = 0;
    let drafted = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        const saved = await importNormalizedProduct(normalizeFeedItem(row, sourceProvider));
        if (saved?.status === 'draft') drafted += 1;
        if (saved) imported += 1;
      } catch (error) {
        console.error('Feed item import failed:', error);
        failed += 1;
      }
    }

    return NextResponse.json({ success: true, imported, drafted, failed, total: rows.length });
  } catch (error) {
    console.error('Feed import error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Ошибка импорта feed' },
      { status: 500 }
    );
  }
}
