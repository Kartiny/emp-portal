import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Simple file-based storage for profile change requests
const REQUESTS_FILE = path.join(process.cwd(), 'data', 'profile-requests.json');

export async function POST(req: Request) {
  try {
    const uid = parseInt(req.headers.get('uid') || '0');

    if (!uid) {
      return NextResponse.json({ error: 'User ID not provided' }, { status: 400 });
    }

    // Clear all requests
    const dataDir = path.dirname(REQUESTS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify([], null, 2));

    return NextResponse.json({
      success: true,
      message: 'All profile change requests cleared successfully'
    });

  } catch (error: any) {
    console.error('❌ Error clearing profile requests:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to clear requests' 
    }, { status: 500 });
  }
} 