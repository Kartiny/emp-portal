import { NextRequest, NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function GET(req: NextRequest) {
  try {
    const client = getOdooClient();
    const jobPositions = await client.getAllJobPositions();
    return NextResponse.json({ jobPositions });
  } catch (err: any) {
    console.error('❌ Error fetching job positions:', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch job positions' },
      { status: 500 }
    );
  }
}