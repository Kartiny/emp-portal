// app/api/odoo/auth/attendance/today/route.ts
import { NextResponse } from 'next/server';
import { getFullUserProfile, getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    if (typeof uid !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid uid' }, { status: 400 });
    }

    // 1️⃣ Find employee
    const profile = await getFullUserProfile(uid);
    const empId = profile.id;
    if (!empId) {
      return NextResponse.json(
        { error: 'Employee record not found for this user' },
        { status: 404 }
      );
    }

    // 2️⃣ Query today’s records
    const today = new Date().toISOString().split('T')[0];
    const domain = [
      ['employee_id','=', empId],
      ['check_in','>=', `${today} 00:00:00`],
    ];
    const client = getOdooClient();
    // @ts-ignore
    const recs = await client.execute(
      'hr.attendance',
      'search_read',
      [domain],
      { fields: ['check_in','check_out'], order: 'check_in desc', limit: 1 }
    );

    const last = recs[0] || {};
    return NextResponse.json({
      lastClockIn: last.check_in || null,
      lastClockOut: last.check_out || null,
    });
  } catch (err: any) {
    console.error("Today's attendance error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
