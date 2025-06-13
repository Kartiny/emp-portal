import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    if (typeof uid !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid uid' }, { status: 400 });
    }
    const client = getOdooClient();
    const activities = await client.getEmployeeActivities(uid);
    return NextResponse.json({ activities });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 