import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { parseFeed, normalizeFeedItem } from '@/lib/feedImport';
import { importFeedRows } from '@/lib/feedPipeline';

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
    if (rows.length === 0) {
      let sampleKeys: string[] = [];
      try {
        const parsed = JSON.parse(feedText);
        const sample = Array.isArray(parsed) ? parsed[0] : parsed?.products?.[0] || parsed?.items?.[0] || parsed?.offers?.[0] || parsed;
        sampleKeys = sample && typeof sample === 'object' ? Object.keys(sample).slice(0, 30) : [];
      } catch {
        sampleKeys = feedText.slice(0, 300).match(/<([a-zA-Z0-9:_-]+)/g)?.map((tag) => tag.slice(1)).slice(0, 30) || [];
      }
      return NextResponse.json({ success: false, error: 'Unsupported feed format', sampleKeys }, { status: 400 });
    }
    const report = await importFeedRows(rows, sourceProvider);
    return NextResponse.json({
      success: true,
      imported: report.importedActive + report.importedDraft,
      drafted: report.importedDraft,
      failed: report.errors,
      total: rows.length,
      ...report,
      sampleKeys: Object.keys(rows[0] || {}).slice(0, 30),
    });
  } catch (error) {
    console.error('Feed import error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Ошибка импорта feed' },
      { status: 500 }
    );
  }
}
