import { NextRequest, NextResponse } from 'next/server';
import { searchAdmitadProducts, validateAdmitadProduct } from '@/lib/admitad';
import { verifyAdminSession } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    // Check admin session
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get search query
    const q = request.nextUrl.searchParams.get('q');
    if (!q || q.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '20'), 100);

    // Search products
    const products = await searchAdmitadProducts(q, limit);

    // Validate and filter products
    const validProducts = products
      .filter((product: any) => {
        const validation = validateAdmitadProduct(product);
        return validation.valid;
      });

    return NextResponse.json({
      success: true,
      query: q,
      count: validProducts.length,
      products: validProducts,
    });
  } catch (error) {
    console.error('Admitad search error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Search failed',
        success: false,
      },
      { status: 500 }
    );
  }
}
