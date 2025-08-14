
import { NextRequest, NextResponse } from 'next/server';
import { Odoo } from '@/lib/odooXml';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Missing manager ID' }, { status: 400 });
  }

  const odoo = new Odoo();
  await odoo.connect();

  try {
    // First, get the employee ID for the manager
const managerEmployee = await odoo.execute_kw('hr.employee', 'search_read', [
      [['user_id', '=', parseInt(id, 10)]],
      { fields: ['id'], limit: 1 },
    ]);

    if (!managerEmployee || managerEmployee.length === 0) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    const managerEmployeeId = managerEmployee[0].id;

// Then, get the employees managed by the manager
const employees = await odoo.execute_kw('hr.employee', 'search_read', [
  [['parent_id', '=', managerEmployeeId]],
      { fields: ['id'] },
    ]);

    const employeeIds = employees.map((employee: any) => employee.id);

    // Finally, get the leave requests for those employees
    const leaveRequests = await odoo.execute_kw('hr.leave', 'search_read', [
      [['employee_id', 'in', employeeIds]],
      {
        fields: ['employee_id', 'holiday_status_id', 'date_from', 'date_to', 'state'],
      },
    ]);

    return NextResponse.json(leaveRequests);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
