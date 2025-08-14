// app/api/odoo/grace-period/route.ts
import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    if (typeof uid !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid uid' }, { status: 400 });
    }

    const client = getOdooClient();
    const gracePeriod = await client.getGracePeriod(uid);

    if (gracePeriod) {
      return NextResponse.json(gracePeriod);
    } else {
      return NextResponse.json({ error: 'Grace period not found' }, { status: 404 });
    }
  } catch (err) {
    console.error('Grace period API error:', err);
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}
