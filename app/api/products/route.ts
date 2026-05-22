import { NextRequest, NextResponse } from 'next/server';
import { getActiveProducts, supabaseAdmin } from '@/lib/supabase';

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

    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
      source: 'not_configured',
      message: 'Supabase is not configured; public product catalog is empty.',
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
        source: useSupabase ? 'supabase' : 'not_configured',
      },
      { status: useSupabase ? 500 : 200 }
    );
  }
}
