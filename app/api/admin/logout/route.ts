import { NextRequest, NextResponse } from 'next/server';
import { clearAdminSession } from '@/lib/adminAuth';

/**
 * POST /api/admin/logout
 * Admin logout endpoint - clears httpOnly cookie
 */
export async function POST(request: NextRequest) {
  try {
    await clearAdminSession();

    return NextResponse.json({
      success: true,
      message: 'Logged out',
    });
  } catch (error) {
    console.error('Error in admin logout:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
