import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { importNormalizedProduct } from '@/lib/importProduct';

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }
    const body = await request.json();
    const product = body?.product;
    if (!product) {
      return NextResponse.json({ success: false, error: 'Не указан товар' }, { status: 400 });
    }
    const saved = await importNormalizedProduct(product);
    if (!saved) {
      return NextResponse.json({ success: false, error: 'Не удалось сохранить товар' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Ошибка импорта товара' },
      { status: 500 }
    );
  }
}
