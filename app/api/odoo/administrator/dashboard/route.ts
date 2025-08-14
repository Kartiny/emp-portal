import { NextResponse } from 'next/server';
import { getAllDepartments, getEmployeesByDepartment } from '@/lib/odooXml';
import { addDays, isWithinInterval, parseISO, startOfMonth, endOfMonth, isAfter, isBefore } from 'date-fns';

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

    // For new widgets
    const allEmployees: any[] = [];
    const contractsToFetch: number[] = [];

    for (const dept of departments) {
      const employees = await getEmployeesByDepartment(dept.id);
      const empIds = employees.map((e: any) => e.id);
      totalEmployees += empIds.length;
      barChart.push({ department: dept.name, count: empIds.length });
      allEmployees.push(...employees);
      // Collect contract ids for expiry check
      employees.forEach(e => {
        if (e.contract_id && Array.isArray(e.contract_id) && e.contract_id[0]) {
          contractsToFetch.push(e.contract_id[0]);
        }
      });

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

    // --- New Joinees This Month ---
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const newJoinees = allEmployees.filter(e => {
      if (!e.join_date) return false;
      const d = parseISO(e.join_date);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });

    // --- Recent Exits This Month ---
    const recentExits = allEmployees.filter(e => {
      if (!e.cessation_date) return false;
      const d = parseISO(e.cessation_date);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });

    // --- Contract Expiry Alerts (next 30 days) ---
    let contractExpiryAlerts: any[] = [];
    if (contractsToFetch.length > 0) {
      const odoo = require('@/lib/odooXml').getOdooClient();
      const contracts = await odoo.execute(
        'hr.contract',
        'search_read',
        [[['id', 'in', contractsToFetch]]],
        { fields: ['id', 'employee_id', 'date_end'], order: 'date_end asc' }
      );
      const today = new Date();
      const in30Days = addDays(today, 30);
      contractExpiryAlerts = contracts.filter((c: any) => {
        if (!c.date_end) return false;
        const d = parseISO(c.date_end);
        return isAfter(d, today) && isBefore(d, in30Days);
      });
    }

    return NextResponse.json({
      onLeaveCount: totalOnLeave,
      absenceCount: totalAbsence,
      otRequestsCount: totalOTRequests,
      leaveRequestsCount: totalLeaveRequests,
      claimRequestsCount: totalClaimRequests,
      totalEmployees,
      barChart,
      newJoinees,
      recentExits,
      contractExpiryAlerts,
    });
  } catch (err: any) {
    console.error('HR dashboard API error:', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
} 