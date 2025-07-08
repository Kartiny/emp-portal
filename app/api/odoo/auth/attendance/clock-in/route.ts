// app/api/odoo/auth/attendance/clock-in/route.ts
import { NextResponse } from 'next/server';
import { clockIn } from '@/lib/odooXml';

export async function POST(req: Request) {
  console.log('[DEBUG] Clock-in API route called');
  try {
    const { uid } = await req.json();
    console.log('[DEBUG] Clock-in request received for UID:', uid);
    if (typeof uid !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid uid' }, { status: 400 });
    }
    // Fetch employee profile and barcode for debug
    const client = require('@/lib/odooXml').getOdooClient();
    const profile = await client.getFullUserProfile(uid);
    console.log('[DEBUG] Employee profile:', profile);
    console.log('[DEBUG] Employee barcode:', profile.barcode);
    const attendanceId = await clockIn(uid);
    console.log('[DEBUG] Created attendance record ID:', attendanceId);
    return NextResponse.json({ attendanceId });
  } catch (err: any) {
    console.error('Clock-in API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
