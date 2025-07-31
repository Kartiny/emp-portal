
import { NextResponse } from 'next/server';
import { Odoo } from '@/lib/odooXml';

export async function GET() {
  const odoo = new Odoo();
  await odoo.connect();

  try {
    const balances = await odoo.execute_kw('hr.leave.allocation', 'search_read', [
      [],
      {
        fields: ['employee_id', 'number_of_days', 'holiday_status_id'],
      },
    ]);

    return NextResponse.json(balances);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
