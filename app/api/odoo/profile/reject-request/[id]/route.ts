import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { uid, comment } = await req.json();
    const requestId = parseInt(params.id);

    if (!uid) {
      return NextResponse.json({ error: 'User ID not provided' }, { status: 400 });
    }

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID not provided' }, { status: 400 });
    }

    const client = getOdooClient();

    // Get the request to verify it exists and is in draft state
    const request = await client.execute('employee.update.request', 'read', [
      [requestId],
      ['id', 'state', 'employee_id']
    ]);

    if (!request || request.length === 0) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const currentRequest = request[0];
    if (currentRequest.state !== 'to_approve') {
      return NextResponse.json({ error: 'Request is not in to_approve state' }, { status: 400 });
    }

    // Update the request state to rejected
    await client.execute('employee.update.request', 'write', [
      [requestId],
      {
        state: 'rejected',
        rejection_reason: comment || ''
      }
    ]);

    console.log('✅ Profile change request rejected:', {
      requestId,
      employeeId: currentRequest.employee_id[0],
      reason: comment
    });

    return NextResponse.json({
      success: true,
      message: 'Profile change request rejected successfully'
    });

  } catch (error: any) {
    console.error('❌ Error rejecting request:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to reject request' 
    }, { status: 500 });
  }
} 