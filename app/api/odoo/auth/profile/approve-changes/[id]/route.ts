import { NextRequest, NextResponse } from 'next/server';
import { getOdooClient, getFullUserProfile } from '@/lib/odooXml';
import { profileRequestsStore } from '@/lib/profile-requests-store';

// Helper function to check if user is an administrator
async function isAdministrator(uid: number): Promise<boolean> {
  try {
    const client = getOdooClient();
    const userGroups = await (client as any).execute(
      'res.users',
      'read',
      [[uid], ['groups_id']]
    );
    
    if (!userGroups || !userGroups[0]) return false;
    
    // Check if user has administrator group (you may need to adjust the group ID)
    const adminGroupIds = userGroups[0].groups_id;
    // Common admin group names in Odoo: 'Administration / Settings', 'Human Resources / Manager'
    // You might need to check the actual group IDs in your Odoo instance
    
    // For now, let's assume any user with multiple groups might be an admin
    // This is a simplified check - you should adjust based on your Odoo setup
    return adminGroupIds && adminGroupIds.length > 2;
  } catch (error) {
    console.error('Error checking administrator status:', error);
    return false;
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { uid, comment } = await req.json();
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    console.log('✅ Approving profile change request:', id, 'by user:', uid);
    
    const client = getOdooClient();
    
    // Check if user is an administrator
    const isAdmin = await isAdministrator(uid);
    
    // Get the profile change request
    const changeRequest = profileRequestsStore.getRequest(id);

    if (!changeRequest) {
      return NextResponse.json({ error: 'Profile change request not found' }, { status: 404 });
    }
    
    if (changeRequest.state !== 'pending') {
      return NextResponse.json({ error: 'Request is not in pending state' }, { status: 400 });
    }

    let managerEmployeeId: number | undefined;
    
    if (isAdmin) {
      // Administrators can approve any request
      console.log('✅ Administrator approving request');
    } else {
      // Regular managers can only approve requests for their direct reports
      const profile = await getFullUserProfile(uid);
      managerEmployeeId = profile.id;
      
      if (!managerEmployeeId) {
        return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
      }

      // Verify the user is the manager
      if (changeRequest.manager_id !== managerEmployeeId) {
        return NextResponse.json({ error: 'Unauthorized to approve this request' }, { status: 403 });
      }
    }

    // Apply the changes to the employee profile
    await (client as any).execute(
      'hr.employee',
      'write',
      [[changeRequest.employee_id], changeRequest.requested_changes]
    );

    // Update the request status to approved
    const approverId = isAdmin ? uid : managerEmployeeId;
    const success = await profileRequestsStore.approveRequest(id, approverId, comment);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to approve request' }, { status: 500 });
    }

    console.log('✅ Profile change request approved successfully');

    return NextResponse.json({
      success: true,
      message: 'Profile change request approved successfully',
      data: {
        request_id: id,
        employee_id: changeRequest.employee_id,
        state: 'approved',
        approved_by: approverId,
        approved_date: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Error approving profile change request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to approve profile change request' 
      },
      { status: 500 }
    );
  }
} 