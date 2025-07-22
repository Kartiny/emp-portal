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
      holiday_status_id:           request.holiday_status_id, // Time off type
      request_date_from:           request.request_date_from, // Start date
      request_date_to:             request.request_date_to,   // End date
      request_unit_half:           request.request_unit_half, // Half day
      request_unit_half_session:   request.request_unit_half_session, // Morning/Afternoon
      request_unit_hours:          request.request_unit_hours, // Custom hours
      request_hour_from:           request.request_hour_from,   // Start time
      request_hour_to:             request.request_hour_to,     // End time
      number_of_days_display:      request.number_of_days_display, // Duration
      name:                        request.name, // Reason
      supported_attachment_ids:     request.supported_attachment_ids, // Supporting doc
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
