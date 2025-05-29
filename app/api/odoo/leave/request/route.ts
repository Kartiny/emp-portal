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
      request_date_from: request.request_date_from,
      request_date_to:   request.request_date_to,
      reason:            request.reason,
      ...(request.request_unit && { request_unit: request.request_unit }),
      ...(request.request_unit_half_day && { request_unit_half_day: request.request_unit_half_day }),
      ...(typeof request.request_unit_hours !== 'undefined' && { request_unit_hours: request.request_unit_hours }),
      ...(request.request_hour_from && { request_hour_from: request.request_hour_from }),
      ...(request.request_hour_to && { request_hour_to: request.request_hour_to }),
      ...(typeof request.number_of_days_display !== 'undefined' && { number_of_days_display: request.number_of_days_display }),
    });

    // 2) post a chatter message on that leave so followers (HR) get notified
    const client = getOdooClient();
    let body = `<b>New leave request</b><br/>
               Employee UID: ${uid}<br/>
               From: ${request.request_date_from} To: ${request.request_date_to}<br/>`;
    if (request.request_unit_hours) {
      body += `Time: ${request.request_hour_from || '-'} to ${request.request_hour_to || '-'}<br/>`;
      body += `Hours: ${request.number_of_days_display || '-'}<br/>`;
    }
    body += `Reason: ${request.reason}`;
    await client['execute'](
      'hr.leave',
      'message_post',
      [[newRequestId], {
        body
      }]
    );

    return NextResponse.json({ id: newRequestId });
  } catch (err: any) {
    console.error('Leave Request API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
