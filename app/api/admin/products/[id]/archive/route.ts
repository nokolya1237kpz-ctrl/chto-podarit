import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { updateProduct } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdminSession();

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const restore = body?.restore === true;

    const updated = await updateProduct(id, restore
      ? { status: 'draft', isActive: false }
      : { status: 'archived', isActive: false }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update product archive state' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error archiving product:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to update product archive state' },
      { status: 500 }
    );
  }
}
