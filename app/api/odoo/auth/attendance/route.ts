// app/api/odoo/auth/attendance/route.ts
import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';
import { parseISO, differenceInCalendarDays } from 'date-fns';

const STANDARD_HOURS = 12; // 7am–7pm

export async function POST(req: Request) {
  try {
    const { uid, range, customDate, customRange } = await req.json();
    if (typeof uid !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid uid' }, { status: 400 });
    }

    // 1️⃣ Find employee and their barcode
    const client = getOdooClient();
    const employee = await client.getEmployeeBarcode(uid);

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee record not found for this user' },
        { status: 404 }
      );
    }

    if (!employee.barcode) {
      return NextResponse.json(
        { error: 'Employee does not have a barcode assigned' },
        { status: 400 }
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

    // 3️⃣ Fetch all attendance lines for the employee in the date range
    const fmt = (d: Date) => `${d.toISOString().slice(0,10)}`;
    const allLines = await client.getAttendanceSheetLinesByEmployee(employee.id, fmt(startDt), fmt(endDt));

    // 4️⃣ Process records
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (allLines.length > 0) {
    }
    const records = allLines.map(r => ({
      id: r.id,
      day: r.date ? dayNames[new Date(r.date).getDay()] : r.day,
      date: r.date,
      shiftCode: Array.isArray(r.schedule_code_id) ? r.schedule_code_id[1] : r.schedule_code_id || '-',
      checkIn: r.ac_sign_in,
      checkOut: r.ac_sign_out,
      mealIn: r.meal_sign_in,
      mealOut: r.meal_sign_out,
      workedHours: typeof r.total_working_time === 'number' && !isNaN(r.total_working_time)
        ? r.total_working_time
        : 0,
      status: (Array.isArray(r.status) && r.status.length > 1) ? r.status[1] : (r.status_name || r.status_display || r.status || '-'),
    }));

    // Calculate totals
    const totalHours = records.reduce((sum, n) => sum + (n.workedHours || 0), 0);
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
