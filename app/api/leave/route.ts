import { NextRequest, NextResponse } from "next/server";
import { getLeaveBalance } from "@/lib/odooClient";

export async function POST(req: NextRequest) {
  try {
    const { uid } = (await req.json()) as { uid?: number };
    console.log("🔐 /api/leave → received UID:", uid);

    if (typeof uid !== "number") {
      console.warn("🟡 Invalid UID provided:", uid);
      return NextResponse.json(
        { error: "Invalid or missing UID" },
        { status: 400 }
      );
    }

    // Get leave balance from Odoo
    try {
      const leaveInfo = await getLeaveBalance(uid);
      console.log("✅ /api/leave → returning leave balance:", leaveInfo);
      return NextResponse.json(leaveInfo);
    } catch (odooError: any) {
      console.error("❌ Odoo error in /api/leave:", odooError);
      return NextResponse.json(
        { error: `Odoo error: ${odooError.message}` },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("❌ /api/leave error:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
