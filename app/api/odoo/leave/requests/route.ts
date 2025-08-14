import { NextResponse } from 'next/server';
import { getLeaveRequests } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid, employeeId, filters } = await req.json();

    // Accept either uid or employeeId
    let targetUid = uid;
    if (typeof employeeId === 'number' && !uid) {
      targetUid = employeeId;
    }

    if (!targetUid) {
      return NextResponse.json(
        { error: 'Missing or invalid uid/employeeId' },
        { status: 400 }
      );
    }

    const requests = await getLeaveRequests(targetUid, filters);
    return NextResponse.json(requests, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}