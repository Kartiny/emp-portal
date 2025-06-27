import { NextResponse } from 'next/server';
import { getAllShiftAttendances } from '@/lib/odooXml';

export async function GET() {
  try {
    const attendances = await getAllShiftAttendances();
    return NextResponse.json({ attendances });
  } catch (error: any) {
    console.error('resource.calendar.attendance fetch error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 