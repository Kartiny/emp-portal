// components/AttendanceWidget.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: number;
  employee_id: [number, string];
  check_in: string;
  check_out: string | false;
}

export default function AttendanceWidget() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayData, setTodayData] = useState<any>(null);

  const fetchTodayAttendance = async () => {
    try {
      const uid = localStorage.getItem('uid');
      if (!uid) {
        setError('Not logged in');
        return;
      }

      const res = await fetch('/api/attendance/today', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uid) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch attendance');
      }

      const data = await res.json();
      setTodayData(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching attendance:', err);
      setError(err.message || 'Failed to fetch attendance');
    }
  };

  const handleClockIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const uid = localStorage.getItem('uid');
      if (!uid) {
        setError('Not logged in');
        return;
      }

      const res = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uid) }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to clock in');
      }

      await fetchTodayAttendance();
    } catch (err: any) {
      console.error('Clock in error:', err);
      setError(err.message || 'Failed to clock in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setLoading(true);
      setError(null);
      const uid = localStorage.getItem('uid');
      if (!uid) {
        setError('Not logged in');
        return;
      }

      const res = await fetch('/api/attendance/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uid) }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to clock out');
      }

      await fetchTodayAttendance();
    } catch (err: any) {
      console.error('Clock out error:', err);
      setError(err.message || 'Failed to clock out');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
    // Refresh attendance every minute
    const interval = setInterval(fetchTodayAttendance, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="w-full max-w-xl mx-auto p-6 shadow-lg rounded-2xl">
      <CardContent className="space-y-4">
        <h2 className="text-xl font-semibold">Today's Attendance</h2>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Last Clock In</p>
            <p className="text-lg">{todayData?.lastClockIn || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Last Clock Out</p>
            <p className="text-lg">{todayData?.lastClockOut || '-'}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Hours Today</p>
            <p className="text-lg">{todayData?.todayHours || '-'}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button 
            onClick={handleClockIn} 
            disabled={loading || todayData?.isCheckedIn}
            className="flex-1"
          >
            {loading ? 'Processing...' : 'Clock In'}
          </Button>
          <Button 
            onClick={handleClockOut} 
            disabled={loading || !todayData?.isCheckedIn}
            className="flex-1"
          >
            {loading ? 'Processing...' : 'Clock Out'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
