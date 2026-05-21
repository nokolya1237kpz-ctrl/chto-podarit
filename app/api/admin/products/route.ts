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
import { applyAutoFillToProduct } from '@/lib/productAutoFill';
import { isPublishableProduct } from '@/lib/productNormalize';

/**
 * GET /api/admin/products
 * Get all products (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Нет доступа' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || undefined;
    const marketplace = searchParams.get('marketplace') || undefined;
    const sourceProvider = searchParams.get('sourceType') || undefined;
    const rawStatus = searchParams.get('status') || undefined;
    const status = rawStatus && rawStatus !== 'all' ? rawStatus : undefined;
    const includeArchived = rawStatus === 'all';
    const isActive = searchParams.get('isActive')
      ? searchParams.get('isActive') === 'true'
      : undefined;

    const products = await searchProducts({
      query: query,
      marketplace: marketplace,
      sourceProvider: sourceProvider,
      status: status,
      isActive: isActive,
      includeArchived,
    });

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка загрузки товаров' },
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
        { success: false, error: 'Нет доступа' },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'База данных не настроена' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const filled = applyAutoFillToProduct({
      ...body,
      status: body.status ?? 'active',
      isActive: body.isActive ?? true,
    });
    const publishable = isPublishableProduct(filled);
    const product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
      ...filled,
      status: publishable ? filled.status : 'draft',
      isActive: publishable ? filled.isActive : false,
    };

    const created = await createProduct(product);

    if (!created) {
      return NextResponse.json(
        { success: false, error: 'Не удалось создать товар' },
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
      { success: false, error: 'Не удалось создать товар' },
      { status: 500 }
    );
  }
}
