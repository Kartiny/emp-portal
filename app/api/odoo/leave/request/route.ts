// /app/api/odoo/leave/request/route.ts

import { NextResponse } from 'next/server';
import { createLeaveRequest, getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid, request } = await req.json();
    if (typeof uid !== 'number' || typeof request !== 'object') {
      return NextResponse.json(
        { error: 'Invalid payload: uid or request missing' },
        { status: 400 }
      );
    }

    // 1) Create the hr.leave record
    const newRequestId = await createLeaveRequest(uid, {
      leaveTypeId:                 request.leaveTypeId,
      request_date_from:           request.request_date_from,
      request_date_to:             request.request_date_to,
      reason:                      request.reason,
      request_unit:                request.request_unit,          // 'day' if day-based
      request_unit_half_day:       request.request_unit_half_day, // 'am' | 'pm' if half-day
      request_unit_hours:          request.request_unit_hours,    // true if hours
      request_hour_from:           request.request_hour_from,     // '09:00'
      request_hour_to:             request.request_hour_to,       // '13:30'
      number_of_days:              request.number_of_days,        // 0.5 for half-day or 1.0 for full-day
      number_of_days_display:      request.number_of_days_display,// e.g. 3.5 if hours
      attachment_id:               request.attachment_id,         // optional attachment
    });

    // 2) Post a message in the chatter (so HR gets notified)
    //    Note: hr.leave.message_post signature expects: [record_ids], { body: '…' }
    const client = getOdooClient();
    let body = `<b>New Leave Request</b><br/>` +
               `Employee UID: ${uid}<br/>` +
               `From: ${request.request_date_from} To: ${request.request_date_to}<br/>`;
    if (request.request_unit_hours) {
      body += `Time: ${request.request_hour_from || '-'} to ${request.request_hour_to || '-'}<br/>`;
      body += `Hours: ${request.number_of_days_display || '-'}<br/>`;
    } else if (request.request_unit_half_day) {
      body += `Half-Day: ${request.request_unit_half_day.toUpperCase()}<br/>`;
    } else {
      body += `Days: ${request.number_of_days || 1}<br/>`;
    }
    body += `Reason: ${request.reason}`;

    await client.postMessage('hr.leave', [newRequestId], body);

    return NextResponse.json({ id: newRequestId }, { status: 201 });
  } catch (err: any) {
    console.error('Leave Request API Error:', err);
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
