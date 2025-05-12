import { NextRequest, NextResponse } from "next/server";
import { createLeaveRequest } from "@/lib/odooClient";

export async function POST(request: NextRequest) {
  try {
    const { uid, employeeId, leaveTypeId, startDate, endDate, description } = await request.json();
    
    if (!uid || !employeeId || !leaveTypeId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await createLeaveRequest(uid, {
      leaveTypeId,
      startDate,
      endDate,
      reason: description || ''
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error submitting leave request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit leave request' },
      { status: 500 }
    );
  }
} 