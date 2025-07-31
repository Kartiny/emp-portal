
import { NextRequest, NextResponse } from 'next/server';
import { Odoo } from '@/lib/odooXml';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { status } = await req.json();

  if (!id || !status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const odoo = new Odoo();
  await odoo.connect();

  try {
    const result = await odoo.execute_kw('hr.leave', 'write', [
      [parseInt(id, 10)],
      { state: status },
    ]);

    return NextResponse.json({ success: result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
