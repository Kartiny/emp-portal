import { NextRequest, NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();
    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Use XML-RPC Odoo client to get employee_id
    const odoo = await getOdooClient();
    const userResult = await odoo.call<any[]>('res.users', 'read', [[uid], ['employee_id']]);
    const employeeId = userResult[0]?.employee_id?.[0];
    if (!employeeId) {
      throw new Error('No employee record found for this user');
    }
    // You can now use employeeId for further logic as needed
    return NextResponse.json({ employeeId });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch employee ID' },
      { status: 500 }
    );
  }
} 