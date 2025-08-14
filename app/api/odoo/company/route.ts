
import { NextRequest, NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function GET(req: NextRequest) {
  try {
    const client = getOdooClient();
    const companies = await client.getAllCompanies();
    return NextResponse.json({ companies });
  } catch (err: any) {
    console.error('❌ Error fetching companies:', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}
