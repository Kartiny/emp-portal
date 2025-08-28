import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'User ID not provided' }, { status: 400 });
    }

    const client = getOdooClient();

    // Get employee ID for the current user
    const employee = await client.execute('hr.employee', 'search_read', [
      [['user_id', '=', uid]],
      ['id', 'name']
    ]);

    if (!employee || employee.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employeeId = employee[0].id;

    // Get all requests for this employee
    const requests = await client.execute('employee.update.request', 'search_read', [
      [['employee_id', '=', employeeId]],
      [
        'id',
        'name',
        'employee_id',
        'requested_by_id',
        'state',
        'create_date',
        'rejection_reason',
        'line_ids'
      ]
    ]);

    // For each request, get the request lines (changes)
    const enrichedRequests = await Promise.all(
      requests.map(async (request: any) => {
                            // Get request lines (changes)
                    const lines = await client.execute('employee.update.request.line', 'search_read', [
                      [['request_id', '=', request.id]],
                      ['field_name', 'field_description', 'old_value', 'new_value']
                    ]);

        // Get requester details
        const requester = await client.execute('res.users', 'read', [
          [request.requested_by_id[0]],
          ['id', 'name', 'email']
        ]);

        return {
          id: request.id,
          name: request.name,
          employee: employee[0],
          requester: requester[0] || {},
          state: request.state,
          create_date: request.create_date,
          rejection_reason: request.rejection_reason,
          changes: lines,
          request_date: request.create_date
        };
      })
    );

    return NextResponse.json({
      requests: enrichedRequests,
      count: enrichedRequests.length
    });

  } catch (error: any) {
    console.error('❌ Error fetching my requests:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch my requests' 
    }, { status: 500 });
  }
} 