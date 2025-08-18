import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = Number(searchParams.get('uid'));
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('🔍 Fetching pending leave requests for approver UID:', uid);
    
    const client = getOdooClient();
    
    // For now, let's fetch all pending leave requests without filtering by approver
    // This will show all requests that need approval
    const leaveRequests = await (client as any).execute(
      'hr.leave',
      'search_read',
      [[
        ['state', '=', 'confirm'] // Requests waiting for approval
      ]],
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
        ],
        order: 'create_date desc',
        limit: 50 // Limit to 50 requests for performance
      }
    );

    console.log('📋 Found leave requests:', leaveRequests.length);

    // Enrich the data with employee information
    const enrichedRequests = await Promise.all(
      leaveRequests.map(async (request: any) => {
        try {
          // Get employee details
          const employee = await (client as any).execute(
            'hr.employee',
            'read',
            [[request.employee_id[0]], ['name', 'department_id', 'work_email', 'image_1920']]
          );

          return {
            id: request.id,
            type: 'leave',
            employee: {
              id: request.employee_id[0],
              name: employee[0]?.name || 'Unknown Employee',
              department: employee[0]?.department_id ? employee[0].department_id[1] : 'Unknown Department',
              avatar: employee[0]?.image_1920 || '/placeholder-user.jpg',
              email: employee[0]?.work_email || ''
            },
            leave_type: request.holiday_status_id ? request.holiday_status_id[1] : 'Unknown Type',
            date_from: request.request_date_from,
            date_to: request.request_date_to,
            number_of_days: request.number_of_days_display || request.number_of_days,
            description: request.name,
            state: request.state,
            submitted_date: request.create_date,
            request_unit_hours: request.request_unit_hours,
            request_hour_from: request.request_hour_from,
            request_hour_to: request.request_hour_to,
            department: request.department_id ? request.department_id[1] : 'Unknown Department'
          };
        } catch (error) {
          console.error('Error enriching request:', error);
          return null;
        }
      })
    );

    const validRequests = enrichedRequests.filter(req => req !== null);

    return NextResponse.json({
      success: true,
      data: {
        leaves: validRequests
      },
      pagination: {
        total: validRequests.length,
        page: 1,
        per_page: validRequests.length
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching pending leave requests:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch pending leave requests' 
      },
      { status: 500 }
    );
  }
} 