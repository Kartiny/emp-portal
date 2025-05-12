import { NextRequest, NextResponse } from "next/server";
import { getEmployeeAttendance, DateRange } from "@/lib/odooXml";
import { differenceInMinutes, parseISO, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const WORK_START_TIME = '07:00:00';
const WORK_END_TIME = '19:00:00';
const TIMEZONE = 'Asia/Kuala_Lumpur';

function calculateAttendanceDetails(record: any) {
  console.log('Processing record:', record);
  const checkIn = record.check_in;
  const checkOut = record.check_out;
  let overtimeHours = 0;
  let lateMinutes = 0;
  let earlyMinutes = 0;

  if (checkIn) {
    console.log('Processing check-in:', checkIn);
    const checkInDate = toZonedTime(new Date(checkIn), TIMEZONE);
    console.log('Parsed check-in date in Malaysia timezone:', checkInDate);
    
    // Create work start time for the same day
    const workStartTime = new Date(checkInDate);
    workStartTime.setHours(7, 0, 0, 0); // Set to 7 AM
    console.log('Work start time:', workStartTime);
    
    lateMinutes = Math.max(0, differenceInMinutes(checkInDate, workStartTime));
    console.log('Late minutes:', lateMinutes);
  }

  if (checkOut) {
    console.log('Processing check-out:', checkOut);
    const checkOutDate = toZonedTime(new Date(checkOut), TIMEZONE);
    console.log('Parsed check-out date in Malaysia timezone:', checkOutDate);
    
    // Create work end time for the same day
    const workEndTime = new Date(checkOutDate);
    workEndTime.setHours(19, 0, 0, 0); // Set to 7 PM
    console.log('Work end time:', workEndTime);
    
    // Calculate overtime
    const overtimeMinutes = Math.max(0, differenceInMinutes(checkOutDate, workEndTime));
    overtimeHours = overtimeMinutes / 60;
    console.log('Overtime minutes:', overtimeMinutes);

    // Calculate early leave
    earlyMinutes = Math.max(0, differenceInMinutes(workEndTime, checkOutDate));
    console.log('Early minutes:', earlyMinutes);
  }

  const details = {
    overtimeHours,
    lateMinutes,
    earlyMinutes
  };
  console.log('Calculated details:', details);
  return details;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      uid, 
      range = 'monthly', 
      customDate,
      customRange 
    } = body as { 
      uid: number; 
      range: DateRange;
      customDate?: string;
      customRange?: { from: string; to: string };
    };
    console.log("🔐 /api/attendance → received:", { uid, range, customDate, customRange });

    if (!uid) {
      console.warn("🟡 User ID is required");
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
      const result = await getEmployeeAttendance(uid, range, customDate, customRange);
      
      // Calculate total hours and attendance rate
      const totalHours = result.records.reduce((sum: number, record: any) => sum + (record.worked_hours || 0), 0);
      
      // Calculate attendance rate based on records
      const rate = calculateAttendanceRate(result.records);

      // Map records to expected format with overtime calculations
      const formattedRecords = result.records.map((record: any) => {
        const details = calculateAttendanceDetails(record);
        return {
          id: record.id,
          checkIn: record.check_in,
          checkOut: record.check_out,
          workedHours: record.worked_hours || 0,
          ...details
        };
      });

      const response = {
        totalHours,
        rate,
        records: formattedRecords,
        dateRange: result.dateRange
      };

      console.log("✅ /api/attendance → processed data:", response);
      return NextResponse.json(response);
    } catch (innerErr: any) {
      console.error("❌ Error in getEmployeeAttendance:", innerErr.message);
      return NextResponse.json(
        { error: innerErr.message || "Failed to fetch attendance data" },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("❌ /api/attendance error:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

function calculateAttendanceRate(records: any[]): number {
  if (!records.length) return 0;
  
  const totalDays = records.length;
  const completeDays = records.filter(record => record.check_in && record.check_out).length;
  
  return (completeDays / totalDays) * 100;
}
