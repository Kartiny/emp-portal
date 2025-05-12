import { NextRequest, NextResponse } from "next/server";
import { clockIn } from "@/lib/odooXml";

export async function POST(req: NextRequest) {
  try {
    const { uid } = (await req.json()) as { uid?: number };
    console.log("🔐 /api/attendance/clock-in → received UID:", uid);

    if (typeof uid !== "number") {
      return NextResponse.json(
        { error: "Invalid or missing UID" },
        { status: 400 }
      );
    }

    try {
      const result = await clockIn(uid);
      console.log("✅ /api/attendance/clock-in → success:", result);
      return NextResponse.json(result);
    } catch (innerError: any) {
      console.error("❌ Clock in error:", innerError);
      return NextResponse.json(
        { error: innerError.message || "Failed to clock in" },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("❌ /api/attendance/clock-in error:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
} 