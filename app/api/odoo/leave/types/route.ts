// /app/api/odoo/leave/types/route.ts

import { NextResponse } from 'next/server';
import { getLeaveTypes } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    // We don’t strictly need a UID here, since getLeaveTypes() only reads
    // hr.leave.type (no per-user filtering), but you could check credentials
    // or pass an “admin login” token if you want to.
    const types = await getLeaveTypes();
    // Return the array of LeaveType objects directly, including name2
    return NextResponse.json(types.map(t => ({ ...t, name2: t.name2 })), { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
