import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const empId = searchParams.get('employeeId');
  if (!empId) {
    return NextResponse.json(
      { attendance: [] },
      { status: 400 }
    );
  }

  const odoo = await getOdooClient();
  const domain = [['employee_id', '=', parseInt(empId, 10)]];
  const fields = ['id', 'check_in', 'check_out', 'worked_hours'];

  try {
    const attendance = await odoo.call(
      'hr.attendance',
      'search_read',
      [domain],
      { fields, order: 'check_in desc' }
    );
    return NextResponse.json({ attendance: attendance ?? [] });
  } catch (error: any) {
    console.error('Attendance fetch error:', error);
    return NextResponse.json(
      { attendance: [], error: error.message },
      { status: 500 }
    );
  }
}