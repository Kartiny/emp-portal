import { NextRequest, NextResponse } from "next/server";
import { getLeaveRequests } from "@/lib/odooClient";

export async function POST(req: NextRequest) {
  try {
    const { uid } = (await req.json()) as { uid?: number };
    console.log("🔐 /api/leave/requests → received UID:", uid);

    if (typeof uid !== "number") {
      console.warn("🟡 Invalid UID provided:", uid);
      return NextResponse.json(
        { error: "Invalid or missing UID" },
        { status: 400 }
      );
    }

    // Get leave requests from Odoo
    try {
      const leaveRequests = await getLeaveRequests(uid);
      console.log("✅ /api/leave/requests → returning leave requests:", leaveRequests);
      return NextResponse.json(leaveRequests);
    } catch (odooError: any) {
      console.error("❌ Odoo error in /api/leave/requests:", odooError);
      return NextResponse.json(
        { error: `Odoo error: ${odooError.message}` },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("❌ /api/leave/requests error:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
} 