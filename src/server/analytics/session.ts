import 'server-only';

import { cookies } from 'next/headers';

export const ANALYTICS_SESSION_COOKIE = 'cp_session';

export async function getOrCreateAnalyticsSession() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(ANALYTICS_SESSION_COOKIE)?.value;
  if (existing) return existing;

  const sessionId = crypto.randomUUID();
  cookieStore.set(ANALYTICS_SESSION_COOKIE, sessionId, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return sessionId;
}
