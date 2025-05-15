'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Clock } from 'lucide-react';

// Simple type for today's attendance payload
interface TodayAttendance {
  lastClockIn: string | null;
  lastClockOut: string | null;
}

export default function AttendanceWidget() {
  const [today, setToday] = useState<TodayAttendance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to fetch today's attendance
  const fetchToday = async () => {
    setError(null);
    try {
      const uidStr = localStorage.getItem('uid');
      if (!uidStr) throw new Error('Not logged in');
      const res = await fetch('/api/odoo/auth/attendance/today', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uidStr) }),
      });
      if (!res.ok) throw new Error(`(${res.status}) ${await res.text()}`);
      const data: TodayAttendance = await res.json();
      setToday(data);
    } catch (err: any) {
      console.error('❌ Failed to fetch today attendance:', err);
      setError(err.message);
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchToday();
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

  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center w-full max-w-md mx-auto">
      <h3 className="text-xl font-bold mb-2 text-[#1d1a4e]">Quick Clock</h3>
      <div className="flex gap-4 mb-2 w-full justify-center">
        <Button onClick={handleClockIn} disabled={!(today && !error && (!today.lastClockIn || (today.lastClockIn && today.lastClockOut))) || loading} size="lg" className="flex items-center gap-2">
          <Clock className="w-5 h-5" /> Clock In
        </Button>
        <Button onClick={handleClockOut} disabled={!(today && !error && (today.lastClockIn && !today.lastClockOut)) || loading} size="lg" variant="destructive" className="flex items-center gap-2">
          <Clock className="w-5 h-5" /> Clock Out
        </Button>
      </div>
      <div className="flex flex-col items-center text-xs text-muted-foreground mt-2">
        {today && (
          <>
            <div>Last Clock In: <span className="font-medium">{today.lastClockIn ? new Date(today.lastClockIn).toLocaleTimeString() : '-'}</span></div>
            <div>Last Clock Out: <span className="font-medium">{today.lastClockOut ? new Date(today.lastClockOut).toLocaleTimeString() : '-'}</span></div>
          </>
        )}
        {error && <div className="text-red-500 mt-1">{error}</div>}
      </div>
    </div>
  );
}
