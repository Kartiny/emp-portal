import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

interface Params {
  params: { id: string };
}

export async function GET(request: Request, { params }: Params) {
  const employeeId = parseInt(params.id, 10);
  const odoo = await getOdooClient();

  try {
    const [employee] = await odoo.call(
      'hr.employee',
      'read',
      [[employeeId], [
        'id', 'name', 'job_title',
        'department_id', 'work_email',
        'work_phone', 'mobile_phone'
      ]]
    );
    return NextResponse.json({ employee });
  } catch (error: any) {
    console.error('Employee detail fetch error:', error);
    return NextResponse.json(
      { employee: null, error: error.message },
      { status: 500 }
    );
  }
}