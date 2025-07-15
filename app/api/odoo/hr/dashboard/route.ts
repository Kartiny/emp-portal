import { NextResponse } from 'next/server';
import { getAllDepartments, getEmployeesByDepartment } from '@/lib/odooXml';

// Helper: get leave requests for multiple employees
async function getLeaveRequestsForEmployees(empIds: number[]): Promise<any[]> {
  if (empIds.length === 0) return [];
  const odoo = require('@/lib/odooXml').getOdooClient();
  const raw = await odoo.execute(
    'hr.leave',
    'search_read',
    [[['employee_id', 'in', empIds]]],
    {
      fields: [
        'id', 'employee_id', 'state', 'holiday_status_id', 'request_date_from', 'request_date_to',
      ],
      order: 'request_date_from desc',
    }
  );
  return raw;
}

// Helper: get expense (claim) requests for multiple employees
async function getExpenseRequestsForEmployees(empIds: number[]): Promise<any[]> {
  if (empIds.length === 0) return [];
  const odoo = require('@/lib/odooXml').getOdooClient();
  const raw = await odoo.execute(
    'hr.expense',
    'search_read',
    [[['employee_id', 'in', empIds]]],
    {
      fields: ['id', 'employee_id', 'state', 'date'],
      order: 'date desc',
    }
  );
  return raw;
}

export async function GET() {
  try {
    // 1. Get all departments
    const departments = await getAllDepartments();
    let totalOnLeave = 0;
    let totalAbsence = 0;
    let totalOTRequests = 0; // Placeholder
    let totalLeaveRequests = 0;
    let totalClaimRequests = 0;
    let totalEmployees = 0;
    const barChart: { department: string; count: number }[] = [];

    for (const dept of departments) {
      const employees = await getEmployeesByDepartment(dept.id);
      const empIds = employees.map((e: any) => e.id);
      totalEmployees += empIds.length;
      barChart.push({ department: dept.name, count: empIds.length });

      // Leave requests
      const leaveRequests = await getLeaveRequestsForEmployees(empIds);
      const onLeave = leaveRequests.filter((r: any) => ['validate', 'confirm'].includes(r.state));
      const leaveRequestsPending = leaveRequests.filter((r: any) => r.state === 'confirm');
      totalOnLeave += onLeave.length;
      totalLeaveRequests += leaveRequestsPending.length;

      // Claims
      const claimRequests = await getExpenseRequestsForEmployees(empIds);
      const claimRequestsPending = claimRequests.filter((r: any) => ['submit', 'to_approve'].includes(r.state));
      totalClaimRequests += claimRequestsPending.length;

      // Absence: employees not in onLeave
      const absentEmpIds = empIds.filter(id => !onLeave.some((r: any) => r.employee_id[0] === id));
      totalAbsence += absentEmpIds.length;

      // OT Requests: placeholder
      // totalOTRequests += ...
    }

    return NextResponse.json({
      onLeaveCount: totalOnLeave,
      absenceCount: totalAbsence,
      otRequestsCount: totalOTRequests,
      leaveRequestsCount: totalLeaveRequests,
      claimRequestsCount: totalClaimRequests,
      totalEmployees,
      barChart,
    });
  } catch (err: any) {
    console.error('HR dashboard API error:', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
} 