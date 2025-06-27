import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('🔍 Fetching profile for UID:', uid);
    
    const client = getOdooClient();
    const user = await client.getUserProfile(uid);
    
    if (!user) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    console.log('✅ Profile fetched successfully');
    return NextResponse.json({ user });
  } catch (err: any) {
    console.error('❌ Profile API error:', err);
    
    // Provide more detailed error information
    const errorMessage = err.message || 'Unknown error occurred';
    const errorDetails = {
      error: errorMessage,
      details: err.toString(),
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
}
