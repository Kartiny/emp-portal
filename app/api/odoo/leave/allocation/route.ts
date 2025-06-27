// /app/api/odoo/leave/allocation/route.ts

import { NextResponse } from 'next/server';
import { getLeaveAllocations } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    if (typeof uid !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid uid' },
        { status: 400 }
      );
    }
    const allocations = await getLeaveAllocations(uid);
    // Return an object with `allocations` key, matching your front end’s expectation
    return NextResponse.json({ allocations }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
