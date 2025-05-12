// app/api/attendance/clock-out/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clockOut } from '@/lib/odooXml';
import { getEmployeeAttendance as getEmployeeAttendanceXml } from '@/lib/odooXml';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = parseInt(searchParams.get('uid') || '', 10);
    if (isNaN(uid)) {
      return NextResponse.json({ error: 'Invalid uid' }, { status: 400 });
    }
    const result = await getEmployeeAttendanceXml(uid);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET Attendance Error]', error);
    return NextResponse.json({ error: 'Failed to fetch attendance records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();
    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }
    const result = await clockOut(uid);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Clock-out Error]', error);
    return NextResponse.json({ error: 'Failed to clock out' }, { status: 500 });
  }
}
