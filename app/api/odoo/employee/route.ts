import { NextRequest, NextResponse } from 'next/server';
import { getAllEmployees, getOdooClient } from '@/lib/odooXml';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getOdooClient();

    console.log('[DEBUG] Employee API POST received body:', body);

    if (body.filters) {
      console.log('[DEBUG] Employee API POST - Fetching employees with filters:', body.filters);
      const employees = await getAllEmployees(body.filters);
      return NextResponse.json({ employees });
    } else if (body.name) {
      console.log('[DEBUG] Employee API POST - Creating employee:', body.name);
      const newEmployeeId = await client.createEmployee(body);
      return NextResponse.json({ id: newEmployeeId });
    } else {
      console.log('[DEBUG] Employee API POST - Invalid request body');
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('❌ Error in employee API:', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to process employee request' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { ids } = await req.json();
    const client = getOdooClient();
    await client.deleteEmployees(ids);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('❌ Error deleting employees:', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to delete employees' },
      { status: 500 }
    );
  }
}
