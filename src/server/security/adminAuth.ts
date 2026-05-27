import 'server-only';

import { cookies } from 'next/headers';
import crypto from 'crypto';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_NAME = 'admin_session';
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Hash password with SHA256
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verify admin password
 */
export function verifyAdminPassword(password: string): boolean {
  if (!ADMIN_PASSWORD) {
    console.warn('ADMIN_PASSWORD not set in environment');
    return false;
  }
  return password === ADMIN_PASSWORD;
}

/**
 * Create admin session (server action)
 */
export async function createAdminSession(password: string): Promise<boolean> {
  if (!verifyAdminPassword(password)) {
    return false;
  }

  const cookieStore = await cookies();
  const sessionToken = crypto.randomBytes(32).toString('hex');

  cookieStore.set(SESSION_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY,
    path: '/',
  });

  return true;
}

/**
 * Verify admin session (server-only)
 */
export async function verifyAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_NAME);
    return !!sessionToken?.value;
  } catch (error) {
    return false;
  }
}

/**
 * Clear admin session (server action)
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_NAME);
}

/**
 * Middleware to check admin access
 */
export async function requireAdminAuth(): Promise<void> {
  const isAuthed = await verifyAdminSession();
  if (!isAuthed) {
    throw new Error('Unauthorized: Admin session required');
  }
}
