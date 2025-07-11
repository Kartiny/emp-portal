import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid, year, month } = await req.json();
    console.log('[DEBUG] Shift roster API called with:', { uid, year, month });
    
    if (typeof uid !== 'number' || typeof year !== 'number' || typeof month !== 'number') {
      console.log('[DEBUG] Invalid parameters:', { uid, year, month });
      return NextResponse.json({ error: 'Missing or invalid uid/year/month' }, { status: 400 });
    }
    
    const client = getOdooClient();
    console.log('[DEBUG] Calling getMonthlyDutyRosterShift with:', { uid, year, month });
    const result = await client.getMonthlyDutyRosterShift(uid, year, month);
    console.log('[DEBUG] getMonthlyDutyRosterShift result:', result);
    
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Shift roster fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 