import { NextResponse } from 'next/server';
import { toZonedTime } from 'date-fns-tz';
import { format as dfFormat } from 'date-fns';
import { getOdooClient } from '@/lib/odooXml';
import { differenceInMinutes } from 'date-fns';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid parameter' }, { status: 400 });
    }

    const client = getOdooClient();
    const employee = await client.getEmployeeBarcode(uid);
    const gracePeriod = await client.getGracePeriod(uid);
    const shiftInfo = await client.getEmployeeShiftInfo(uid);

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

    // Calculate status fields
    const calculateStatus = (actualTime: string | null, scheduledTime: string | null, gracePeriod: number, type: 'in' | 'out') => {
      if (!actualTime || !scheduledTime) {
        return { status: 'N/A', mins: 0 };
      }

      try {
        const actualDate = toZonedTime(new Date(actualTime), 'Asia/Kuala_Lumpur');
        const [scheduledHour, scheduledMinute] = scheduledTime.split(':').map(Number);
        const scheduledDate = new Date(actualDate);
        scheduledDate.setHours(scheduledHour, scheduledMinute, 0, 0);

        const diffMinutes = differenceInMinutes(actualDate, scheduledDate);

        if (type === 'in') {
          // For check-in: positive means late
          if (diffMinutes > gracePeriod) {
            const hours = Math.floor(diffMinutes / 60);
            const mins = diffMinutes % 60;
            const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
            return { status: `Late in by ${timeStr}`, mins: diffMinutes };
          } else {
            return { status: 'On time', mins: 0 };
          }
        } else {
          // For check-out: negative means early out
          if (diffMinutes < -gracePeriod) {
            const absMinutes = Math.abs(diffMinutes);
            const hours = Math.floor(absMinutes / 60);
            const mins = absMinutes % 60;
            const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
            return { status: `Early check out by ${timeStr}`, mins: absMinutes };
          } else {
            return { status: 'On time', mins: 0 };
          }
        }
      } catch (error) {
        return { status: 'N/A', mins: 0 };
      }
    };

    // Extract attendance times
    const checkInRecords = sortedAscRecs.filter(r => r.attn_type === 'i');
    const checkOutRecords = sortedAscRecs.filter(r => r.attn_type === 'o');

    const firstCheckIn = checkInRecords[0]?.datetime || null;
    const secondCheckIn = checkInRecords[1]?.datetime || null;
    const firstCheckOut = checkOutRecords[0]?.datetime || null;
    const lastCheckOut = checkOutRecords[checkOutRecords.length - 1]?.datetime || null;

    // Calculate statuses
    const checkInStatus = calculateStatus(
      firstCheckIn, 
      shiftInfo?.start, 
      gracePeriod?.grace_period_late_in || 0, 
      'in'
    );

    const mealCheckOutStatus = calculateStatus(
      firstCheckOut, 
      gracePeriod?.meal_check_out, 
      0, // No grace period for meal
      'out'
    );

    const mealCheckInStatus = calculateStatus(
      secondCheckIn, 
      gracePeriod?.meal_check_in, 
      0, // No grace period for meal
      'in'
    );

    const checkOutStatus = calculateStatus(
      lastCheckOut, 
      shiftInfo?.end, 
      gracePeriod?.grace_period_early_out || 0, 
      'out'
    );

    // Debug logging for meal times
    console.log('🔍 Meal Time Debug:', {
      firstCheckOut,
      mealCheckOutScheduled: gracePeriod?.meal_check_out,
      secondCheckIn,
      mealCheckInScheduled: gracePeriod?.meal_check_in,
      mealCheckOutStatus: mealCheckOutStatus.status,
      mealCheckInStatus: mealCheckInStatus.status
    });

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
      })),
      // Add calculated status fields
      checkInStatus: checkInStatus.status,
      checkInMins: checkInStatus.mins,
      mealCheckOutStatus: mealCheckOutStatus.status,
      mealCheckOutMins: mealCheckOutStatus.mins,
      mealCheckInStatus: mealCheckInStatus.status,
      mealCheckInMins: mealCheckInStatus.mins,
      checkOutStatus: checkOutStatus.status,
      checkOutMins: checkOutStatus.mins,
      // Add shift info for reference
      shiftInfo
    };

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Today's attendance error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}