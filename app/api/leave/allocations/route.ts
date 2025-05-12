import { NextResponse } from 'next/server';
import { getLeaveAllocations } from '@/lib/odooClient';

export async function POST(request: Request) {
  try {
    const { uid } = await request.json();
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const allocations = await getLeaveAllocations(uid);
    return NextResponse.json(allocations);
  } catch (error) {
    console.error('Error fetching leave allocations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch leave allocations' },
      { status: 500 }
    );
  }
} 