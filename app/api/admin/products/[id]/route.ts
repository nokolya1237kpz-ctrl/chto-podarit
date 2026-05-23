import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { updateProduct, deleteProduct } from '@/lib/supabase';
import type { Product } from '@/types/product';
import { applyAutoFillToProduct } from '@/lib/productAutoFill';
import { isPublishableProduct } from '@/lib/productNormalize';

export async function PUT(
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
    const body = await request.json();

    const filled = applyAutoFillToProduct(body);
    const publishable = isPublishableProduct(filled);
    const updates: Partial<
      Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
    > = {
      ...filled,
      ...(filled.status === 'active' && !publishable ? { status: 'draft' as const, isActive: false } : {}),
    };

    const updated = await updateProduct(id, updates);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating product:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const force = request.nextUrl.searchParams.get('force') === 'true';
    const deleted = await deleteProduct(id, { force, reason: force ? 'admin_force_delete' : 'admin_soft_delete' });

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: force ? 'Product hard deleted' : 'Product soft deleted',
    });
  } catch (error) {
    console.error('Error deleting product:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
