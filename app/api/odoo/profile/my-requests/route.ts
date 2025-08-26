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

    // Get user profile
    const userProfile = await getFullUserProfile(uid);
    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get employee's profile change requests
    const allRequests = loadRequests();
    const requests = allRequests.filter((req: any) => req.employee_id === userProfile.id);

    // Check if user has pending request
    const hasPending = requests.some((req: any) => req.status === 'pending');

    // Enhance requests with additional data
    const enhancedRequests = requests.map((req: any) => ({
      ...req,
      request_date_formatted: new Date(req.request_date).toLocaleDateString(),
      approval_date_formatted: req.approval_date ? new Date(req.approval_date).toLocaleDateString() : null,
      changes_count: Object.keys(req.requested_changes).length,
      status_color: req.status === 'approved' ? 'green' : req.status === 'rejected' ? 'red' : 'yellow'
    }));

    return NextResponse.json({
      success: true,
      requests: enhancedRequests,
      hasPendingRequest: hasPending,
      total: enhancedRequests.length
    });

  } catch (error: any) {
    console.error('❌ Error fetching employee profile requests:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch profile requests' 
    }, { status: 500 });
  }
} 