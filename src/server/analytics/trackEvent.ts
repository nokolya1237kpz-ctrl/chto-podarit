import 'server-only';

import { supabaseAdmin } from '@lib/supabase';
import type { AnalyticsEventName } from './events';

export type TrackEventPayload = {
  productId?: string | null;
  query?: string | null;
  category?: string | null;
  marketplace?: string | null;
  userSession?: string | null;
  metadata?: Record<string, any>;
};

function normalizeUuid(value?: string | null) {
  if (!value) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

export async function trackEvent(eventName: AnalyticsEventName, payload: TrackEventPayload = {}) {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[analytics]', eventName, payload);
    }

    if (!supabaseAdmin) return { success: true, skipped: 'supabase_not_configured' };

    const { error } = await supabaseAdmin.from('analytics_events').insert({
      event: eventName,
      product_id: normalizeUuid(payload.productId),
      query: payload.query || null,
      category: payload.category || null,
      marketplace: payload.marketplace || null,
      user_session: payload.userSession || null,
      metadata: payload.metadata || {},
    });

    if (error && process.env.NODE_ENV !== 'production') {
      console.debug('[analytics] write skipped', error);
    }

    return { success: true, error: error?.message };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[analytics] failed', error);
    }
    return { success: true, error: error instanceof Error ? error.message : String(error) };
  }
}
