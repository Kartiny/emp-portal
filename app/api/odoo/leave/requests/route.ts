import { NextResponse } from 'next/server';
import { getLeaveRequests } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid, filters } = await req.json();
    if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    const requests = await getLeaveRequests(uid, filters);
    return NextResponse.json(requests);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 