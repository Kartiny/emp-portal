import { NextResponse } from 'next/server';
import { getLeaveTypes } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    // Optionally, you can check for uid if needed
    // const { uid } = await req.json();
    const types = await getLeaveTypes();
    return NextResponse.json(types);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 