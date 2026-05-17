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
        { success: false, error: 'Требуется пароль' },
        { status: 400 }
      );
    }

    if (!verifyAdminPassword(password)) {
      return NextResponse.json(
        { success: false, error: 'Неверный пароль' },
        { status: 401 }
      );
    }

    // Create session
    const sessionCreated = await createAdminSession(password);

    if (!sessionCreated) {
      return NextResponse.json(
        { success: false, error: 'Не удалось создать сессию' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Сессия администратора создана',
    });
  } catch (error) {
    console.error('Ошибка при входе в админку:', error);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
