import { NextRequest, NextResponse } from "next/server";
import { getUserInfo, getTodayAttendance } from "@/lib/odooXml";
import { formatDateTime } from "@/lib/utils/dateFormat";

export async function POST(req: NextRequest) {
  try {
    const { uid } = (await req.json()) as { uid?: number };
    console.log("🔐 /api/attendance/today → received UID:", uid);

    if (typeof uid !== "number") {
      return NextResponse.json(
        { error: "Invalid or missing UID" },
        { status: 400 }
      );
    }

    try {
      // Get employee ID using the odooXml helper method
      const userInfo = await getUserInfo(uid);
      if (!userInfo.employee_id || !Array.isArray(userInfo.employee_id)) {
        throw new Error("No employee record found for this user");
      }
      const employeeId = userInfo.employee_id[0];
      console.log("👤 Employee ID:", employeeId);

      // Get today's attendance records
      const records = await getTodayAttendance(employeeId);
      console.log("📅 Raw attendance records:", records);
      
      // Get the latest record
      const latestRecord = records?.[0];
      console.log("📅 Latest record:", latestRecord);
      
      // Format dates before sending response
      let formattedResponse;
      try {
        formattedResponse = {
          isCheckedIn: latestRecord ? !latestRecord.check_out : false,
          lastClockIn: latestRecord?.check_in ? formatDateTime(latestRecord.check_in) : "",
          lastClockOut: latestRecord?.check_out ? formatDateTime(latestRecord.check_out) : "",
          todayHours: formatWorkedHours(latestRecord?.worked_hours || 0)
        };
        console.log("✅ Formatted response:", formattedResponse);
      } catch (formatError) {
        console.error("❌ Error formatting response:", formatError);
        console.error("Problem record:", latestRecord);
        throw formatError;
      }

      return NextResponse.json(formattedResponse);
    } catch (innerError: any) {
      console.error("❌ Inner error:", innerError);
      return NextResponse.json(
        { error: innerError.message || "Failed to fetch attendance data" },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("❌ /api/attendance/today error:", err.message);
    console.error("Full error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to format worked hours
function formatWorkedHours(hours: number): string {
  try {
    console.log("⏱️ Formatting hours:", hours);
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    const formatted = `${wholeHours}h ${minutes}m`;
    console.log("⏱️ Formatted hours result:", formatted);
    return formatted;
  } catch (error) {
    console.error('❌ Error formatting hours:', error);
    console.error('Problem hours value:', hours);
    return '0h 0m';
  }
} 