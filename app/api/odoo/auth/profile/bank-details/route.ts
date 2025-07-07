import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('🔍 Fetching bank details for UID:', uid);
    
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

    // Fetch bank details for this employee
    const bankDetails = await (client as any).execute(
      'hr.bank.details',
      'search_read',
      [[['employee_id', '=', employeeId]]],
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

    console.log('✅ Bank details fetched successfully');
    return NextResponse.json({ bankDetails });
  } catch (err: any) {
    console.error('❌ Bank details API error:', err);
    
    const errorMessage = err.message || 'Unknown error occurred';
    const errorDetails = {
      error: errorMessage,
      details: err.toString(),
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { uid, bankDetails } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!bankDetails || !Array.isArray(bankDetails)) {
      return NextResponse.json({ error: 'Bank details array is required' }, { status: 400 });
    }

    console.log('🔍 Updating bank details for UID:', uid);
    
    const client = getOdooClient();
    
    // First get the employee ID for this user
    const employeeResult = await (client as any).execute(
      'hr.employee',
      'search_read',
      [[['user_id', '=', uid]]],
      { fields: ['id'], limit: 1 }
    );

    if (!employeeResult || !employeeResult[0]) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employeeId = employeeResult[0].id;

    // Process each bank detail
    const results = [];
    for (const detail of bankDetails) {
      if (detail.id) {
        // Update existing record
        await (client as any).execute(
          'hr.bank.details',
          'write',
          [[detail.id], { ...detail, employee_id: employeeId }]
        );
        results.push({ id: detail.id, action: 'updated' });
      } else {
        // Create new record
        const newId = await (client as any).execute(
          'hr.bank.details',
          'create',
          [{ ...detail, employee_id: employeeId }]
        );
        results.push({ id: newId, action: 'created' });
      }
    }

    console.log('✅ Bank details updated successfully');
    return NextResponse.json({ results });
  } catch (err: any) {
    console.error('❌ Bank details update error:', err);
    
    const errorMessage = err.message || 'Unknown error occurred';
    const errorDetails = {
      error: errorMessage,
      details: err.toString(),
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
} 