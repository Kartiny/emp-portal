// app/api/odoo/auth/attendance/clock-in/route.ts
import { NextResponse } from 'next/server';
import { clockIn } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    if (typeof uid !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid uid' }, { status: 400 });
    }
    const attendanceId = await clockIn(uid);
    return NextResponse.json({ attendanceId });
  } catch (err: any) {
    console.error('Clock-in API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
