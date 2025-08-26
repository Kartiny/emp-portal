import { NextResponse } from 'next/server';
import { getFullUserProfile } from '@/lib/odooXml';
import fs from 'fs';
import path from 'path';

// Simple file-based storage for profile change requests
const REQUESTS_FILE = path.join(process.cwd(), 'data', 'profile-requests.json');

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(REQUESTS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Load existing requests
const loadRequests = () => {
  try {
    ensureDataDir();
    if (fs.existsSync(REQUESTS_FILE)) {
      const data = fs.readFileSync(REQUESTS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading requests:', error);
  }
  return [];
};

// Save requests
const saveRequests = (requests: any[]) => {
  try {
    ensureDataDir();
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2));
  } catch (error) {
    console.error('Error saving requests:', error);
  }
};

// Get direct manager (simplified)
const getDirectManager = async (employeeId: number) => {
  try {
    // Get the employee's manager from Odoo
    const { getOdooClient } = await import('@/lib/odooXml');
    const client = getOdooClient();
    
    // Get employee data to find their manager
    const employee = await client.getEmployeeByUserId(employeeId);

    if (employee && employee.parent_id) {
      // The parent_id is an array [id, name], so we use the first element (ID)
      const managerId = employee.parent_id[0];
      const managerName = employee.parent_id[1];
      
      return {
        id: managerId,
        name: managerName,
        user_id: [managerId, managerName]
      };
    }

    // Fallback: return a default manager
    return {
      id: 2, // Changed from 1 to 2 to match the actual manager
      name: 'Manager1',
      user_id: [2, 'Manager1']
    };
  } catch (error) {
    console.error('Error getting manager:', error);
    // Fallback: return a default manager
    return {
      id: 2, // Changed from 1 to 2 to match the actual manager
      name: 'Manager1',
      user_id: [2, 'Manager1']
    };
  }
};

export async function POST(req: Request) {
  try {
    const { changes } = await req.json();
    const uid = parseInt(req.headers.get('uid') || '0');

    if (!uid) {
      return NextResponse.json({ error: 'User ID not provided' }, { status: 400 });
    }

    if (!changes || Object.keys(changes).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
    }

    // Get current user profile
    const currentProfile = await getFullUserProfile(uid);
    if (!currentProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user already has a pending request
    const existingRequests = loadRequests();
    const hasPending = existingRequests.some((req: any) => 
      req.employee_id === currentProfile.id && req.status === 'pending'
    );

    if (hasPending) {
      return NextResponse.json({ 
        error: 'You already have a pending profile change request' 
      }, { status: 400 });
    }

    // Get direct manager for approval
    const manager = await getDirectManager(currentProfile.id);
    if (!manager) {
      return NextResponse.json({ 
        error: 'No direct manager found for approval' 
      }, { status: 400 });
    }

    console.log('🔍 Debug - Manager found:', manager);
    console.log('🔍 Debug - Current user ID:', uid);
    console.log('🔍 Debug - Manager user ID:', manager.user_id[0]);

    // Create the change request
    const requestId = Date.now(); // Simple ID generation
    const newRequest = {
      id: requestId,
      employee_id: currentProfile.id,
      requester_id: uid,
      approver_id: manager.user_id[0],
      request_type: 'profile_update',
      current_data: currentProfile,
      requested_changes: changes,
      status: 'pending',
      request_date: new Date().toISOString(),
      employee_name: currentProfile.name,
      approver_name: manager.name
    };

    console.log('🔍 Debug - New request created:', newRequest);

    // Save the request
    existingRequests.push(newRequest);
    saveRequests(existingRequests);

    console.log('✅ Profile change request created:', {
      requestId,
      employee: currentProfile.name,
      approver: manager.name,
      changes: Object.keys(changes)
    });

    return NextResponse.json({
      success: true,
      requestId,
      message: 'Profile change request submitted successfully',
      approver: manager.name
    });

  } catch (error: any) {
    console.error('❌ Error submitting profile change request:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to submit profile change request' 
    }, { status: 500 });
  }
} 