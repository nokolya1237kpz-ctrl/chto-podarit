import { NextRequest, NextResponse } from 'next/server';
import { createAdminSession, verifyAdminPassword } from '@/lib/adminAuth';

/**
 * POST /api/admin/login
 * Admin login endpoint - sets httpOnly cookie on success
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password required' },
        { status: 400 }
      );
    }

    if (!verifyAdminPassword(password)) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create session
    const sessionCreated = await createAdminSession(password);

    if (!sessionCreated) {
      return NextResponse.json(
        { success: false, error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Admin session created',
    });
  } catch (error) {
    console.error('Error in admin login:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
