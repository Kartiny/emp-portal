import { NextRequest, NextResponse } from "next/server";
import { getFullUserProfile } from "@/lib/odooXml";

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Profile API called');
    const body = await request.json();
    const { uid } = body;

    console.log('📥 Received UID:', uid);

    if (!uid) {
      console.log('❌ No UID provided');
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get the full user profile
    console.log('🔍 Fetching user profile for UID:', uid);
    const userInfo = await getFullUserProfile(uid);
    console.log('✅ User profile fetched:', JSON.stringify(userInfo, null, 2));

    return NextResponse.json(userInfo);
  } catch (error: any) {
    console.error("❌ Profile fetch error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      stack: error.stack
    });
    return NextResponse.json(
      { error: error.message || "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
