'use server';

import { updateProduct, deleteProduct } from '@lib/supabase';

export async function publishProductAction(id: string) {
  return updateProduct(id, { status: 'active', isActive: true });
}

export async function deleteProductForeverAction(id: string) {
  return deleteProduct(id, { force: true });
}

export async function archiveProductAction(id: string) {
  return updateProduct(id, { status: 'archived', isActive: false });
}
