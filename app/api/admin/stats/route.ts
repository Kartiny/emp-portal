import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('📊 Fetching admin stats for UID:', uid);
    
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

    // Get today's attendance count
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await (client as any).execute(
      'hr.attendance',
      'search_count',
      [[['check_in', '>=', `${today} 00:00:00`]]]
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

    // Get total pending requests
    const totalPendingRequests = pendingLeaveRequests + pendingExpenseRequests;

    // Mock system alerts (you can implement real logic based on your needs)
    const systemAlerts = 0;

    const stats = {
      totalEmployees: totalEmployees || 0,
      activeEmployees: activeEmployees || 0,
      pendingRequests: totalPendingRequests,
      totalAttendance: todayAttendance || 0,
      leaveRequests: pendingLeaveRequests || 0,
      expenseRequests: pendingExpenseRequests || 0,
      systemAlerts: systemAlerts
    };

    console.log('✅ Admin stats:', stats);

    return NextResponse.json(stats);
    
  } catch (err: any) {
    console.error('❌ Admin stats API error:', err);
    return NextResponse.json({ 
      error: err.message || 'Failed to fetch admin statistics' 
    }, { status: 500 });
  }
} 