import { NextResponse } from 'next/server';
import { getFullUserProfile, getEmployeesByDepartment, getLeaveRequests, getExpenseRequests } from '@/lib/odooXml';

// Helper: get department_id from manager uid
async function getDepartmentIdByManagerUid(uid: number): Promise<number | null> {
  const profile = await getFullUserProfile(uid);
  if (profile && profile.department_id && Array.isArray(profile.department_id)) {
    return profile.department_id[0];
  }
  return null;
}

// Helper: get leave requests for multiple employees
async function getLeaveRequestsForEmployees(empIds: number[]): Promise<any[]> {
  // This is a batch Odoo call for all employees in the department
  if (empIds.length === 0) return [];
  // Odoo domain: [['employee_id', 'in', empIds]]
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

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    if (typeof uid !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid uid' }, { status: 400 });
    }

    // 1. Get manager's department
const departmentId = await getDepartmentIdByManagerUid(uid);
    if (!departmentId) {
      return NextResponse.json({ error: 'Manager has no department' }, { status: 404 });
    }

    // 2. Get all employees in department
    const employees = await getEmployeesByDepartment(departmentId);
    const empIds = employees.map((e: any) => e.id);

    // 3. Get leave requests for all employees
    const leaveRequests = await getLeaveRequestsForEmployees(empIds);
    // On Leave: state === 'validate' or 'confirm' (approved or pending)
    const onLeave = leaveRequests.filter((r: any) => ['validate', 'confirm'].includes(r.state));
    // Leave Requests: state === 'confirm' (pending approval)
    const leaveRequestsPending = leaveRequests.filter((r: any) => r.state === 'confirm');

    // 4. Get claim (expense) requests for all employees
    const claimRequests = await getExpenseRequestsForEmployees(empIds);
    // Claim Requests: state === 'submit' or 'to_approve' (pending)
    const claimRequestsPending = claimRequests.filter((r: any) => ['submit', 'to_approve'].includes(r.state));

    // 5. Absence: employees with no leave or attendance for today (simple version: not on leave today)
    // For demo, absence = employees not in onLeave
    const absentEmpIds = empIds.filter(id => !onLeave.some((r: any) => r.employee_id[0] === id));
    const absentees = employees.filter((e: any) => absentEmpIds.includes(e.id));

    // 6. OT Requests: (not implemented, placeholder)
    const otRequests = [];

    // 7. Bar chart: number of employees per job title
    const jobTitleCounts: Record<string, number> = {};
    employees.forEach((e: any) => {
      const jt = e.job_title || 'Unknown';
      jobTitleCounts[jt] = (jobTitleCounts[jt] || 0) + 1;
    });
    const barChart = Object.entries(jobTitleCounts).map(([jobTitle, count]) => ({ jobTitle, count }));

    return NextResponse.json({
      onLeaveCount: onLeave.length,
      absenceCount: absentees.length,
      otRequestsCount: otRequests.length,
      leaveRequestsCount: leaveRequestsPending.length,
      claimRequestsCount: claimRequestsPending.length,
      employees,
      barChart,
    });
  } catch (err: any) {
    console.error('Manager dashboard API error:', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
} 