import { NextRequest, NextResponse } from 'next/server';
import { getOdooClient, getFullUserProfile } from '@/lib/odooXml';
import { profileRequestsStore } from '@/lib/profile-requests-store';

export async function POST(req: NextRequest) {
  try {
    const { uid, changes, comment } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!changes || Object.keys(changes).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
    }

    console.log('✅ Creating profile change request for user:', uid);
    
    const client = getOdooClient();
    
    // Get the employee profile to find the parent_id (direct manager)
    const profile = await getFullUserProfile(uid);
    const employeeId = profile.id;
    
    if (!employeeId) {
      return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
    }

    // Get the employee record to find the parent_id (direct manager)
    const employeeProfile = await (client as any).execute(
      'hr.employee',
      'read',
      [[employeeId], ['parent_id', 'name']]
    );

    if (!employeeProfile || !employeeProfile[0]) {
      return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
    }

    const employee = employeeProfile[0];
    
    if (!employee.parent_id) {
      return NextResponse.json({ error: 'No direct manager assigned' }, { status: 400 });
    }

    // Store the change request using our file-based store
    const requestId = await profileRequestsStore.createRequest({
      employee_id: employeeId,
      employee_name: employee.name,
      manager_id: employee.parent_id[0],
      manager_name: employee.parent_id[1],
      requested_changes: changes,
      comment: comment || '',
      state: 'pending'
    });
    
    console.log('✅ Profile change request created successfully:', requestId);

    return NextResponse.json({
      success: true,
      message: 'Profile change request submitted successfully',
      data: {
        request_id: requestId,
        manager_id: employee.parent_id[0],
        manager_name: employee.parent_id[1],
        state: 'pending',
        changes: changes,
        comment: comment || ''
      }
    });

  } catch (error: any) {
    console.error('❌ Error creating profile change request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create profile change request' 
      },
      { status: 500 }
    );
  }
} 