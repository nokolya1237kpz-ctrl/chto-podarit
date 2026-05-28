import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { trackEvent } from '@server/analytics';
import { getOrCreateAnalyticsSession } from '@server/analytics/session';

const schema = z.object({
  event: z.string().min(1).max(80),
  productId: z.string().optional().nullable(),
  query: z.string().max(500).optional().nullable(),
  category: z.string().max(120).optional().nullable(),
  marketplace: z.string().max(120).optional().nullable(),
  userSession: z.string().max(120).optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().default({}),
});

const rateLimit = new Map<string, { count: number; resetAt: number }>();

function isLimited(key: string) {
  const now = Date.now();
  const current = rateLimit.get(key);
  if (!current || current.resetAt < now) {
    rateLimit.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 180;
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ success: true, ignored: 'invalid_payload' });
    }

    const session = parsed.data.userSession || await getOrCreateAnalyticsSession();
    const limitKey = session || request.headers.get('x-forwarded-for') || 'anonymous';
    if (isLimited(limitKey)) {
      return NextResponse.json({ success: true, ignored: 'rate_limited' });
    }

    await trackEvent(parsed.data.event, {
      productId: parsed.data.productId,
      query: parsed.data.query,
      category: parsed.data.category,
      marketplace: parsed.data.marketplace,
      userSession: session,
      metadata: parsed.data.metadata,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
