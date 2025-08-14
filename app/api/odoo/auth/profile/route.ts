import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
  const { uid } = await req.json();
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('🔍 Fetching profile for UID:', uid);
    
    const client = getOdooClient();
    const user = await client.getUserProfile(uid);
    
    if (!user) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Fetch employeeId from user.id (from hr.employee)
    const userEmployeeId = user.id;
    // Fetch bank details
    let bankDetails = [];
    if (userEmployeeId) {
      bankDetails = await (client as any).execute(
        'hr.bank.details',
        'search_read',
        [[['bank_emp_id', '=', userEmployeeId]]],
        {
          fields: [
            'id',
            'bank_name',
            'bank_code',
            'bank_ac_no',
            'beneficiary_name',
          ]
        }
      );
    }
    // // Fetch status history - Temporarily commented out due to "Object hr.employee.status.history doesn't exist" error
    // let statusHistory = [];
    // if (userEmployeeId) {
    //   statusHistory = await (client as any).execute(
    //     'hr.employee.status.history',
    //     'search_read',
    //     [[['employee_id', '=', userEmployeeId]]],
    //     {
    //       fields: [
    //         'id',
    //         'employee_id',
    //         'state',
    //         'start_date',
    //         'end_date',
    //         'duration',
    //       ],
    //       order: 'start_date desc'
    //     }
    //   );
    // }
    return NextResponse.json({ user, bankDetails /*, statusHistory */ });
  } catch (err: any) {
    console.error('❌ Profile API error:', err);
    
    // Provide more detailed error information
    const errorMessage = err.message || 'Unknown error occurred';
    const errorDetails = {
      error: errorMessage,
      details: err.toString(),
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
}
