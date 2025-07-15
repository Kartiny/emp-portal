import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('📋 Fetching pending expense requests for UID:', uid);
    
    const client = getOdooClient();
    
    // Get pending expense requests
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
          'create_date',
          'date',
          'product_id',
          'quantity',
          'unit_amount'
        ],
        limit: 10,
        order: 'create_date desc'
      }
    );

    // Process expense requests
    const processedRequests = expenseRequests.map((req: any) => {
      const employeeName = req.employee_id ? req.employee_id[1] : 'Unknown';
      const productName = req.product_id ? req.product_id[1] : 'Unknown';
      
      return {
        id: req.id,
        employee_name: employeeName,
        name: req.name || productName,
        total_amount: req.total_amount || 0,
        state: req.state,
        create_date: req.create_date,
        date: req.date,
        product: productName,
        quantity: req.quantity || 1,
        unit_amount: req.unit_amount || 0
      };
    });

    console.log('✅ Pending expense requests:', processedRequests.length);

    return NextResponse.json({ 
      requests: processedRequests 
    });
    
  } catch (err: any) {
    console.error('❌ Pending expense requests API error:', err);
    return NextResponse.json({ 
      error: err.message || 'Failed to fetch pending expense requests' 
    }, { status: 500 });
  }
} 