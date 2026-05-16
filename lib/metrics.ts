export type MetricsEvent = {
  name: string;
  payload?: Record<string, any>;
  ts?: number;
};

const ENDPOINT = process.env.NEXT_PUBLIC_METRICS_ENDPOINT || '';

export function pageView(path?: string) {
  const ev: MetricsEvent = { name: 'page_view', payload: { path: path || (typeof window !== 'undefined' ? window.location.pathname : '') }, ts: Date.now() };
  send(ev);
}

export function event(name: string, payload?: Record<string, any>) {
  const ev: MetricsEvent = { name, payload, ts: Date.now() };
  send(ev);
}

function send(ev: MetricsEvent) {
  if (ENDPOINT) {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon(ENDPOINT, JSON.stringify(ev));
      } else if (typeof fetch !== 'undefined') {
        fetch(ENDPOINT, { method: 'POST', body: JSON.stringify(ev), headers: { 'Content-Type': 'application/json' } });
      }
    } catch (e) {
      console.warn('Metrics send failed', e);
    }
  } else {
    // Fallback to console for local development
    // eslint-disable-next-line no-console
    console.log('[metrics]', ev);
  }
}

export default { pageView, event };
