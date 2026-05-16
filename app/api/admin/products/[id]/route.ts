import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { updateProduct, deleteProduct } from '@/lib/supabase';
import type { Product } from '@/types/product';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * PUT /api/admin/products/[id]
 * Update a product (admin only)
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
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
    const updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>> =
      body;

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

/**
 * DELETE /api/admin/products/[id]
 * Soft delete a product (admin only)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
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
    const deleted = await deleteProduct(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
