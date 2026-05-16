import { NextRequest, NextResponse } from 'next/server';
import { getActiveProducts } from '@/lib/supabase';
import { mockProvider } from '@/lib/providers/mockProvider';
import { isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/products
 * Public endpoint to get active products
 * Falls back to mock data if Supabase is not configured
 */
export async function GET(request: NextRequest) {
  try {
    let products;

    // Try to get from Supabase if configured
    if (isSupabaseConfigured()) {
      products = await getActiveProducts();
      
      // Fall back to mock if no products found
      if (products.length === 0) {
        products = await mockProvider.searchProducts({
          limit: 100,
        });
      }
    } else {
      // Use mock provider if Supabase not configured
      products = await mockProvider.searchProducts({
        limit: 100,
      });
    }

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
      },
      { status: 500 }
    );
  }
}
