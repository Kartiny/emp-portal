import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = Number(searchParams.get('uid'));
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('🔍 Fetching refused leave requests for approver UID:', uid);
    
    const client = getOdooClient();
    
    // Get the approver's employee record to find their department/team
    const approverProfile = await client.getFullUserProfile(uid);
    console.log('👤 Approver profile:', approverProfile);

    // Find leave requests that are refused
    const leaveRequests = await (client as any).execute(
      'hr.leave',
      'search_read',
      [[
        ['state', '=', 'refuse'], // Refused requests
        '|',
        ['leave_manager_id', '=', approverProfile.id], // Direct reports
        ['department_id.manager_id', '=', approverProfile.id] // Department manager
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
          'name',
          'user_id',
          'employee_id',
          'department_id',
          'leave_manager_id',
          'create_date',
          'request_unit_hours',
          'request_hour_from',
          'request_hour_to'
        ],
        order: 'create_date desc'
      }
    );

    console.log('📋 Found refused leave requests:', leaveRequests.length);

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
    console.error('❌ Error fetching refused leave requests:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch refused leave requests' 
      },
      { status: 500 }
    );
  }
}