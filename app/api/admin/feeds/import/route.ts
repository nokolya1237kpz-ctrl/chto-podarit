import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { parseFeed, normalizeFeedItem } from '@/lib/feedImport';
import { getBrowserHeaders } from '@/lib/providerHttp';
import { importFeedRows } from '@/lib/feedPipeline';

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });

  try {
    const body = await request.json();
    const url = String(body.url || '');
    const marketplace = String(body.marketplace || 'feed');
    const format = String(body.format || 'auto');
    if (!url) return NextResponse.json({ success: false, error: 'Не указан feed URL' }, { status: 400 });

    const response = await fetch(url, { headers: { ...getBrowserHeaders(), Accept: 'application/xml,text/xml,application/json,text/csv,*/*' } });
    if (!response.ok) return NextResponse.json({ success: false, error: `Feed fetch failed: ${response.status}` }, { status: 400 });
    const text = await response.text();
    const rows = parseFeed(text, format === 'auto' ? response.headers.get('content-type') || '' : format).slice(0, Number(body.limit || 1000));

    const report = await importFeedRows(rows, 'feed', marketplace, url);

    return NextResponse.json({
      success: true,
      imported: report.importedActive + report.importedDraft,
      drafted: report.importedDraft,
      failed: report.errors,
      total: rows.length,
      ...report,
      schedule: body.scheduleDaily ? 'daily_requested' : 'manual',
      lastSuccessfulLoadAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Ошибка импорта feed' }, { status: 500 });
  }
}
