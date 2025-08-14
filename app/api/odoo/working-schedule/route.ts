import { NextRequest, NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function GET(req: NextRequest) {
  try {
    const client = getOdooClient();
    const workingSchedules = await client.getAllWorkingSchedules();
    return NextResponse.json({ workingSchedules });
  } catch (err: any) {
    console.error('❌ Error fetching working schedules:', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch working schedules' },
      { status: 500 }
    );
  }
}