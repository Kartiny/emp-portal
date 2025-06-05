// /app/api/odoo/leave/requests/route.ts

import { NextResponse } from 'next/server';
import { getLeaveRequests } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid, filters } = await req.json();
    if (typeof uid !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid uid' },
        { status: 400 }
      );
    }
    // `filters` can be undefined or { year?: number, leaveType?: number, status?: string }
    const requests = await getLeaveRequests(uid, filters);
    // Return the array directly; React code expects an array of LeaveRequest
    return NextResponse.json(requests, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
