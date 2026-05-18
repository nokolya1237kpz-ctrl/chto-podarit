import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateAdmitadProduct } from '@/lib/admitad';
import { verifyAdminSession } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  try {
    // Check admin session
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { product } = body;

    if (!product) {
      return NextResponse.json(
        { error: 'Product data required' },
        { status: 400 }
      );
    }

    // Validate product
    const validation = validateAdmitadProduct(product);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Invalid product',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Prepare product for database
    const dbProduct = {
      title: product.title,
      description: product.description || null,
      image_url: product.imageUrl,
      price: product.price,
      original_url: product.originalUrl,
      affiliate_url: product.affiliateUrl || product.originalUrl,
      marketplace: product.marketplace,
      categories: product.categories || [],
      brand: product.brand || null,
      currency: product.currency || 'RUB',
      wow_rating: product.wowRating || 5,
      source_provider: 'admitad',
      source_product_id: product.sourceProductId || null,
      status: 'active',
      is_active: true,
      raw_data: product.rawData || null,
    };

    // Verify supabaseAdmin is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { 
          error: 'Database connection error',
          success: false,
        },
        { status: 500 }
      );
    }

    // Insert into database
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([dbProduct])
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to save product',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product imported successfully',
      product: data,
    });
  } catch (error) {
    console.error('Admitad import error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Import failed',
        success: false,
      },
      { status: 500 }
    );
  }
}
