// /app/api/odoo/leave/requests/route.ts

import { NextResponse } from 'next/server';
import { getLeaveRequests } from '@/lib/odooXml';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');
    if (!uid) {
      return NextResponse.json(
        { error: 'Missing or invalid uid' },
        { status: 400 }
      );
    }
    const requests = await getLeaveRequests(parseInt(uid, 10));
    return NextResponse.json(requests, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
