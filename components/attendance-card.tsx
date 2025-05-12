'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Summary { 
  totalHours: number; 
  rate: number; 
  records?: Array<{
    id: number;
    checkIn: string;
    checkOut: string | null;
    workedHours: number;
  }>;
}

export default function AttendanceCard() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const rawUid = localStorage.getItem('uid');
    if (!rawUid) {
      setError('Not logged in');
      setLoading(false);
      return;
    }
    const uid = Number(rawUid);

    fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    })
      .then(async (r) => {
        const response = await r.json();
        if (!r.ok) throw new Error(response.error || 'Failed to load attendance data');
        return response;
      })
      .then((response: Summary) => {
        setData(response);
      })
      .catch((err) => {
        console.error('Error fetching attendance:', err);
        setError(err.message || 'Failed to load attendance data');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Card><CardContent>Loading attendance…</CardContent></Card>;
  }

  if (error) {
    return <Card><CardContent className="text-red-500">{error}</CardContent></Card>;
  }

  if (!data) {
    return <Card><CardContent>No attendance data available</CardContent></Card>;
  }

  // Ensure we have valid numbers before calling toFixed
  const hours = typeof data.totalHours === 'number' ? data.totalHours.toFixed(1) : '0.0';
  const rate = typeof data.rate === 'number' ? data.rate.toFixed(1) : '0.0';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Hours</CardTitle>
        <CardDescription>This month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{hours}h</div>
        <p className="text-xs text-muted-foreground">
          {rate}% rate
        </p>
      </CardContent>
    </Card>
  );
} 