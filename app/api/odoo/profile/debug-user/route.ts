import { NextResponse } from 'next/server';
import { getFullUserProfile } from '@/lib/odooXml';

export async function GET(req: Request) {
  try {
    const uid = parseInt(req.headers.get('uid') || '0');

    if (!uid) {
      return NextResponse.json({ error: 'User ID not provided' }, { status: 400 });
    }

    // Get user profile
    const userProfile = await getFullUserProfile(uid);

    return NextResponse.json({
      success: true,
      currentUserId: uid,
      userProfile: userProfile,
      message: 'Debug information for current user'
    });

  } catch (error: any) {
    console.error('❌ Error getting debug info:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get debug info' 
    }, { status: 500 });
  }
} 