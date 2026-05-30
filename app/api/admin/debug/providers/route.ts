import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { runComparePipeline } from '@features/product-comparison/lib/comparePipeline';

const OPTIONAL_CONFIGURED = ['aliexpress', 'yandex_market', 'dns_shop', 'citilink', 'megamarket', 'mvideo', 'eldorado', 'epn'];

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'наушники';
  const result = await runComparePipeline({ query });
  const samples: Record<string, any[]> = {
    local: result.items.filter((item) => item.sourceProvider !== 'wildberries' && item.sourceProvider !== 'ozon').slice(0, 3),
    wildberries: result.items.filter((item) => item.sourceProvider === 'wildberries').slice(0, 3),
    ozon: result.items.filter((item) => item.sourceProvider === 'ozon').slice(0, 3),
  };
  const providerStatuses: Record<string, any> = { ...result.sourceStats };

  for (const provider of OPTIONAL_CONFIGURED) {
    providerStatuses[provider] ||= { status: 'configured', count: 0, reason: 'optional_not_checked', configured: true, searchable: false };
  }
  for (const [provider, status] of Object.entries(providerStatuses)) {
    providerStatuses[provider] = {
      provider,
      query,
      configured: true,
      reachable: status.status !== 'failed',
      searchable: status.status === 'searchable',
      normalizedItemsCount: status.count,
      rawItemsCount: status.count,
      lastCheckedAt: new Date().toISOString(),
      ...status,
    };
  }

  return NextResponse.json({
    success: true,
    query,
    count: result.count,
    totalCount: result.count,
    localCount: result.sourceStats.local?.count || 0,
    providerCount: Math.max(0, result.count - (result.sourceStats.local?.count || 0)),
    diagnostics: result.diagnostics,
    samples,
    providerStatuses,
  });
}
