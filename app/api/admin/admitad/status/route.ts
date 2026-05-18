import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getAdmitadStatus } from '@/lib/admitad';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = await getAdmitadStatus();
    const statusCode = status.success ? 200 : 500;

    return NextResponse.json({ ...status, connected: status.connected }, { status: statusCode });
  } catch (error) {
    console.error('Admitad status error:', error);
    return NextResponse.json(
      {
        success: false,
        connected: false,
        hasClientId: Boolean(process.env.ADMITAD_CLIENT_ID),
        hasClientSecret: Boolean(process.env.ADMITAD_CLIENT_SECRET),
        tokenReceived: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
