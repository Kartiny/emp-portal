// app/api/leave/request/route.ts
import { NextResponse } from 'next/server';
import { createLeaveRequest, getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid, request } = await req.json();
    if (typeof uid !== 'number' || !request) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 1) create hr.leave record
    const newRequestId = await createLeaveRequest(uid, {
      leaveTypeId:       request.leaveTypeId,
      startDate:         request.startDate,
      endDate:           request.endDate,
      reason:            request.reason,
      // half-day/hour fields if present:
      ...(request.requestUnit && { request_unit: request.requestUnit }),
      ...(request.requestUnitHalfDay && { request_unit_half_day: request.requestUnitHalfDay }),
      ...(request.requestUnitHours    && { request_unit_hours: request.requestUnitHours }),
    });

    // 2) post a chatter message on that leave so followers (HR) get notified
    const client = getOdooClient();
    await client['execute'](
      'hr.leave',
      'message_post',
      [[newRequestId], {
        body: `<b>New leave request</b><br/>
               Employee UID: ${uid}<br/>
               From: ${request.startDate} To: ${request.endDate}<br/>
               Reason: ${request.reason}`
      }]
    );

    return NextResponse.json({ id: newRequestId });
  } catch (err: any) {
    console.error('Leave Request API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
