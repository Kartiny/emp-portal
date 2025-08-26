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

export async function GET(req: Request) {
  try {
    const uid = parseInt(req.headers.get('uid') || '0');

    if (!uid) {
      return NextResponse.json({ error: 'User ID not provided' }, { status: 400 });
    }

    // Get user profile to check role
    const userProfile = await getFullUserProfile(uid);
    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    console.log('🔍 Debug - Current user profile:', userProfile);
    console.log('🔍 Debug - Current user ID:', uid);
    console.log('🔍 Debug - User employee type:', userProfile.employee_type);

    // Check if user has approval permissions
    const canApprove = userProfile.employee_type === 'manager' || 
                      userProfile.employee_type === 'hr' || 
                      userProfile.employee_type === 'administrator';

    console.log('🔍 Debug - Can approve:', canApprove);

    if (!canApprove) {
      return NextResponse.json({ 
        error: 'You do not have permission to approve profile change requests' 
      }, { status: 403 });
    }

    // Get pending requests for this approver
    const allRequests = loadRequests();
    console.log('🔍 Debug - All requests loaded:', allRequests);
    console.log('🔍 Debug - Looking for approver_id:', uid);
    
    const requests = allRequests.filter((req: any) => 
      req.approver_id === uid && req.status === 'pending'
    );

    console.log('🔍 Debug - Filtered requests for this approver:', requests);

    // Enhance requests with employee names
    const enhancedRequests = requests.map((req: any) => ({
      ...req,
      employee_name: req.employee_name || 'Unknown Employee',
      requester_name: req.employee_name || 'Unknown Requester',
      request_date_formatted: new Date(req.request_date).toLocaleDateString(),
      changes_count: Object.keys(req.requested_changes).length
    }));

    return NextResponse.json({
      success: true,
      requests: enhancedRequests,
      total: enhancedRequests.length
    });

  } catch (error: any) {
    console.error('❌ Error fetching pending profile requests:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch pending requests' 
    }, { status: 500 });
  }
} 