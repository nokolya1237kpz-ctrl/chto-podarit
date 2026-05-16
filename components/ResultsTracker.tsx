"use client";
import { useEffect } from 'react';
import { event } from '../lib/metrics';

export default function ResultsTracker({ count, params }: { count: number; params?: Record<string, string> }) {
  useEffect(() => {
    try { event('results_view', { count, params }); } catch (e) { /* ignore */ }
  }, [count]);
  return null;
}
