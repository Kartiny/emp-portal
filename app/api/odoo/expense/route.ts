import { NextResponse } from 'next/server';
import { getExpenseRequests, createExpenseRequest } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid, data } = await req.json();
    if (typeof uid !== 'number' || !data) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const newId = await createExpenseRequest(uid, {
      name: data.description,
      date: data.date,
      payment_mode: data.payment_mode,
      total_amount: data.total_amount,
      ...(data.attachment_id ? { attachment_id: data.attachment_id } : {}),
    });
    return NextResponse.json({ id: newId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = Number(searchParams.get('uid'));
    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }
    const claims = await getExpenseRequests(uid);
    return NextResponse.json({ claims });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 