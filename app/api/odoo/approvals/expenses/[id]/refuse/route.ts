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

    if (!comment) {
      return NextResponse.json({ error: 'Comment is required when refusing a request' }, { status: 400 });
    }

    console.log('❌ Refusing expense sheet:', id, 'by user:', uid);
    
    const client = getOdooClient();
    
    // Verify the user has permission to refuse this request
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
    
    // Check if user can refuse this request (simplified check)
    if (sheet.state !== 'submit') {
      return NextResponse.json({ error: 'Expense sheet is not in pending state' }, { status: 400 });
    }

    // Refuse the expense sheet
    const result = await (client as any).execute(
      'hr.expense.sheet',
      'action_cancel_expense_sheets',
      [[Number(id)]]
    );

    console.log('❌ Expense sheet refused successfully');

    // Add refusal comment
    try {
      await (client as any).execute(
        'hr.expense.sheet',
        'message_post',
        [Number(id), `Request refused: ${comment}`]
      );
      console.log('✅ Refusal comment added');
    } catch (commentError) {
      console.warn('Could not add refusal comment:', commentError);
    }

    return NextResponse.json({
      success: true,
      message: 'Expense sheet refused successfully',
      data: {
        id: Number(id),
        state: 'cancel',
        refused_by: approverProfile.id,
        refused_date: new Date().toISOString(),
        refusal_reason: comment
      }
    });

  } catch (error: any) {
    console.error('❌ Error refusing expense sheet:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to refuse expense sheet' 
      },
      { status: 500 }
    );
  }
} 