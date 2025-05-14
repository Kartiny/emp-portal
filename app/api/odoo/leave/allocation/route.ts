import { NextResponse } from 'next/server';
import { getLeaveAllocations } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    const allocations = await getLeaveAllocations(uid);
    return NextResponse.json({ allocations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
