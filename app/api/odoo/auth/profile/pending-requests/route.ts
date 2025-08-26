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

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('✅ Fetching pending profile change requests for manager:', uid);
    
    const client = getOdooClient();
    
    // Check if user is an administrator
    const isAdmin = await isAdministrator(uid);
    
    let requests;
    
    if (isAdmin) {
      // Administrators can see all pending requests
      requests = profileRequestsStore.getAllRequests().filter(req => req.state === 'pending');
      console.log('✅ Administrator found all pending profile change requests:', requests.length);
    } else {
      // Regular managers can only see requests for their direct reports
      const profile = await getFullUserProfile(uid);
      const managerEmployeeId = profile.id;
      
      if (!managerEmployeeId) {
        return NextResponse.json({ error: 'Manager profile not found' }, { status: 404 });
      }
      
      // Get pending profile change requests for this manager
      // We need to match by manager's employee ID, not user ID
      requests = profileRequestsStore.getPendingRequestsForManager(managerEmployeeId);
      console.log('✅ Found pending profile change requests for manager:', requests.length);
    }

    return NextResponse.json({
      success: true,
      data: requests.map((req) => ({
        id: req.id,
        employee_id: req.employee_id,
        employee_name: req.employee_name,
        requested_changes: req.requested_changes,
        comment: req.comment,
        request_date: req.request_date,
        state: req.state
      }))
    });

  } catch (error: any) {
    console.error('❌ Error fetching pending profile change requests:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch pending profile change requests' 
      },
      { status: 500 }
    );
  }
} 