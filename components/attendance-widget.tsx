'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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

  // Decide which button to show
  const renderButtons = () => {
    if (!today) {
      return (
        <div className="flex gap-2">
          <Button disabled>Clock In</Button>
          <Button disabled>Clock Out</Button>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex gap-2">
          <Button disabled>Clock In</Button>
          <Button disabled>Clock Out</Button>
        </div>
      );
    }
    const { lastClockIn, lastClockOut } = today;
    const canClockIn = !lastClockIn || (lastClockIn && lastClockOut);
    const canClockOut = lastClockIn && !lastClockOut;
    return (
      <div className="flex gap-2">
        <Button onClick={handleClockIn} disabled={!canClockIn || loading}>
          Clock In
        </Button>
        <Button onClick={handleClockOut} disabled={!canClockOut || loading} variant="destructive">
          Clock Out
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-2 p-4 border rounded-lg">
      <h3 className="text-lg font-medium">Quick Clock</h3>
      {renderButtons()}
      {today && (
        <div className="text-sm text-muted-foreground pt-2">
          {today.lastClockIn && <div>In: {new Date(today.lastClockIn).toLocaleTimeString()}</div>}
          {today.lastClockOut && <div>Out: {new Date(today.lastClockOut).toLocaleTimeString()}</div>}
        </div>
      )}
    </div>
  );
}
