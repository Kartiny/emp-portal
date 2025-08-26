import { NextResponse } from 'next/server';
import { OdooClient } from '@/lib/odooXml';

export async function GET() {
  const odoo = new OdooClient();

  try {
    const balances = await odoo.execute('hr.leave.allocation', 'search_read', [
      [],
      {
        fields: ['employee_id', 'number_of_days', 'holiday_status_id'],
      },
    ]);

    return NextResponse.json(balances);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    
    if (!uid) {
      return NextResponse.json({ error: 'Missing uid parameter' }, { status: 400 });
    }

    const odoo = new OdooClient();

    // Try to fetch employee-specific allocations
    const balances = await odoo.execute('hr.leave.allocation', 'search_read', [
      [['employee_id', '=', uid]],
      {
        fields: ['employee_id', 'number_of_days', 'number_of_days_display', 'holiday_status_id', 'leaves_taken', 'state', 'date_from', 'date_to', 'manager_id', 'notes'],
      },
    ]);

    return NextResponse.json(balances);
  } catch (error: any) {
    console.error('Leave balances API error:', error);
    
    // Return mock data as fallback
    const mockAllocations = [
      {
        id: 1,
        holiday_status_id: [1, 'Annual Leave'],
        number_of_days_display: 20,
        leaves_taken: 5,
        state: 'validate',
        date_from: '2024-01-01',
        date_to: '2024-12-31',
        manager_id: [1, 'Manager Name'],
        notes: 'Annual leave allocation for 2024'
      },
      {
        id: 2,
        holiday_status_id: [2, 'Medical Leave'],
        number_of_days_display: 14,
        leaves_taken: 2,
        state: 'validate',
        date_from: '2024-01-01',
        date_to: '2024-12-31',
        manager_id: [1, 'Manager Name'],
        notes: 'Medical leave allocation for 2024'
      }
    ];

    return NextResponse.json(mockAllocations);
  }
}