import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = Number(searchParams.get('uid'));
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('🔍 Fetching pending expense requests for approver UID:', uid);
    
    const client = getOdooClient();
    
    // For now, let's fetch all pending expense sheets without filtering by approver
    const expenseSheets = await (client as any).execute(
      'hr.expense.sheet',
      'search_read',
      [[
        ['state', '=', 'submit'] // Requests waiting for approval
      ]],
      {
        fields: [
          'id',
          'name',
          'employee_id',
          'total_amount',
          'currency_id',
          'state',
          'create_date',
          'expense_line_ids'
        ],
        order: 'create_date desc',
        limit: 50 // Limit to 50 requests for performance
      }
    );

    console.log('📋 Found expense sheets:', expenseSheets.length);

    // Enrich the data with employee information and expense lines
    const enrichedRequests = await Promise.all(
      expenseSheets.map(async (sheet: any) => {
        try {
          // Get employee details
          const employee = await (client as any).execute(
            'hr.employee',
            'read',
            [[sheet.employee_id[0]], ['name', 'department_id', 'work_email', 'image_1920']]
          );

          // Get expense lines
          const expenseLines = await (client as any).execute(
            'hr.expense',
            'search_read',
            [[['sheet_id', '=', sheet.id]]],
            {
              fields: [
                'id',
                'name',
                'product_id',
                'unit_amount',
                'quantity',
                'total_amount',
                'date',
                'attachment_ids'
              ]
            }
          );

          return {
            id: sheet.id,
            type: 'expense',
            employee: {
              id: sheet.employee_id[0],
              name: employee[0]?.name || 'Unknown Employee',
              department: employee[0]?.department_id ? employee[0].department_id[1] : 'Unknown Department',
              avatar: employee[0]?.image_1920 || '/placeholder-user.jpg',
              email: employee[0]?.work_email || ''
            },
            name: sheet.name,
            total_amount: sheet.total_amount,
            currency: sheet.currency_id ? sheet.currency_id[1] : 'USD',
            state: sheet.state,
            submitted_date: sheet.create_date,
            expense_lines: expenseLines.map((line: any) => ({
              id: line.id,
              description: line.name,
              product: line.product_id ? line.product_id[1] : 'Unknown',
              unit_amount: line.unit_amount,
              quantity: line.quantity,
              total_amount: line.total_amount,
              date: line.date,
              has_attachment: line.attachment_ids && line.attachment_ids.length > 0
            })),
            department: employee[0]?.department_id ? employee[0].department_id[1] : 'Unknown Department'
          };
        } catch (error) {
          console.error('Error enriching expense sheet:', error);
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
    console.error('❌ Error fetching pending expense requests:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch pending expense requests' 
      },
      { status: 500 }
    );
  }
} 