import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = Number(searchParams.get('uid'));
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('🔍 Fetching refused expense requests for approver UID:', uid);
    
    const client = getOdooClient();
    
    // Get the approver's employee record to find their department/team
    const approverProfile = await client.getFullUserProfile(uid);

    // Find expense requests that are refused
    const expenseRequests = await (client as any).execute(
      'hr.expense',
      'search_read',
      [[
        ['state', '=', 'refused'], // Refused requests
        '|',
        ['employee_id.parent_id.user_id', '=', uid], // Direct reports
        ['department_id.manager_id.user_id', '=', uid] // Department manager
      ]],
      {
        fields: [
          'id',
          'name',
          'total_amount',
          'currency_id',
          'state',
          'employee_id',
          'department_id',
          'create_date',
          'expense_line_ids',
        ],
        order: 'create_date desc'
      }
    );

    console.log('📋 Found refused expense requests:', expenseRequests.length);

    // Enrich the data with employee and expense line information
    const enrichedRequests = await Promise.all(
      expenseRequests.map(async (request: any) => {
        try {
          // Get employee details
          const employee = await (client as any).execute(
            'hr.employee',
            'read',
            [[request.employee_id[0]], ['name', 'department_id', 'work_email', 'image_1920']]
          );

          // Get expense line details
          const expenseLines = await (client as any).execute(
            'hr.expense.sheet.line',
            'read',
            [request.expense_line_ids, ['name', 'product_id', 'unit_amount', 'quantity', 'total_amount', 'date', 'attachment_number']]
          );

          return {
            id: request.id,
            employee: {
              id: request.employee_id[0],
              name: employee[0]?.name || 'Unknown Employee',
              department: employee[0]?.department_id ? employee[0].department_id[1] : 'Unknown Department',
              avatar: employee[0]?.image_1920 || '/placeholder-user.jpg',
              email: employee[0]?.work_email || ''
            },
            name: request.name,
            total_amount: request.total_amount,
            currency: request.currency_id ? request.currency_id[1] : 'USD',
            state: request.state,
            submitted_date: request.create_date,
            expense_lines: expenseLines.map((line: any) => ({
              id: line.id,
              description: line.name,
              product: line.product_id ? line.product_id[1] : 'Unknown Product',
              unit_amount: line.unit_amount,
              quantity: line.quantity,
              total_amount: line.total_amount,
              date: line.date,
              has_attachment: line.attachment_number > 0,
            })),
            department: request.department_id ? request.department_id[1] : 'Unknown Department'
          };
        } catch (error) {
          console.error('Error enriching expense request:', error);
          return null;
        }
      })
    );

    const validRequests = enrichedRequests.filter(req => req !== null);

    return NextResponse.json({
      success: true,
      data: {
        expenses: validRequests
      },
      pagination: {
        total: validRequests.length,
        page: 1,
        per_page: validRequests.length
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching refused expense requests:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch refused expense requests' 
      },
      { status: 500 }
    );
  }
}