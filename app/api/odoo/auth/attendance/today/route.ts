import { NextResponse } from 'next/server';
import { toZonedTime } from 'date-fns-tz';
import { format as dfFormat } from 'date-fns';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid parameter' }, { status: 400 });
    }

    const client = getOdooClient();
    const employee = await client.getEmployeeBarcode(uid);
    const gracePeriod = await client.getGracePeriod(uid);

    if (!employee || !employee.barcode) {
      return NextResponse.json(
        { error: 'Employee record not found for this user or employee does not have a barcode assigned' },
        { status: 404 }
      );
    }

    const nowZ = toZonedTime(new Date(), 'Asia/Kuala_Lumpur');
    const today = dfFormat(nowZ, 'yyyy-MM-dd');
    const todayStart = `${today} 00:00:00`;
    const todayEnd = `${today} 23:59:59`;
    const recs = await client.getRawAttendanceRecords(employee.barcode, todayStart, todayEnd);

    const sortedAscRecs = recs.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

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
      workedHours,
      gracePeriod,
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