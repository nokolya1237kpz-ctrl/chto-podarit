import { NextRequest, NextResponse } from 'next/server';
import type { Product } from '@/types/product';
import { isSupabaseConfigured, searchProducts } from '@/lib/supabase';
import { mockProvider } from '@/lib/providers/mockProvider';

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
      products = await searchProducts(filters);
    }

    if (!products || products.length === 0) {
      products = await mockProvider.searchProducts({
        query: filters.query,
        recipient: filters.recipient,
        budget: filters.budget,
        interests: filters.interests,
        occasions: filters.occasions,
        giftTypes: filters.giftTypes,
        tags: filters.tags,
        marketplace: filters.marketplace,
        limit: 100,
      });
    }

    return NextResponse.json({ success: true, data: products, count: products.length });
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json({ success: false, error: 'Ошибка поиска товаров' }, { status: 500 });
  }
}
