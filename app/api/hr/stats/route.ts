import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('📊 Fetching HR stats for UID:', uid);
    
    const client = getOdooClient();
    
    // Get total employees
    const totalEmployees = await (client as any).execute(
      'hr.employee',
      'search_count',
      [[]]
    );

    // Get active employees (with active contracts)
    const activeEmployees = await (client as any).execute(
      'hr.employee',
      'search_count',
      [[['contract_ids.state', '=', 'open']]]
    );

    // Get pending leave requests
    const pendingLeaveRequests = await (client as any).execute(
      'hr.leave',
      'search_count',
      [[['state', '=', 'confirm']]]
    );

    // Get pending expense requests
    const pendingExpenseRequests = await (client as any).execute(
      'hr.expense',
      'search_count',
      [[['state', '=', 'submit']]]
    );

    // Get new hires (employees created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newHires = await (client as any).execute(
      'hr.employee',
      'search_count',
      [[['create_date', '>=', thirtyDaysAgo.toISOString()]]]
    );

    // Get terminations (employees with terminated contracts in last 30 days)
    const terminations = await (client as any).execute(
      'hr.contract',
      'search_count',
      [[
        ['state', '=', 'close'],
        ['date_end', '>=', thirtyDaysAgo.toISOString()]
      ]]
    );

    // Calculate attendance rate for today
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await (client as any).execute(
      'hr.attendance',
      'search_count',
      [[['check_in', '>=', `${today} 00:00:00`]]]
    );

    const attendanceRate = activeEmployees > 0 ? 
      Math.round((todayAttendance / activeEmployees) * 100) : 0;

    const stats = {
      totalEmployees: totalEmployees || 0,
      activeEmployees: activeEmployees || 0,
      pendingLeaveRequests: pendingLeaveRequests || 0,
      pendingExpenseRequests: pendingExpenseRequests || 0,
      newHires: newHires || 0,
      terminations: terminations || 0,
      attendanceRate: attendanceRate
    };

    console.log('✅ HR stats:', stats);

    return NextResponse.json(stats);
    
  } catch (err: any) {
    console.error('❌ HR stats API error:', err);
    return NextResponse.json({ 
      error: err.message || 'Failed to fetch HR statistics' 
    }, { status: 500 });
  }
} 