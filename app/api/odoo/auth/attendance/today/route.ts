// app/api/odoo/auth/attendance/today/route.ts
import { NextResponse } from 'next/server';
import { toZonedTime } from 'date-fns-tz';
import { format as dfFormat } from 'date-fns';
import { getOdooClient } from '@/lib/odooXml';
import { parseISO } from 'date-fns';

function parseTimeToDate(today: string, timeStr: string): Date {
  // timeStr: 'HH:mm' or 'H:mm'
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(today);
  d.setHours(h, m, 0, 0);
  return d;
}

function minutesToHumanReadable(mins: number): string {
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  let str = '';
  if (h > 0) str += `${h} hour${h > 1 ? 's' : ''} `;
  if (m > 0) str += `${m} minute${m > 1 ? 's' : ''}`;
  return str.trim() || '0 minutes';
}

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

    // Get shift timings from raw attendance data (actual check-in/check-out times)
    const shiftInfo = await client.getShiftTimingsFromRaw(employee.barcode, today);

    // Get scheduled shift times from employee's work schedule
    const scheduledShiftInfo = await client.getEmployeeShiftInfo(uid);

    // Fetch today's shift code from the duty roster (if available)
    let shiftConfig = { code: null, meal_hour_value: null, grace_period_late_in: null, grace_period_early_out: null };
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const roster = await client.getMonthlyDutyRosterShift(uid, year, month);
      if (roster && roster.assigned && roster.days && roster.days.length >= day) {
        const todayShift = roster.days[day - 1];
        shiftConfig = todayShift;
      }
    } catch (e) {
      // ignore, fallback to nulls
    }

    // 3️⃣ Fetch today's attendance sheet line for the employee
    const todaySheetLines = await client.getAttendanceSheetLinesByEmployee(employee.id, today, today);
    let workedHours = 0;
    if (todaySheetLines && todaySheetLines.length > 0) {
      const line = todaySheetLines[0];
      workedHours = typeof line.total_working_time === 'number' && !isNaN(line.total_working_time)
        ? line.total_working_time
        : 0;
    }

    // Calculate lateness and early out
    let latenessMins = 0;
    let latenessStr = '';
    let earlyOutMins = 0;
    let earlyOutStr = '';
    if (scheduledShiftInfo.start && shiftConfig.grace_period_late_in != null && lastClockIn) {
      // scheduledShiftInfo.start: 'HH:mm', grace_period_late_in: float (hours)
      const shiftStart = parseTimeToDate(today, scheduledShiftInfo.start);
      const graceMinutes = Number(shiftConfig.grace_period_late_in) * 60;
      const graceStart = new Date(shiftStart.getTime() + graceMinutes * 60000);
      const actualIn = parseISO(lastClockIn.replace(' ', 'T'));
      if (actualIn > graceStart) {
        latenessMins = Math.floor((actualIn.getTime() - graceStart.getTime()) / 60000);
        latenessStr = `${minutesToHumanReadable(latenessMins)} late`;
      } else {
        latenessMins = 0;
        latenessStr = 'On time';
      }
    }
    if (scheduledShiftInfo.end && shiftConfig.grace_period_early_out != null && lastClockOut) {
      // scheduledShiftInfo.end: 'HH:mm', grace_period_early_out: float (hours)
      const shiftEnd = parseTimeToDate(today, scheduledShiftInfo.end);
      const graceMinutes = Number(shiftConfig.grace_period_early_out) * 60;
      const graceEnd = new Date(shiftEnd.getTime() - graceMinutes * 60000);
      const actualOut = parseISO(lastClockOut.replace(' ', 'T'));
      if (actualOut < graceEnd) {
        earlyOutMins = Math.floor((graceEnd.getTime() - actualOut.getTime()) / 60000);
        earlyOutStr = `${minutesToHumanReadable(earlyOutMins)} early`;
      } else {
        earlyOutMins = 0;
        earlyOutStr = 'On time';
      }
    }

    const result = {
      lastClockIn,
      lastClockOut,
      start_clock_actual: scheduledShiftInfo.start, // Use scheduled shift start time
      end_clock_actual: scheduledShiftInfo.end,     // Use scheduled shift end time
      schedule_name: scheduledShiftInfo.schedule_name, // Include schedule name
      empCode: employee.barcode, // Include employee barcode for reference
      workedHours, // Add workedHours from attendance.sheet.line
      shiftConfig, // Add today's shift code config
      latenessMins,
      latenessStr,
      earlyOutMins,
      earlyOutStr,
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
