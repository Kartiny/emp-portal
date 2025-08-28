import { NextRequest, NextResponse } from 'next/server';
import { getPendingRequests } from '@/lib/odooXml';

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const pendingRequests = await getPendingRequests(uid);

    return NextResponse.json(pendingRequests);
  } catch (error) {
    console.error('Error in /api/pending-request:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}