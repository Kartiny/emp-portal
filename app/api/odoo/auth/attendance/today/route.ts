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

    // Calculate status fields with proper business rules
    const calculateStatusWithRules = (actualTime: string | null, scheduledTime: string | null, config: any, type: 'checkIn' | 'mealOut' | 'mealIn' | 'checkOut') => {
      if (!actualTime || !scheduledTime) {
        return { status: 'N/A', mins: 0, workingHoursImpact: 0 };
      }

      try {
        const actualDate = toZonedTime(new Date(actualTime), 'Asia/Kuala_Lumpur');
        const [scheduledHour, scheduledMinute] = scheduledTime.split(':').map(Number);
        const scheduledDate = new Date(actualDate);
        scheduledDate.setHours(scheduledHour, scheduledMinute, 0, 0);

        const diffMinutes = differenceInMinutes(actualDate, scheduledDate);

        switch (type) {
          case 'checkIn':
            // A1: Early In - Add to working hours
            if (diffMinutes < 0) {
              const absMinutes = Math.abs(diffMinutes);
              const hours = Math.floor(absMinutes / 60);
              const mins = absMinutes % 60;
              const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
              return { 
                status: `Early in by ${timeStr}`, 
                mins: absMinutes, 
                workingHoursImpact: absMinutes / 60 // Add to working hours
              };
            }
            // A4: Late In - Check grace period and deduct if over
            else if (diffMinutes > 0) {
              const gracePeriod = config.grace_period_late_in || 0;
              const hours = Math.floor(diffMinutes / 60);
              const mins = diffMinutes % 60;
              const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
              
              // Check if within grace period
              if (diffMinutes <= gracePeriod) {
                return { 
                  status: `Late in by ${timeStr} (within grace period)`, 
                  mins: diffMinutes, 
                  workingHoursImpact: 0 // No deduction within grace period
                };
              } else {
                // Check if only_minus_absorb_grace is enabled
                const deductMinutes = config.only_minus_absorb_grace ? diffMinutes : (diffMinutes - gracePeriod);
                return { 
                  status: `Late in by ${timeStr}`, 
                  mins: diffMinutes, 
                  workingHoursImpact: -(deductMinutes / 60) // Deduct from working hours
                };
              }
            }
            break;

          case 'checkOut':
            // A2: Late Out - Add to working hours
            if (diffMinutes > 0) {
              const hours = Math.floor(diffMinutes / 60);
              const mins = diffMinutes % 60;
              const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
              return { 
                status: `Late out by ${timeStr}`, 
                mins: diffMinutes, 
                workingHoursImpact: diffMinutes / 60 // Add to working hours
              };
            }
            // A3: Early Out - Check grace period and deduct if over
            else if (diffMinutes < 0) {
              const absMinutes = Math.abs(diffMinutes);
              const gracePeriod = config.grace_period_early_out || 0;
              const hours = Math.floor(absMinutes / 60);
              const mins = absMinutes % 60;
              const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
              
              // Check if within grace period
              if (absMinutes <= gracePeriod) {
                return { 
                  status: `Early out by ${timeStr} (within grace period)`, 
                  mins: absMinutes, 
                  workingHoursImpact: 0 // No deduction within grace period
                };
              } else {
                // Check if only_minus_absorb_grace is enabled
                const deductMinutes = config.only_minus_absorb_grace ? absMinutes : (absMinutes - gracePeriod);
                return { 
                  status: `Early out by ${timeStr}`, 
                  mins: absMinutes, 
                  workingHoursImpact: -(deductMinutes / 60) // Deduct from working hours
                };
              }
            }
            break;

          case 'mealOut':
          case 'mealIn':
            // A5: Meal Hours - Check if within meal time range
            if (diffMinutes === 0) {
              return { status: 'On time', mins: 0, workingHoursImpact: 0 };
            } else {
              const absMinutes = Math.abs(diffMinutes);
              const hours = Math.floor(absMinutes / 60);
              const mins = absMinutes % 60;
              const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
              
              if (diffMinutes > 0) {
                return { 
                  status: `Late by ${timeStr}`, 
                  mins: diffMinutes, 
                  workingHoursImpact: 0 // Meal time doesn't affect working hours directly
                };
              } else {
                return { 
                  status: `Early by ${timeStr}`, 
                  mins: absMinutes, 
                  workingHoursImpact: 0 // Meal time doesn't affect working hours directly
                };
              }
            }
            break;
        }

        return { status: 'On time', mins: 0, workingHoursImpact: 0 };
      } catch (error) {
        return { status: 'N/A', mins: 0, workingHoursImpact: 0 };
      }
    };

    // Extract attendance times
    const checkInRecords = sortedAscRecs.filter(r => r.attn_type === 'i');
    const checkOutRecords = sortedAscRecs.filter(r => r.attn_type === 'o');

    const firstCheckIn = checkInRecords[0]?.datetime || null;
    const secondCheckIn = checkInRecords[1]?.datetime || null;
    const firstCheckOut = checkOutRecords[0]?.datetime || null;
    const secondCheckOut = checkOutRecords[1]?.datetime || null; // Changed from lastCheckOut to secondCheckOut

    // Calculate statuses with business rules
    const checkInStatus = calculateStatusWithRules(
      firstCheckIn, 
      shiftInfo?.start, 
      gracePeriod, 
      'checkIn'
    );

    // Meal check-out status - shown after first check-out (lunch)
    const mealCheckOutStatus = calculateStatusWithRules(
      firstCheckOut, 
      gracePeriod?.meal_check_out, 
      gracePeriod, 
      'mealOut'
    );

    // Meal check-in status - shown after second check-in (return from lunch)
    const mealCheckInStatus = calculateStatusWithRules(
      secondCheckIn, 
      gracePeriod?.meal_check_in, 
      gracePeriod, 
      'mealIn'
    );

    // Final check-out status - only shown after second check-out (end of day)
    let checkOutStatus;
    if (secondCheckOut) {
      // Employee has completed the day (second check-out exists)
      checkOutStatus = calculateStatusWithRules(
        secondCheckOut,
        shiftInfo?.end, 
        gracePeriod, 
        'checkOut'
      );
    } else {
      // Employee is still at work (no second check-out yet)
      checkOutStatus = {
        status: 'Still at work',
        mins: 0,
        workingHoursImpact: 0
      };
    }

    // Calculate total working hours impact
    const totalWorkingHoursImpact = 
      checkInStatus.workingHoursImpact + 
      checkOutStatus.workingHoursImpact;

    // Debug logging for meal times and working hours impact
    console.log('🔍 Business Rules Debug:', {
      firstCheckIn,
      shiftStart: shiftInfo?.start,
      firstCheckOut,
      mealCheckOutScheduled: gracePeriod?.meal_check_out,
      secondCheckIn,
      mealCheckInScheduled: gracePeriod?.meal_check_in,
      secondCheckOut, // Changed from lastCheckOut
      shiftEnd: shiftInfo?.end,
      checkInStatus: checkInStatus.status,
      checkOutStatus: checkOutStatus.status,
      mealCheckOutStatus: mealCheckOutStatus.status,
      mealCheckInStatus: mealCheckInStatus.status,
      totalWorkingHoursImpact,
      gracePeriodSettings: {
        lateIn: gracePeriod?.grace_period_late_in,
        earlyOut: gracePeriod?.grace_period_early_out,
        onlyMinusAbsorbGrace: gracePeriod?.only_minus_absorb_grace
      },
      attendanceFlow: {
        hasFirstCheckIn: !!firstCheckIn,
        hasFirstCheckOut: !!firstCheckOut,
        hasSecondCheckIn: !!secondCheckIn,
        hasSecondCheckOut: !!secondCheckOut,
        currentStage: secondCheckOut ? 'Completed' : secondCheckIn ? 'After Lunch' : firstCheckOut ? 'At Lunch' : firstCheckIn ? 'Working' : 'Not Started'
      }
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
      // Add calculated status fields with business rules
      checkInStatus: checkInStatus.status,
      checkInMins: checkInStatus.mins,
      checkInWorkingHoursImpact: checkInStatus.workingHoursImpact,
      mealCheckOutStatus: mealCheckOutStatus.status,
      mealCheckOutMins: mealCheckOutStatus.mins,
      mealCheckOutWorkingHoursImpact: mealCheckOutStatus.workingHoursImpact,
      mealCheckInStatus: mealCheckInStatus.status,
      mealCheckInMins: mealCheckInStatus.mins,
      mealCheckInWorkingHoursImpact: mealCheckInStatus.workingHoursImpact,
      checkOutStatus: checkOutStatus.status,
      checkOutMins: checkOutStatus.mins,
      checkOutWorkingHoursImpact: checkOutStatus.workingHoursImpact,
      // Add total working hours impact
      totalWorkingHoursImpact,
      // Add shift info for reference
      shiftInfo
    };

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Today's attendance error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}