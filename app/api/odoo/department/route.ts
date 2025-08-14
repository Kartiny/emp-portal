
import { NextRequest, NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function GET(req: NextRequest) {
  try {
    const client = getOdooClient();
    const departments = await client.getAllDepartments();
    return NextResponse.json({ departments });
  } catch (err: any) {
    console.error('❌ Error fetching departments:', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}
