import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getProductSourcesWithStats, updateProductSource, createProductSource } from '@/lib/supabase';

export async function GET() {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const sources = await getProductSourcesWithStats();
    return NextResponse.json({ success: true, data: sources });
  } catch (error) {
    console.error('Error fetching product sources:', error);
    return NextResponse.json({ success: false, error: 'Ошибка загрузки источников' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const body = await request.json();
    const source = await createProductSource({
      provider_id: body.provider_id,
      name: body.name,
      enabled: !!body.enabled,
      api_base_url: body.api_base_url || null,
      affiliate_id: body.affiliate_id || null,
      campaign_id: body.campaign_id || null,
      notes: body.notes || null,
    });

    if (!source) {
      return NextResponse.json({ success: false, error: 'Не удалось создать источник' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: source });
  } catch (error) {
    console.error('Error creating product source:', error);
    return NextResponse.json({ success: false, error: 'Ошибка создания источника' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Не указан id источника' }, { status: 400 });
    }

    const source = await updateProductSource(body.id, {
      provider_id: body.provider_id,
      name: body.name,
      enabled: body.enabled,
      api_base_url: body.api_base_url,
      affiliate_id: body.affiliate_id,
      campaign_id: body.campaign_id,
      notes: body.notes,
    });

    if (!source) {
      return NextResponse.json({ success: false, error: 'Не удалось обновить источник' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: source });
  } catch (error) {
    console.error('Error updating product source:', error);
    return NextResponse.json({ success: false, error: 'Ошибка обновления источника' }, { status: 500 });
  }
}
