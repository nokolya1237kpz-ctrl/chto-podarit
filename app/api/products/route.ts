import { NextRequest, NextResponse } from 'next/server';
import { getActiveProducts, supabaseAdmin } from '@/lib/supabase';
import { mockProvider } from '@/lib/providers/mockProvider';

/**
 * GET /api/products
 * Public endpoint to get active products
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const useSupabase = Boolean(supabaseUrl && serviceRoleKey && supabaseAdmin);

    if (useSupabase) {
      // Use the admin client and run the authoritative query
      const products = await getActiveProducts(supabaseAdmin as any, { throwOnError: true });
      return NextResponse.json({
        success: true,
        data: products || [],
        count: (products || []).length,
        source: 'supabase',
      });
    }

    // Supabase not configured — fall back to mock provider (only when not configured)
    const products = await mockProvider.searchProducts({ limit: 100 });
    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
      source: 'mock',
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch products';
    // If SUPABASE is configured, always report source as 'supabase' on errors
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const useSupabase = Boolean(supabaseUrl && serviceRoleKey && supabaseAdmin);

    return NextResponse.json(
      {
        success: false,
        error: message,
        source: useSupabase ? 'supabase' : 'mock',
      },
      { status: 500 }
    );
  }
}
