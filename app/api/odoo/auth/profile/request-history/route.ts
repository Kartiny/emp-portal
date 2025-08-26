import { NextRequest, NextResponse } from 'next/server';
import { getOdooClient, getFullUserProfile } from '@/lib/odooXml';
import { profileRequestsStore } from '@/lib/profile-requests-store';

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('✅ Fetching profile change request history for employee:', uid);
    
    const client = getOdooClient();
    
    // Get the employee's profile
    const profile = await getFullUserProfile(uid);
    const employeeId = profile.id;
    
    if (!employeeId) {
      return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
    }
    
    // Get all profile change requests for this employee
    const requests = profileRequestsStore.getRequestsForEmployee(employeeId);

    console.log('✅ Found profile change requests:', requests.length);

    return NextResponse.json({
      success: true,
      data: requests.map((req) => ({
        id: req.id,
        manager_id: req.manager_id,
        manager_name: req.manager_name,
        requested_changes: req.requested_changes,
        comment: req.comment,
        request_date: req.request_date,
        state: req.state,
        approved_date: req.approved_date,
        rejected_date: req.rejected_date,
        approval_comment: req.approval_comment,
        rejection_comment: req.rejection_comment
      }))
    });

  } catch (error: any) {
    console.error('❌ Error fetching profile change request history:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch profile change request history' 
      },
      { status: 500 }
    );
  }
} 