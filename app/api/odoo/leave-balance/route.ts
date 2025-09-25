
import { NextRequest, NextResponse } from 'next/server';
import { getLeaveAllocations } from '@/lib/odooXml';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid');

  if (!uid) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const leaveData = await getLeaveAllocations(parseInt(uid, 10));

    const processedData = leaveData.map((leave: any) => ({
      type: leave.holiday_status_id[1], // [id, name]
      total: leave.number_of_days,
      used: leave.leaves_taken,
      color: 'bg-blue-500', // Default color, can be customized later
    }));

    return NextResponse.json(processedData);
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    return NextResponse.json({ error: 'Failed to fetch leave balance' }, { status: 500 });
  }
}
