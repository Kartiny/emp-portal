import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('🔍 Fetching status history for UID:', uid);
    
    const client = getOdooClient();
    
    // First get the employee ID for this user
    const employeeResult = await (client as any).execute(
      'hr.employee',
      'search_read',
      [[['user_id', '=', parseInt(uid)]]],
      { fields: ['id'], limit: 1 }
    );

    if (!employeeResult || !employeeResult[0]) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employeeId = employeeResult[0].id;

    // Fetch status history for this employee
    // Note: This assumes there's a status history model or we're tracking changes
    // You may need to adjust the model name and fields based on your Odoo setup
    const statusHistory = await (client as any).execute(
      'hr.employee.status.history', // Adjust model name as needed
      'search_read',
      [[['employee_id', '=', employeeId]]],
      {
        fields: [
          'id',
          'employee_id',
          'state',
          'start_date',
          'end_date',
          'duration',
        ],
        order: 'effective_date desc'
      }
    );

    console.log('✅ Status history fetched successfully');
    return NextResponse.json({ statusHistory });
  } catch (err: any) {
    console.error('❌ Status history API error:', err);
    
    const errorMessage = err.message || 'Unknown error occurred';
    const errorDetails = {
      error: errorMessage,
      details: err.toString(),
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
} 