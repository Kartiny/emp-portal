
import { NextResponse } from 'next/server';
import { OdooClient } from '@/lib/odooXml';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const managerId = parseInt(params.id, 10);
  if (isNaN(managerId)) {
    return NextResponse.json({ error: 'Invalid manager ID' }, { status: 400 });
  }

  const odoo = new OdooClient();
  

  try {
    // First, get the employee ID for the manager
const managerEmployee = await odoo.execute('hr.employee', 'search_read', [
      [['user_id', '=', parseInt(id, 10)]],
      { fields: ['id'], limit: 1 },
    ]);

    if (!managerEmployee || managerEmployee.length === 0) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    const managerEmployeeId = managerEmployee[0].id;

// Then, get the employees managed by the manager
const employees = await odoo.execute('hr.employee', 'search_read', [
  [['parent_id', '=', managerEmployeeId]],
      { fields: ['id'] },
    ]);

    const employeeIds = employees.map((employee: any) => employee.id);

    // Finally, get the leave requests for those employees
    const leaveRequests = await odoo.execute('hr.leave', 'search_read', [
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
