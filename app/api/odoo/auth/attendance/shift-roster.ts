import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid, year, month } = await req.json();
    if (typeof uid !== 'number' || typeof year !== 'number' || typeof month !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid uid/year/month' }, { status: 400 });
    }
    const client = getOdooClient();
    const roster = await client.getMonthlyDutyRosterShift(uid, year, month);
    return NextResponse.json(roster || {});
  } catch (err: any) {
    console.error('Shift roster fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 