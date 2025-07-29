import { NextRequest, NextResponse } from 'next/server';
import { getAllEmployees } from '@/lib/odooXml';

export async function GET(req: NextRequest) {
  try {
    const employees = await getAllEmployees();
    return NextResponse.json({ employees });
  } catch (err: any) {
    console.error('❌ Error fetching employees:', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}
