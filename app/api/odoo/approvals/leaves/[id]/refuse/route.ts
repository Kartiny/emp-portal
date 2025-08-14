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
      return NextResponse.json({ error: 'Leave request ID is required' }, { status: 400 });
    }

    if (!comment) {
      return NextResponse.json({ error: 'Comment is required when refusing a request' }, { status: 400 });
    }

    console.log('❌ Refusing leave request:', id, 'by user:', uid);
    
    const client = getOdooClient();
    
    // Verify the user has permission to refuse this request
    const approverProfile = await client.getFullUserProfile(uid);
    
    // Get the leave request to verify ownership
    const leaveRequest = await (client as any).execute(
      'hr.leave',
      'read',
      [[Number(id)], ['employee_id', 'leave_manager_id', 'department_id', 'state']]
    );

    if (!leaveRequest || !leaveRequest[0]) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    const request = leaveRequest[0];
    
    // Check if user can refuse this request
    const canRefuse = 
      request.leave_manager_id && request.leave_manager_id[0] === approverProfile.id ||
      request.department_id && request.department_id[0] === approverProfile.department_id;

    if (!canRefuse) {
      return NextResponse.json({ error: 'You do not have permission to refuse this request' }, { status: 403 });
    }

    if (request.state !== 'confirm') {
      return NextResponse.json({ error: 'Request is not in pending state' }, { status: 400 });
    }

    // Refuse the leave request
    const result = await (client as any).execute(
      'hr.leave',
      'action_refuse',
      [[Number(id)]]
    );

    console.log('❌ Leave request refused successfully');

    // Add refusal comment
    try {
      await (client as any).execute(
        'hr.leave',
        'message_post',
        [Number(id), `Request refused: ${comment}`]
      );
      console.log('✅ Refusal comment added');
    } catch (commentError) {
      console.warn('Could not add refusal comment:', commentError);
    }

    return NextResponse.json({
      success: true,
      message: 'Leave request refused successfully',
      data: {
        id: Number(id),
        state: 'refuse',
        refused_by: approverProfile.id,
        refused_date: new Date().toISOString(),
        refusal_reason: comment
      }
    });

  } catch (error: any) {
    console.error('❌ Error refusing leave request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to refuse leave request' 
      },
      { status: 500 }
    );
  }
} 