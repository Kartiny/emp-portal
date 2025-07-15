'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

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
}

const MALAYSIA_TZ = 'Asia/Kuala_Lumpur';

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

export default function AttendanceWidget() {
  const [today, setToday] = useState<TodayAttendance | null>(null);
  const [shift, setShift] = useState<ShiftInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [shiftError, setShiftError] = useState<string | null>(null);

  // Helper to fetch today's attendance
  const fetchToday = async () => {
    setError('');
    try {
      const uidStr = localStorage.getItem('uid');
      console.log('🔍 UID from localStorage:', uidStr);
      
      if (!uidStr) {
        throw new Error('Not logged in - no UID found in localStorage');
      }
      
      const uid = Number(uidStr);
      console.log('🔍 Parsed UID:', uid);
      
      if (isNaN(uid) || uid <= 0) {
        throw new Error(`Invalid UID: ${uidStr} (parsed as ${uid})`);
      }
      
      const res = await fetch('/api/odoo/auth/attendance/today', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      
      console.log('🔍 Response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`(${res.status}) ${errorText}`);
      }
      
      const data: TodayAttendance = await res.json();
      console.log('✅ Today attendance data:', data);
      setToday(data);
    } catch (err: any) {
      console.error('❌ Failed to fetch today attendance:', err);
      setError(err.message);
      toast.error(err.message);
    }
  };

  // Fetch shift info
  const fetchShift = async () => {
    setShiftError(null);
    setShiftLoading(true);
    try {
      const uidStr = localStorage.getItem('uid');
      if (!uidStr) throw new Error('Not logged in');
      const res = await fetch('/api/odoo/auth/attendance/shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uidStr) }),
      });
      if (!res.ok) throw new Error(`(${res.status}) ${await res.text()}`);
      const data: ShiftInfo = await res.json();
      setShift(data);
    } catch (err: any) {
      console.error('❌ Failed to fetch shift info:', err);
      setShiftError(err.message);
    } finally {
      setShiftLoading(false);
    }
  };

  useEffect(() => {
    fetchToday();
    fetchShift();
  }, []);

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
      await fetchToday();
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
      await fetchToday();
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

  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col w-full text-left max-w-xl min-w-[320px]" style={{ minWidth: '320px', maxWidth: '480px' }}>
      
      <div className="mb-2">
        <h3 className="text-xl font-bold text-[#1d1a4e]">{todayStr}</h3>
        <div className="text-sm text-blue-800 font-medium mt-1">
          {shiftLoading ? 'Loading shift...' : shiftError ? <span className="text-red-500">{shiftError}</span> : shift && shift.schedule_name ? (
            <>
              Shift: <span className="font-semibold">{shift.schedule_name}</span>
              {shift.start && shift.end && (
                <span className="ml-2">({shift.start} - {shift.end})</span>
              )}
            </>
          ) : <span>No shift info</span>}
        </div>
      </div>
      <div className="mb-2">
        <div className="text-sm font-semibold">Last Clock In</div>
        <div className="mb-1">{today?.lastClockIn ? formatTimeKL(today.lastClockIn) : '-'}</div>
        <div className="text-sm font-semibold">Last Clock Out</div>
        <div className="mb-1">{today?.lastClockOut ? formatTimeKL(today.lastClockOut) : '-'}</div>
        <div className="text-sm font-semibold">Hours Today</div>
      </div>
      <div className="flex gap-4 mt-2">
        <Button
          onClick={handleClockIn}
          disabled={!canClockIn || !!error || loading}
          size="lg"
          className="flex items-center gap-2"
        >
          <Clock className="w-5 h-5" /> Clock In
        </Button>
        <Button
          onClick={handleClockOut}
          disabled={!canClockOut || !!error || loading}
          size="lg"
          variant="destructive"
          className="flex items-center gap-2"
        >
          <Clock className="w-5 h-5" /> Clock Out
        </Button>
      </div>
      {/* Show all today's clock-in/out records */}
      {today?.records && today.records.length > 0 && (
        <div className="mt-4">
          <div className="font-semibold mb-2">Today's Clock In/Out Records</div>
          <table className="w-full text-sm border">
            <thead>
              <tr>
                <th className="border px-2 py-1">Time</th>
                <th className="border px-2 py-1">Type</th>
              </tr>
            </thead>
            <tbody>
              {today.records.map((rec) => (
                <tr key={rec.id}>
                  <td className="border px-2 py-1">{formatTimeKL(rec.datetime)}</td>
                  <td className="border px-2 py-1">{rec.attn_type === 'i' ? 'In' : rec.attn_type === 'o' ? 'Out' : rec.attn_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
}
