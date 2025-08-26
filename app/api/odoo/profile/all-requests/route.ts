import { NextResponse } from 'next/server';
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

    // Get all requests (for debugging)
    const allRequests = loadRequests();

    return NextResponse.json({
      success: true,
      requests: allRequests,
      total: allRequests.length,
      currentUserId: uid
    });

  } catch (error: any) {
    console.error('❌ Error fetching all profile requests:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch all requests' 
    }, { status: 500 });
  }
} 