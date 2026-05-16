import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import {
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase';
import type { Product } from '@/types/product';

/**
 * GET /api/admin/products
 * Get all products (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || undefined;
    const marketplace = searchParams.get('marketplace') || undefined;
    const sourceType = searchParams.get('sourceType') || undefined;
    const isActive = searchParams.get('isActive')
      ? searchParams.get('isActive') === 'true'
      : undefined;

    const products = await searchProducts({
      query: query,
      marketplace: marketplace,
      sourceType: sourceType,
      isActive: isActive,
    });

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products
 * Create a new product (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = body;

    const created = await createProduct(product);

    if (!created) {
      return NextResponse.json(
        { success: false, error: 'Failed to create product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: created,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
