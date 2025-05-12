import { NextResponse } from 'next/server';
import { getLeaveTypes } from '@/lib/odooClient';

export async function POST(request: Request) {
  try {
    const { uid } = await request.json();
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const leaveTypes = await getLeaveTypes(uid);
    return NextResponse.json(leaveTypes);
  } catch (error) {
    console.error('Error fetching leave types:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch leave types' },
      { status: 500 }
    );
  }
} 