import 'server-only';

import type { Product } from '@entities/product/types';
import { supabaseAdmin } from '@lib/supabase';
import { getDedupeKey } from '@entities/product/lib/productNormalize';

export async function savePriceSnapshot(result: Partial<Product> & { query?: string; sourcePage?: string }) {
  if (!supabaseAdmin || !result.price) return;
  const key = getDedupeKey(result);
  const now = new Date().toISOString();

  try {
    await supabaseAdmin.from('price_search_results').upsert({
      result_key: key,
      query: result.query || '',
      title: result.title || '',
      marketplace: result.marketplace || 'other',
      price: result.price,
      old_price: result.oldPrice || null,
      url: result.affiliateUrl || result.originalUrl || '',
      image_url: result.imageUrl || null,
      source_provider: result.sourceProvider || result.sourceType || 'compare',
      checked_at: now,
    }, { onConflict: 'result_key' });
  } catch {
    // Optional table may not exist yet.
  }

  if (!result.id) return;
  try {
    await supabaseAdmin.from('price_history').insert({
      product_id: result.id,
      current_price: result.price,
      old_price: result.oldPrice || null,
      checked_at: now,
    });
  } catch {
    // Optional table may not exist yet.
  }
}
