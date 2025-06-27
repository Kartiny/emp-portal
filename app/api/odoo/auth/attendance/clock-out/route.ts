// app/api/odoo/auth/attendance/clock-out/route.ts
import { NextResponse } from 'next/server';
import { clockOut } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    if (typeof uid !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid uid' }, { status: 400 });
    }
    await clockOut(uid);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Clock-out API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
