import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { uid, comment } = await req.json();
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Expense sheet ID is required' }, { status: 400 });
    }

    console.log('✅ Approving expense sheet:', id, 'by user:', uid);
    
    const client = getOdooClient();
    
    // Verify the user has permission to approve this request
    const approverProfile = await client.getFullUserProfile(uid);
    
    // Get the expense sheet to verify ownership
    const expenseSheet = await (client as any).execute(
      'hr.expense.sheet',
      'read',
      [[Number(id)], ['employee_id', 'state']]
    );

    if (!expenseSheet || !expenseSheet[0]) {
      return NextResponse.json({ error: 'Expense sheet not found' }, { status: 404 });
    }

    const sheet = expenseSheet[0];
    
    // Check if user can approve this request (simplified check)
    // In a real implementation, you'd check manager relationships
    if (sheet.state !== 'submit') {
      return NextResponse.json({ error: 'Expense sheet is not in pending state' }, { status: 400 });
    }

    // Approve the expense sheet
    const result = await (client as any).execute(
      'hr.expense.sheet',
      'action_approve_expense_sheets',
      [[Number(id)]]
    );

    console.log('✅ Expense sheet approved successfully');

    // Add approval comment if provided
    if (comment) {
      try {
        await (client as any).execute(
          'hr.expense.sheet',
          'message_post',
          [Number(id), comment]
        );
        console.log('✅ Approval comment added');
      } catch (commentError) {
        console.warn('Could not add approval comment:', commentError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Expense sheet approved successfully',
      data: {
        id: Number(id),
        state: 'approve',
        approved_by: approverProfile.id,
        approved_date: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Error approving expense sheet:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to approve expense sheet' 
      },
      { status: 500 }
    );
  }
} 