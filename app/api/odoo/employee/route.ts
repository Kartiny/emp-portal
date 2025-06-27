import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  const odoo = await getOdooClient();

  // Build domain filter
  const domain = companyId 
    ? [['company_id', '=', parseInt(companyId, 10)]] 
    : [];

  // Fields to fetch
  const fields = [
    'id', 'name', 'job_title', 'department_id',
    'work_email', 'work_phone', 'mobile_phone'
  ];

  try {
    const employees = await odoo.call(
      'hr.employee',
      'search_read',
      [domain],
      { fields, order: 'name asc' }
    );
    return NextResponse.json({ employees: employees ?? [] });
  } catch (error: any) {
    console.error('Employees fetch error:', error);
    return NextResponse.json(
      { employees: [], error: error.message },
      { status: 500 }
    );
  }
}