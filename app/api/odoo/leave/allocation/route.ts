// /app/api/odoo/leave/allocation/route.ts

import { NextResponse } from 'next/server';
import { getLeaveAllocations } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('🔍 Leave allocation API called with body:', body);
    
    const { uid, employeeId } = body;
    
    // Accept either uid or employeeId
    let targetUid = uid;
    if (typeof employeeId === 'number' && !uid) {
      targetUid = employeeId;
    }
    
    console.log('🔍 Target UID:', targetUid);
    console.log('🔍 Target UID type:', typeof targetUid);
    
    if (typeof targetUid !== 'number') {
      console.error('❌ Invalid uid/employeeId:', targetUid);
      return NextResponse.json(
        { error: 'Missing or invalid uid/employeeId' },
        { status: 400 }
      );
    }
    
    console.log('✅ Calling getLeaveAllocations with uid:', targetUid);
    const allocations = await getLeaveAllocations(targetUid);
    console.log('✅ Leave allocations retrieved:', allocations);
    
    // Return an object with `allocations` key, matching your front end's expectation
    return NextResponse.json({ allocations }, { status: 200 });
  } catch (err: any) {
    console.error('❌ Leave allocation API error:', err);
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
