import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('📋 Fetching pending leave requests for UID:', uid);
    
    const client = getOdooClient();
    
    // Get pending leave requests
    const leaveRequests = await (client as any).execute(
      'hr.leave',
      'search_read',
      [[['state', '=', 'confirm']]],
      {
        fields: [
          'id',
          'employee_id',
          'name',
          'holiday_status_id',
          'date_from',
          'date_to',
          'number_of_days',
          'state',
          'create_date',
          'request_date_from',
          'request_date_to'
        ],
        limit: 10,
        order: 'create_date desc'
      }
    );

    // Process leave requests
    const processedRequests = leaveRequests.map((req: any) => {
      const leaveType = req.holiday_status_id ? req.holiday_status_id[1] : 'Unknown';
      const employeeName = req.employee_id ? req.employee_id[1] : 'Unknown';
      
      return {
        id: req.id,
        employee_name: employeeName,
        leave_type: leaveType,
        date_from: req.date_from || req.request_date_from,
        date_to: req.date_to || req.request_date_to,
        number_of_days: req.number_of_days || 0,
        state: req.state,
        create_date: req.create_date,
        description: req.name || `${leaveType} leave request`
      };
    });

    console.log('✅ Pending leave requests:', processedRequests.length);

    return NextResponse.json({ 
      requests: processedRequests 
    });
    
  } catch (err: any) {
    console.error('❌ Pending leave requests API error:', err);
    return NextResponse.json({ 
      error: err.message || 'Failed to fetch pending leave requests' 
    }, { status: 500 });
  }
} 