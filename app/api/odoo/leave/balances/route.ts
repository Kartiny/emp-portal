import { NextResponse } from 'next/server';
import { OdooClient } from '@/lib/odooXml';

export async function GET() {
  const odoo = new OdooClient();

  try {
    const balances = await odoo.execute('hr.leave.allocation', 'search_read', [
      [],
      {
        fields: ['employee_id', 'number_of_days', 'holiday_status_id'],
      },
    ]);

    return NextResponse.json(balances);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}