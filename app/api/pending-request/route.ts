import { NextRequest, NextResponse } from 'next/server';
import { getPendingRequests } from '@/lib/odooXml';

export async function POST(req: NextRequest) {
  try {
    const { employeeId } = await req.json();

    if (!employeeId) {
      return NextResponse.json({ message: 'Employee ID is required' }, { status: 400 });
    }

    const pendingRequests = await getPendingRequests(employeeId);

    return NextResponse.json(pendingRequests);
  } catch (error) {
    console.error('Error in /api/pending-request:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}