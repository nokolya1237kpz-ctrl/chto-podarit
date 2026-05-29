import { NextRequest, NextResponse } from 'next/server';
import type { Product } from '@/types/product';
import { getActiveProducts, isSupabaseConfigured, searchProducts, supabaseAdmin } from '@/lib/supabase';
import { matchProducts } from '@/lib/productMatcher';

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      query: searchParams.get('query') || undefined,
      recipient: searchParams.get('recipient') || undefined,
      budget: searchParams.get('budget') || undefined,
      interests: parseList(searchParams.get('interests')),
      occasions: parseList(searchParams.get('occasions')),
      giftTypes: parseList(searchParams.get('giftTypes')),
      tags: parseList(searchParams.get('tags')),
      marketplace: searchParams.get('marketplace') || undefined,
      status: 'active',
      isActive: true,
    } as any;

    let products: Product[] = [];
    if (isSupabaseConfigured()) {
      const hasGiftFilters = Boolean(filters.recipient || filters.budget || filters.interests.length || filters.occasions.length || filters.giftTypes.length);
      if (hasGiftFilters) {
        const baseProducts = filters.query ? await searchProducts(filters) : await getActiveProducts(supabaseAdmin as any);
        products = matchProducts(baseProducts, {
          recipient: filters.recipient,
          budget: filters.budget,
          interests: filters.interests,
          occasions: filters.occasions,
          giftTypes: filters.giftTypes,
        });
      } else {
        products = await searchProducts(filters);
      }
    }

    return NextResponse.json({ success: true, data: products, count: products.length });
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json({ success: false, error: 'Ошибка поиска товаров' }, { status: 500 });
  }
}
