// app/api/odoo/auth/attendance/today/route.ts
import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid } = body;
    
    if (uid === undefined || uid === null) {
      return NextResponse.json({ error: 'Missing uid parameter' }, { status: 400 });
    }
    
    if (typeof uid !== 'number') {
      return NextResponse.json({ error: `Invalid uid type: ${typeof uid}. Expected number.` }, { status: 400 });
    }
    
    if (uid <= 0) {
      return NextResponse.json({ error: `Invalid uid value: ${uid}. Must be positive.` }, { status: 400 });
    }

    // 1️⃣ Find employee and their barcode
    const client = getOdooClient();
    const employee = await client.getEmployeeBarcode(uid);

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee record not found for this user' },
        { status: 404 }
      );
    }

    if (!employee.barcode) {
      return NextResponse.json(
        { error: 'Employee does not have a barcode assigned' },
        { status: 400 }
      );
    }

    // 2️⃣ Query today's records from hr.attendance.raw using emp_code
    const today = new Date().toISOString().split('T')[0];
    const todayStart = `${today} 00:00:00`;
    const todayEnd = `${today} 23:59:59`;
    const recs = await client.getRawAttendanceRecords(employee.barcode, todayStart, todayEnd);
    console.log('DEBUG: Raw attendance records for today:', recs);

    // Find latest check-in and check-out
    let lastClockIn = null;
    let lastClockOut = null;

    // Sort by datetime in descending order to get most recent records first
    const sortedRecs = recs.sort((a, b) => 
      new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
    );

    // Find most recent check-in and check-out
    for (const rec of sortedRecs) {
      if (rec.attn_type === 'i' && !lastClockIn) {
        lastClockIn = rec.datetime;
      }
      if (rec.attn_type === 'o' && !lastClockOut) {
        lastClockOut = rec.datetime;
      }
      if (lastClockIn && lastClockOut) break;
    }

    // Get shift timings from raw attendance data
    const shiftInfo = await client.getShiftTimingsFromRaw(employee.barcode, today);

    const result = {
      lastClockIn,
      lastClockOut,
      start_clock_actual: shiftInfo.start,
      end_clock_actual: shiftInfo.end,
      empCode: employee.barcode // Include employee barcode for reference
    };
    
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Today's attendance error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
