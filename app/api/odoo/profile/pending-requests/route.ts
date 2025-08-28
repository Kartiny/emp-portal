import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'User ID not provided' }, { status: 400 });
    }

    console.log('🔍 Debug - Route called with UID:', uid);

    const client = getOdooClient();

    // Test Odoo connection and model access
    let debugInfo = {};
    try {
      const modelExists = await client.execute('employee.update.request', 'search', [[]]);
      console.log('🔍 Debug - Model exists, found records:', modelExists);
      
      // Test with a different model to see if Odoo connection works
      const hrEmployeeTest = await client.execute('hr.employee', 'search', [[]]);
      console.log('🔍 Debug - hr.employee model test, found records:', hrEmployeeTest);
      
      debugInfo = {
        modelExists,
        hrEmployeeTest,
        modelExistsCount: modelExists.length,
        hrEmployeeTestCount: hrEmployeeTest.length
      };
      
    } catch (error) {
      console.error('❌ Error accessing employee.update.request model:', error);
      return NextResponse.json({ 
        error: 'Failed to access employee.update.request model',
        details: error,
        debugInfo
      }, { status: 500 });
    }

    // First, get the current user's employee record to find their employee ID
    const currentEmployee = await client.execute('hr.employee', 'search_read', [
      [['user_id', '=', uid]],
      ['id', 'name', 'user_id']
    ]);

    console.log('🔍 Debug - Current employee data:', currentEmployee);

    if (!currentEmployee || currentEmployee.length === 0) {
      console.log('🔍 Debug - No employee found for user ID:', uid);
      return NextResponse.json({
        requests: [],
        count: 0,
        error: 'No employee found for user ID'
      });
    }

    const currentEmployeeId = currentEmployee[0].id;
    console.log('🔍 Debug - Current user employee ID:', currentEmployeeId);

    // Get all pending requests
    const allRequests = await client.execute('employee.update.request', 'search_read', [
      [['state', '=', 'to_approve']], // Only get to_approve requests
      [] // No field specifications - get all fields
    ]);

    console.log('🔍 Debug - All pending requests (to_approve only):', allRequests.length);
    console.log('🔍 Debug - First request sample:', allRequests[0]);

    // For now, let's just return ALL requests to see what we have
    const enrichedRequests = await Promise.all(
      allRequests.map(async (request: any) => {
        // Get employee details
        const employee = await client.execute('hr.employee', 'read', [
          [request.employee_id[0]],
          ['id', 'name', 'work_email', 'department_id', 'job_title', 'parent_id']
        ]);

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
          employee: employee[0] || {},
          requester: requester[0] || {},
          state: request.state,
          create_date: request.create_date,
          rejection_reason: request.rejection_reason,
          changes: lines,
          request_date: request.create_date,
          debug_info: {
            current_manager_id: currentEmployeeId,
            employee_parent_id: employee[0]?.parent_id
          }
        };
      })
    );

    console.log('🔍 Debug - Returning all requests for debugging:', enrichedRequests.length);

    return NextResponse.json({
      requests: enrichedRequests,
      count: enrichedRequests.length,
      debugInfo
    });

  } catch (error: any) {
    console.error('❌ Error in pending requests route:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process request',
      details: error
    }, { status: 500 });
  }
} 