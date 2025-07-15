// app/api/odoo/auth/attendance/today/route.ts
import { NextResponse } from 'next/server';
import { toZonedTime } from 'date-fns-tz';
import { format as dfFormat } from 'date-fns';
import { getOdooClient } from '@/lib/odooXml';
import { parseISO } from 'date-fns';

function parseTimeToDate(today: string, timeStr: string | number | null | undefined): Date | null {
  if (typeof timeStr === 'number' && !isNaN(timeStr)) {
    // Convert float hour to HH:mm string
    const hours = Math.floor(timeStr);
    const minutes = Math.round((timeStr - hours) * 60);
    timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  if (typeof timeStr !== 'string' || !timeStr.includes(':')) return null;
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

    // Extract first/second check-in and check-out
    const checkIns = sortedAscRecs.filter(r => r.attn_type === 'i');
    const checkOuts = sortedAscRecs.filter(r => r.attn_type === 'o');
    const firstCheckIn = checkIns[0]?.datetime || null;
    const firstCheckOut = checkOuts[0]?.datetime || null;
    const secondCheckIn = checkIns[1]?.datetime || null;
    const secondCheckOut = checkOuts[1]?.datetime || null;

    // Fetch S03 meal times from the current day's schedule code
    let mealStartActual = null;
    let mealEndActual = null;
    try {
      if (shiftConfig && shiftConfig.code) {
        // 1. Find the schedule code record for this code
        const codeRecords = await client['execute'](
          'hr.work.schedule.code',
          'search_read',
          [[['name', '=', shiftConfig.code]]],
          { fields: ['id', 'name', 'line_ids'], limit: 1 }
        );
        if (codeRecords && codeRecords.length > 0) {
          const codeRec = codeRecords[0];
          const lineIds = codeRec.line_ids;
          if (lineIds && Array.isArray(lineIds) && lineIds.length > 0) {
            // 2. Find the S03 line in these line_ids
            const s03Lines = await client['execute'](
              'hr.work.schedule.code.line',
              'search_read',
              [[['id', 'in', lineIds], ['code', '=', 'S03']]],
              { fields: ['start_clock_actual', 'end_clock_actual', 'code'], limit: 1 }
            );
            if (s03Lines && s03Lines.length > 0) {
              mealStartActual = s03Lines[0].start_clock_actual;
              mealEndActual = s03Lines[0].end_clock_actual;
            }
          }
        }
      }
    } catch (e) {
      // fallback to null
    }

    // Calculate statuses
    let checkInStatus = 'N/A', checkInMins = null;
    let mealCheckOutStatus = 'N/A', mealCheckOutMins = null;
    let mealCheckInStatus = 'N/A', mealCheckInMins = null;
    let checkOutStatus = 'N/A', checkOutMins = null;

    // Check-in status
    if (scheduledShiftInfo.start && shiftConfig.grace_period_late_in != null && firstCheckIn) {
      const shiftStart = parseTimeToDate(today, scheduledShiftInfo.start);
      if (shiftStart) {
        const graceMinutes = Number(shiftConfig.grace_period_late_in) * 60;
        const graceStart = new Date(shiftStart.getTime() + graceMinutes * 60000);
        const actualIn = parseISO(firstCheckIn.replace(' ', 'T'));
        if (actualIn > graceStart) {
          checkInMins = Math.floor((actualIn.getTime() - graceStart.getTime()) / 60000);
          checkInStatus = `${minutesToHumanReadable(checkInMins)} late`;
        } else {
          checkInMins = 0;
          checkInStatus = 'On time';
        }
      } else {
        checkInStatus = 'N/A';
      }
    }
    // Meal Check Out status (first check-out vs mealStartActual)
    if (mealStartActual && firstCheckOut) {
      const mealStart = parseTimeToDate(today, mealStartActual);
      if (mealStart) {
        const actualOut = parseISO(firstCheckOut.replace(' ', 'T'));
        if (actualOut < mealStart) {
          mealCheckOutMins = Math.floor((mealStart.getTime() - actualOut.getTime()) / 60000);
          mealCheckOutStatus = `${minutesToHumanReadable(mealCheckOutMins)} early`;
        } else if (actualOut > mealStart) {
          mealCheckOutMins = Math.floor((actualOut.getTime() - mealStart.getTime()) / 60000);
          mealCheckOutStatus = `${minutesToHumanReadable(mealCheckOutMins)} late`;
        } else {
          mealCheckOutMins = 0;
          mealCheckOutStatus = 'On time';
        }
      } else {
        mealCheckOutStatus = 'N/A';
      }
    }
    // Meal Check In status (second check-in vs mealEndActual)
    if (mealEndActual && secondCheckIn) {
      const mealEnd = parseTimeToDate(today, mealEndActual);
      if (mealEnd) {
        const actualIn = parseISO(secondCheckIn.replace(' ', 'T'));
        if (actualIn < mealEnd) {
          mealCheckInMins = Math.floor((mealEnd.getTime() - actualIn.getTime()) / 60000);
          mealCheckInStatus = `${minutesToHumanReadable(mealCheckInMins)} early`;
        } else if (actualIn > mealEnd) {
          mealCheckInMins = Math.floor((actualIn.getTime() - mealEnd.getTime()) / 60000);
          mealCheckInStatus = `${minutesToHumanReadable(mealCheckInMins)} late`;
        } else {
          mealCheckInMins = 0;
          mealCheckInStatus = 'On time';
        }
      } else {
        mealCheckInStatus = 'N/A';
      }
    }
    // Check-out status (second check-out vs shift end - grace)
    if (scheduledShiftInfo.end && shiftConfig.grace_period_early_out != null && secondCheckOut) {
      const shiftEnd = parseTimeToDate(today, scheduledShiftInfo.end);
      if (shiftEnd) {
        const graceMinutes = Number(shiftConfig.grace_period_early_out) * 60;
        const graceEnd = new Date(shiftEnd.getTime() - graceMinutes * 60000);
        const actualOut = parseISO(secondCheckOut.replace(' ', 'T'));
        if (actualOut < graceEnd) {
          checkOutMins = Math.floor((graceEnd.getTime() - actualOut.getTime()) / 60000);
          checkOutStatus = `${minutesToHumanReadable(checkOutMins)} early`;
        } else {
          checkOutMins = 0;
          checkOutStatus = 'On time';
        }
      } else {
        checkOutStatus = 'N/A';
      }
    }

    const result = {
      firstCheckIn,
      firstCheckOut,
      secondCheckIn,
      secondCheckOut,
      checkInStatus,
      checkInMins,
      mealCheckOutStatus,
      mealCheckOutMins,
      mealCheckInStatus,
      mealCheckInMins,
      checkOutStatus,
      checkOutMins,
      start_clock_actual: mealStartActual,
      end_clock_actual: mealEndActual,
      schedule_name: scheduledShiftInfo.schedule_name,
      empCode: employee.barcode,
      workedHours,
      shiftConfig,
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
