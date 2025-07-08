// app/api/odoo/auth/attendance/today/route.ts
import { NextResponse } from 'next/server';
import { toZonedTime } from 'date-fns-tz';
import { format as dfFormat } from 'date-fns';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  console.log('[DEBUG] Today attendance API route called');
  try {
    const body = await req.json();
    const { uid } = body;
    console.log('[DEBUG] Today attendance request for UID:', uid);
    
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
    console.log('[DEBUG] Employee from getEmployeeBarcode:', employee);

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
    const nowZ = toZonedTime(new Date(), 'Asia/Kuala_Lumpur');
    const today = dfFormat(nowZ, 'yyyy-MM-dd');
    const todayStart = `${today} 00:00:00`;
    const todayEnd = `${today} 23:59:59`;
    const recs = await client.getRawAttendanceRecords(employee.barcode, todayStart, todayEnd);
    console.log('[DEBUG] Raw attendance records for today:', recs);

    // Sort by datetime ascending for display
    const sortedAscRecs = recs.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

    // Find latest check-in and check-out
    let lastClockIn = null;
    let lastClockOut = null;
    for (const rec of [...sortedAscRecs].reverse()) {
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

    // 3️⃣ Fetch today's attendance sheet line for the employee
    const todaySheetLines = await client.getAttendanceSheetLinesByEmployee(employee.id, today, today);
    let workedHours = 0;
    if (todaySheetLines && todaySheetLines.length > 0) {
      const line = todaySheetLines[0];
      workedHours = typeof line.total_working_time === 'number' && !isNaN(line.total_working_time)
        ? line.total_working_time
        : 0;
    }

    const result = {
      lastClockIn,
      lastClockOut,
      start_clock_actual: shiftInfo.start ? shiftInfo.start.slice(11, 16) : null,
      end_clock_actual: shiftInfo.end ? shiftInfo.end.slice(11, 16) : null,
      empCode: employee.barcode, // Include employee barcode for reference
      workedHours, // Add workedHours from attendance.sheet.line
      records: sortedAscRecs.map(r => ({
        id: r.id,
        datetime: r.datetime,
        attn_type: r.attn_type,
        job_id: r.job_id,
        machine_id: r.machine_id,
        latitude: r.latitude,
        longitude: r.longitude
      }))
    };
    
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Today's attendance error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
