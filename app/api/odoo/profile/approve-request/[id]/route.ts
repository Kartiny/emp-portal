import { NextResponse } from 'next/server';
import { getFullUserProfile } from '@/lib/odooXml';
import fs from 'fs';
import path from 'path';

// Simple file-based storage for profile change requests
const REQUESTS_FILE = path.join(process.cwd(), 'data', 'profile-requests.json');

// Load existing requests
const loadRequests = () => {
  try {
    const dataDir = path.dirname(REQUESTS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
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
    const dataDir = path.dirname(REQUESTS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2));
  } catch (error) {
    console.error('Error saving requests:', error);
  }
};

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { notes } = await req.json();
    const uid = parseInt(req.headers.get('uid') || '0');
    const requestId = parseInt(params.id);

    if (!uid) {
      return NextResponse.json({ error: 'User ID not provided' }, { status: 400 });
    }

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID not provided' }, { status: 400 });
    }

    // Get user profile to check role
    const userProfile = await getFullUserProfile(uid);
    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user has approval permissions
    const canApprove = userProfile.employee_type === 'manager' || 
                      userProfile.employee_type === 'hr' || 
                      userProfile.employee_type === 'administrator';

    if (!canApprove) {
      return NextResponse.json({ 
        error: 'You do not have permission to approve profile change requests' 
      }, { status: 403 });
    }

    // Load and update the request
    const allRequests = loadRequests();
    const requestIndex = allRequests.findIndex((req: any) => req.id === requestId);
    
    if (requestIndex === -1) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const request = allRequests[requestIndex];
    
    // Update request status
    allRequests[requestIndex] = {
      ...request,
      status: 'approved',
      approval_date: new Date().toISOString(),
      approval_notes: notes || ''
    };

    // Save updated requests
    saveRequests(allRequests);

    console.log('✅ Profile change request approved:', {
      requestId,
      approver: userProfile.name,
      notes
    });

    return NextResponse.json({
      success: true,
      message: 'Profile change request approved successfully'
    });

  } catch (error: any) {
    console.error('❌ Error approving profile change request:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to approve request' 
    }, { status: 500 });
  }
} 