'use client';

import { useCallback } from 'react';

type TrackPayload = {
  productId?: string | null;
  query?: string | null;
  category?: string | null;
  marketplace?: string | null;
  metadata?: Record<string, any>;
};

function getSessionId() {
  if (typeof window === 'undefined') return '';
  const key = 'cp_session';
  let session = localStorage.getItem(key);
  if (!session) {
    session = crypto.randomUUID();
    localStorage.setItem(key, session);
  }
  return session;
}

export function trackAnalyticsEvent(event: string, payload: TrackPayload = {}) {
  if (typeof window === 'undefined') return;
  const body = JSON.stringify({ event, userSession: getSessionId(), ...payload });

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[analytics]', event, payload);
  }

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/track', new Blob([body], { type: 'application/json' }));
      return;
    }
  } catch {
    // Fallback to fetch below.
  }

  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function useTrackEvent() {
  return useCallback((event: string, payload: TrackPayload = {}) => {
    trackAnalyticsEvent(event, payload);
  }, []);
}
