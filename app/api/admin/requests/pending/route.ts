import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('📋 Fetching pending requests for UID:', uid);
    
    const client = getOdooClient();
    
    const requests: any[] = [];

    // Get pending leave requests
    try {
      const leaveRequests = await (client as any).execute(
        'hr.leave',
        'search_read',
        [[['state', '=', 'confirm']]],
        {
          fields: [
            'id',
            'employee_id',
            'name',
            'date_from',
            'date_to',
            'number_of_days',
            'state',
            'create_date'
          ],
          limit: 5,
          order: 'create_date desc'
        }
      );

      leaveRequests.forEach((req: any) => {
        requests.push({
          id: req.id,
          employee_name: req.employee_id ? req.employee_id[1] : 'Unknown',
          type: 'Leave',
          status: req.state,
          created_date: new Date(req.create_date).toLocaleDateString(),
          description: `${req.name} (${req.number_of_days} days)`,
          date_from: req.date_from,
          date_to: req.date_to
        });
      });
    } catch (error) {
      console.warn('Could not fetch leave requests:', error);
    }

    // Get pending expense requests
    try {
      const expenseRequests = await (client as any).execute(
        'hr.expense',
        'search_read',
        [[['state', '=', 'submit']]],
        {
          fields: [
            'id',
            'employee_id',
            'name',
            'total_amount',
            'state',
            'create_date'
          ],
          limit: 5,
          order: 'create_date desc'
        }
      );

      expenseRequests.forEach((req: any) => {
        requests.push({
          id: req.id,
          employee_name: req.employee_id ? req.employee_id[1] : 'Unknown',
          type: 'Expense',
          status: req.state,
          created_date: new Date(req.create_date).toLocaleDateString(),
          description: `${req.name} ($${req.total_amount})`,
          amount: req.total_amount
        });
      });
    } catch (error) {
      console.warn('Could not fetch expense requests:', error);
    }

    // Sort by creation date (most recent first)
    requests.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());

    // Limit to 10 most recent requests
    const limitedRequests = requests.slice(0, 10);

    console.log('✅ Pending requests:', limitedRequests.length);

    return NextResponse.json({ 
      requests: limitedRequests 
    });
    
  } catch (err: any) {
    console.error('❌ Pending requests API error:', err);
    return NextResponse.json({ 
      error: err.message || 'Failed to fetch pending requests' 
    }, { status: 500 });
  }
} 