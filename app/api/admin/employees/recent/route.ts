import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('👥 Fetching recent employees for UID:', uid);
    
    const client = getOdooClient();
    
    // Get recent employees with their basic info
    const employees = await (client as any).execute(
      'hr.employee',
      'search_read',
      [[]],
      {
        fields: [
          'id',
          'name',
          'job_title',
          'department_id',
          'work_email',
          'work_phone',
          'active'
        ],
        limit: 10,
        order: 'id desc'
      }
    );

    // Get today's attendance for each employee
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await (client as any).execute(
      'hr.attendance',
      'search_read',
      [[['check_in', '>=', `${today} 00:00:00`]]],
      {
        fields: ['employee_id', 'check_in', 'check_out'],
        order: 'check_in desc'
      }
    );

    // Create a map of employee attendance
    const attendanceMap = new Map();
    todayAttendance.forEach((att: any) => {
      if (att.employee_id && att.employee_id[0]) {
        attendanceMap.set(att.employee_id[0], att);
      }
    });

    // Process employees data
    const processedEmployees = employees.map((emp: any) => {
      const attendance = attendanceMap.get(emp.id);
      const lastAttendance = attendance ? 
        new Date(attendance.check_in).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : 'No attendance today';

      return {
        id: emp.id,
        name: emp.name,
        job_title: emp.job_title || 'Not specified',
        department: emp.department_id ? emp.department_id[1] : 'Not assigned',
        status: emp.active ? 'Active' : 'Inactive',
        last_attendance: lastAttendance,
        email: emp.work_email,
        phone: emp.work_phone
      };
    });

    console.log('✅ Recent employees:', processedEmployees.length);

    return NextResponse.json({ 
      employees: processedEmployees 
    });
    
  } catch (err: any) {
    console.error('❌ Recent employees API error:', err);
    return NextResponse.json({ 
      error: err.message || 'Failed to fetch recent employees' 
    }, { status: 500 });
  }
} 