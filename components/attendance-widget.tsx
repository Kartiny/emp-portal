'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';

// Simple type for today's attendance payload
interface TodayAttendance {
  lastClockIn: string | null;
  lastClockOut: string | null;
  records?: Array<{
    id: number;
    datetime: string;
    attn_type: string;
    job_id?: number;
    machine_id?: string;
    latitude?: number;
    longitude?: number;
  }>;
  workedHours?: number;
  latenessStr?: string;
  latenessMins?: number;
  earlyOutStr?: string;
  earlyOutMins?: number;
}

interface ShiftInfo {
  schedule_name: string | null;
  start: string | null;
  end: string | null;
  desc: string | null;
}

function formatTimeKL(dt: string | null | undefined) {
  if (!dt) return '-';
  try {
    const [datePart, timePart] = dt.split(' ');
    if (!timePart) return '-';
    const [h, m] = timePart.split(':');
    return `${h}:${m}`;
  } catch {
    return '-';
  }
}

export default function AttendanceWidget({ today, shift, onUpdate }: { today: TodayAttendance | null, shift: ShiftInfo | null, onUpdate: () => void }) {
  const [loading, setLoading] = useState(false);

  // Debug logging for shift information
  console.log('[DEBUG] AttendanceWidget received shift info:', shift);
  console.log('[DEBUG] AttendanceWidget received today data:', today);

  // Clock In handler

  // Clock In handler
  const handleClockIn = async () => {
    setLoading(true);
    try {
      const uidStr = localStorage.getItem('uid');
      if (!uidStr) throw new Error('Not logged in');
      const res = await fetch('/api/odoo/auth/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uidStr) }),
      });
      if (!res.ok) throw new Error(`(${res.status}) ${await res.text()}`);
      await res.json();  // { attendanceId }
      toast.success('Clock-in recorded');
      onUpdate(); // Refetch data in parent
    } catch (err: any) {
      console.error('❌ Clock-in error:', err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Clock Out handler
  const handleClockOut = async () => {
    setLoading(true);
    try {
      const uidStr = localStorage.getItem('uid');
      if (!uidStr) throw new Error('Not logged in');
      const res = await fetch('/api/odoo/auth/attendance/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uidStr) }),
      });
      if (!res.ok) throw new Error(`(${res.status}) ${await res.text()}`);
      await res.json();  // { success: true }
      toast.success('Clock-out recorded');
      onUpdate(); // Refetch data in parent
    } catch (err: any) {
      console.error('❌ Clock-out error:', err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Use workedHours from API (attendance.sheet.line)
  const workedHours = today && typeof today.workedHours === 'number' && !isNaN(today.workedHours)
    ? today.workedHours
    : 0;

  // Today's date formatted
  const todayStr = format(new Date(), 'EEEE, d MMMM yyyy');

  // Button enable/disable logic based on last record
  const lastRecord = today?.records && today.records.length > 0 ? today.records[today.records.length - 1] : null;
  const canClockIn = !lastRecord || lastRecord.attn_type === 'o';
  const canClockOut = lastRecord && lastRecord.attn_type === 'i';

  const lastClockIn = today?.records && today.records.length > 0
    ? [...today.records].reverse().find(r => r.attn_type === 'i')?.datetime || null
    : today?.lastClockIn || null;

  const lastClockOut = today?.records && today.records.length > 0
    ? [...today.records].reverse().find(r => r.attn_type === 'o')?.datetime || null
    : today?.lastClockOut || null;

  const checkInStatus = 'Check In';
  const mealCheckOutStatus = 'Meal Out';
  const mealCheckInStatus = 'Meal In';
  const checkOutStatus = 'Check Out';

  return (
    <div className="bg-white rounded-lg shadow p-4 lg:p-6 flex flex-col w-full text-left">
      
      <div className="mb-2">
        <h3 className="text-lg lg:text-xl font-bold text-[#1d1a4e]">{todayStr}</h3>
        <div className="text-xs lg:text-sm text-blue-800 font-medium mt-1">
          {shift ? (
            <>
              Shift: <span className="font-semibold">{shift.desc || shift.schedule_name}</span>
              {shift.start && shift.end && (
                <span className="ml-2">({shift.start} - {shift.end})</span>
              )}
            </>
          ) : <span>No shift info</span>}
        </div>
      </div>
      
      <div className="mb-2">
        <div className="text-xs lg:text-sm font-semibold">Last Clock In</div>
        <div className="mb-1 text-sm lg:text-base">{lastClockIn ? formatTimeKL(lastClockIn) : '-'}</div>
        <div className="text-xs lg:text-sm font-semibold">Last Clock Out</div>
        <div className="mb-1 text-sm lg:text-base">{lastClockOut ? formatTimeKL(lastClockOut) : '-'}</div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 lg:gap-4 mt-2">
        <Button 
          onClick={handleClockIn} 
          disabled={!canClockIn || loading}
          size="default"
          className="flex items-center gap-2 text-sm lg:text-base"
        >
          <Clock className="w-4 h-4 lg:w-5 lg:h-5" /> Clock In
        </Button>
        <Button 
          onClick={handleClockOut} 
          disabled={!canClockOut || loading}
          size="default"
          variant="destructive"
          className="flex items-center gap-2 text-sm lg:text-base"
        >
          <Clock className="w-4 h-4 lg:w-5 lg:h-5" /> Clock Out
        </Button>
      </div>
      
      {/* Show all today's clock-in/out records */}
      {today?.records && today.records.length > 0 && (
        <div className="mt-4">
          <div className="font-semibold mb-2 text-sm lg:text-base">Today's Clock In/Out Records</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs lg:text-sm border">
              <thead>
                <tr>
                  <th className="border px-1 lg:px-2 py-1">Time</th>
                  <th className="border px-1 lg:px-2 py-1">Type</th>
                  <th className="border px-1 lg:px-2 py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {today.records.map((rec, index) => {
                  let status = 'N/A';
                  if (index === 0) {
                    status = checkInStatus;
                  } else if (index === 1) {
                    status = mealCheckOutStatus;
                  } else if (index === 2) {
                    status = mealCheckInStatus;
                  } else if (index === 3) {
                    status = checkOutStatus;
                  }
                  return (
                    <tr key={rec.id}>
                      <td className="border px-1 lg:px-2 py-1">{formatTimeKL(rec.datetime)}</td>
                      <td className="border px-1 lg:px-2 py-1">{rec.attn_type === 'i' ? 'In' : rec.attn_type === 'o' ? 'Out' : rec.attn_type}</td>
                      <td className="border px-1 lg:px-2 py-1">{status}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}