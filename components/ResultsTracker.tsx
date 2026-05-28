"use client";
import { useEffect } from 'react';
import { event } from '../lib/metrics';
import { trackAnalyticsEvent } from '@/src/hooks/useTrackEvent';

export default function ResultsTracker({ count, params }: { count: number; params?: Record<string, string> }) {
  useEffect(() => {
    try {
      event('results_view', { count, params });
      trackAnalyticsEvent('gift_quiz_complete', {
        metadata: {
          recipient: params?.recipient,
          budget: params?.budget,
          interests: params?.interest ? [params.interest] : [],
          occasions: params?.occasion ? [params.occasion] : [],
          results_count: count,
        },
      });
    } catch (e) { /* ignore */ }
  }, [count]);
  return null;
}
