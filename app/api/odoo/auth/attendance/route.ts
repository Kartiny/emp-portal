// app/api/odoo/auth/attendance/route.ts
import { NextResponse } from 'next/server';
import { getFullUserProfile, getOdooClient } from '@/lib/odooXml';
import { parseISO, differenceInCalendarDays } from 'date-fns';

const STANDARD_HOURS = 12; // 7am–7pm

export async function POST(req: Request) {
  try {
    const { uid, range, customDate, customRange } = await req.json();
    if (typeof uid !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid uid' }, { status: 400 });
    }

    // 1️⃣ Find employee
    const profile = await getFullUserProfile(uid);
    const empId = profile.id;
    if (!empId) {
      return NextResponse.json(
        { error: 'Employee record not found for this user' },
        { status: 404 }
      );
    }

    // 2️⃣ Calculate date window
    let startDt: Date, endDt: Date;
    if (range === 'custom' && customRange) {
      startDt = parseISO(customRange.from);
      endDt   = parseISO(customRange.to);
    } else {
      const base = parseISO(customDate);
      switch (range) {
        case 'daily':
          startDt = new Date(base.setHours(0,0,0,0));
          endDt   = new Date(base.setHours(23,59,59,999));
          break;
        case 'weekly': {
          const monday = new Date(base);
          monday.setDate(monday.getDate() - ((monday.getDay()+6)%7));
          startDt = new Date(monday.setHours(0,0,0,0));
          const sunday = new Date(startDt);
          sunday.setDate(sunday.getDate()+6);
          endDt = new Date(sunday.setHours(23,59,59,999));
          break;
        }
        case 'biweekly': {
          const monday = new Date(base);
          monday.setDate(monday.getDate() - ((monday.getDay()+6)%7));
          startDt = new Date(monday.setHours(0,0,0,0));
          const twoWeeks = new Date(startDt);
          twoWeeks.setDate(twoWeeks.getDate()+13);
          endDt = new Date(twoWeeks.setHours(23,59,59,999));
          break;
        }
        case 'monthly':
        default:
          startDt = new Date(base.getFullYear(), base.getMonth(), 1, 0,0,0,0);
          endDt   = new Date(base.getFullYear(), base.getMonth()+1, 0, 23,59,59,999);
      }
    }

    // 3️⃣ Query Odoo hr.attendance
    const fmt = (d: Date) => `${d.toISOString().slice(0,10)} ${d.toTimeString().slice(0,8)}`;
    const domain = [
      ['employee_id','=', empId],
      ['check_in','>=', fmt(startDt)],
      ['check_in','<=', fmt(endDt)],
    ];
    const client = getOdooClient();
    // @ts-ignore
    const raw = await client.execute(
      'hr.attendance',
      'search_read',
      [domain],
      { fields: ['id','check_in','check_out','worked_hours'], order: 'check_in asc' }
    );

    // 4️⃣ Map + totals
    // For each record, fetch shift code for that date
    const records = await Promise.all(raw.map(async (r: any) => {
      // Get the date part of check_in
      const checkInDate = r.check_in ? r.check_in.split(' ')[0] : null;
      let shiftCode = null;
      if (checkInDate) {
        // Get shift code for that date
        try {
          const jsDate = new Date(checkInDate);
          const profile = await getFullUserProfile(uid);
          const calendar = profile.resource_calendar_id;
          if (calendar && Array.isArray(calendar) && calendar[0]) {
            const calendarId = calendar[0];
            // Odoo: 0=Monday, 6=Sunday
            const jsDay = jsDate.getDay();
            const odooDay = jsDay === 0 ? 6 : jsDay - 1;
            const attendanceLines = await client['execute'](
              'resource.calendar.attendance',
              'search_read',
              [[['calendar_id', '=', calendarId], ['dayofweek', '=', odooDay]]],
              { fields: ['schedule_code_id'], limit: 1 }
            );
            if (attendanceLines && attendanceLines.length > 0) {
              const scheduleCode = attendanceLines[0].schedule_code_id;
              if (scheduleCode && Array.isArray(scheduleCode) && scheduleCode[1]) {
                shiftCode = scheduleCode[1];
              }
            }
          }
        } catch (e) {
          shiftCode = null;
        }
      }
      return {
        id: r.id,
        checkIn: r.check_in,
        checkOut: r.check_out,
        workedHours: r.worked_hours || 0,
        shiftCode,
      };
    }));
    const totalHours = records.reduce((sum: number, n: { workedHours: number }) => sum + n.workedHours, 0);
    const days = differenceInCalendarDays(endDt, startDt) + 1;
    const rate = days > 0 ? (totalHours / (days * STANDARD_HOURS)) * 100 : 0;

    return NextResponse.json({
      totalHours,
      rate,
      records,
      dateRange: { start: startDt.toISOString().slice(0,10), end: endDt.toISOString().slice(0,10) },
    });
  } catch (err: any) {
    console.error('Range attendance error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
