// /app/api/odoo/leave/types/route.ts

import { NextResponse } from 'next/server';
import { getLeaveTypes } from '@/lib/odooXml';

export async function GET() {
  try {
    const types = await getLeaveTypes();
    return NextResponse.json(types.map(t => ({ ...t, name2: t.name2 })), { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
