'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface LeaveInfo { days: number; used: number; }

export default function LeaveCard() {
  const [info, setInfo] = useState<LeaveInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = Number(localStorage.getItem('uid'));
    fetch('/api/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    })
      .then((r) => r.json())
      .then((d) => setInfo(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !info) {
    return <Card><CardContent>Loading leave…</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Balance</CardTitle>
        <CardDescription>Annual leave</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{info.days} days</div>
        <p className="text-xs text-muted-foreground">
          Used {info.used} days
        </p>
      </CardContent>
    </Card>
  );
}
