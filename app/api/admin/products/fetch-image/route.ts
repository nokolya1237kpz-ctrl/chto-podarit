import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { fetchProductImageFromUrl } from '@/lib/imageMetadata';

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const body = await request.json();
    const url = typeof body?.url === 'string' ? body.url.trim() : '';

    if (!url) {
      return NextResponse.json({ success: false, error: 'Не указан URL' }, { status: 400 });
    }

    const imageUrl = await fetchProductImageFromUrl(url);

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Картинку не удалось получить автоматически' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Error fetching image from URL:', error);
    const message = error instanceof Error ? error.message : 'Ошибка при получении картинки';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
