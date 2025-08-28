import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { uid, comment } = await req.json();
    const requestId = parseInt(params.id);

    if (!uid) {
      return NextResponse.json({ error: 'User ID not provided' }, { status: 400 });
    }

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID not provided' }, { status: 400 });
    }

    const client = getOdooClient();

    // Get the request to verify it exists and is in draft state
    const request = await client.execute('employee.update.request', 'read', [
      [requestId],
      ['id', 'state', 'employee_id', 'line_ids']
    ]);

    if (!request || request.length === 0) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const currentRequest = request[0];
    if (currentRequest.state !== 'to_approve') {
      return NextResponse.json({ error: 'Request is not in to_approve state' }, { status: 400 });
    }

    // Update the request state to approved
    await client.execute('employee.update.request', 'write', [
      [requestId],
      {
        state: 'approved',
        rejection_reason: comment || ''
      }
    ]);

    // Get the request lines to apply the changes to the employee
    const lines = await client.execute('employee.update.request.line', 'search_read', [
      [['request_id', '=', requestId]],
      ['field_name', 'new_value']
    ]);

    // Apply the changes to the employee record
    const employeeUpdates: any = {};
    lines.forEach((line: any) => {
      employeeUpdates[line.field_name] = line.new_value;
    });

    if (Object.keys(employeeUpdates).length > 0) {
      await client.execute('hr.employee', 'write', [
        [currentRequest.employee_id[0]],
        employeeUpdates
      ]);
    }

    console.log('✅ Profile change request approved:', {
      requestId,
      employeeId: currentRequest.employee_id[0],
      changes: Object.keys(employeeUpdates)
    });

    return NextResponse.json({
      success: true,
      message: 'Profile change request approved successfully'
    });

  } catch (error: any) {
    console.error('❌ Error approving request:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to approve request' 
    }, { status: 500 });
  }
} 