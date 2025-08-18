
import { NextRequest, NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Missing request ID' }, { status: 400 });
  }

  try {
    console.log('🔍 Fetching leave request details for ID:', id);
    
    const client = getOdooClient();
    
    // Get the leave request details
    const leaveRequest = await (client as any).execute(
      'hr.leave',
      'read',
      [[parseInt(id, 10)]],
      {
        fields: [
          'id',
          'name',
          'holiday_status_id',
          'request_date_from',
          'request_date_to',
          'number_of_days',
          'number_of_days_display',
          'state',
          'user_id',
          'employee_id',
          'department_id',
          'create_date',
          'request_unit_hours',
          'request_hour_from',
          'request_hour_to'
        ]
      }
    );

    if (!leaveRequest || leaveRequest.length === 0) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    const request = leaveRequest[0];
    console.log('📋 Found leave request:', request.id);

    // Get employee details
    const employee = await (client as any).execute(
      'hr.employee',
      'read',
      [[request.employee_id[0]], ['name', 'department_id', 'work_email', 'image_1920', 'job_title']]
    );

    // Get department details
    const department = request.department_id ? await (client as any).execute(
      'hr.department',
      'read',
      [[request.department_id[0]], ['name']]
    ) : null;

    // Get leave type details
    const leaveType = request.holiday_status_id ? await (client as any).execute(
      'hr.leave.type',
      'read',
      [[request.holiday_status_id[0]], ['name', 'color_name']]
    ) : null;

    const enrichedRequest = {
      id: request.id,
      employee: {
        id: request.employee_id[0],
        name: employee[0]?.name || 'Unknown Employee',
        department: department?.[0]?.name || 'Unknown Department',
        avatar: employee[0]?.image_1920 || '/placeholder-user.jpg',
        email: employee[0]?.work_email || '',
        job_title: employee[0]?.job_title || ''
      },
      leave_type: {
        id: request.holiday_status_id?.[0],
        name: leaveType?.[0]?.name || 'Unknown Type',
        color: leaveType?.[0]?.color_name || 'default'
      },
      date_from: request.request_date_from,
      date_to: request.request_date_to,
      number_of_days: request.number_of_days_display || request.number_of_days,
      description: request.name,
      state: request.state,
      submitted_date: request.create_date,
      request_unit_hours: request.request_unit_hours,
      request_hour_from: request.request_hour_from,
      request_hour_to: request.request_hour_to,
      department: department?.[0]?.name || 'Unknown Department'
    };

    console.log('✅ Successfully enriched leave request data');

    return NextResponse.json(enrichedRequest);
  } catch (error: any) {
    console.error('❌ Error fetching leave request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { status } = await req.json();

  if (!id || !status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const client = getOdooClient();
    
    const result = await (client as any).execute(
      'hr.leave',
      'write',
      [[parseInt(id, 10)], { state: status }]
    );

    return NextResponse.json({ success: result });
  } catch (error: any) {
    console.error('❌ Error updating leave request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
