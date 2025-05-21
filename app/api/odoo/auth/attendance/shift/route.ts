import { NextResponse } from 'next/server';
import { getEmployeeShiftInfo } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    if (typeof uid !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid uid' }, { status: 400 });
    }
    const shift = await getEmployeeShiftInfo(uid);
    return NextResponse.json(shift);
  } catch (err: any) {
    console.error('Shift info error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 