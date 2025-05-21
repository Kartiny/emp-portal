// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/main-layout";
import AttendanceWidget from '@/components/attendance-widget';
import { LeaveBalanceCard } from '@/components/leave-balance-card';
import { format } from 'date-fns';
import { ShiftCodes } from '@/components/ui/shift-codes';

interface UserProfile {
  name: string;
  email: string;
  image_1920: string | null;
  job_title: string;
  department: string;
  phone: string;
}

interface LeaveBalance {
  days: number;
  used: number;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [leaveAllocations, setLeaveAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState<number>(0);
  const [attendanceRate, setAttendanceRate] = useState<number>(0);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [overtimeRequests, setOvertimeRequests] = useState<number>(0);
  const [claimRequests, setClaimRequests] = useState<number>(0);

  useEffect(() => {
    const uid = localStorage.getItem('uid');
    if (!uid) {
      window.location.href = '/login';
      return;
    }

    // Fetch user profile
    fetch('/api/odoo/auth/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: Number(uid) }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setProfile(data.user);
        }
      })
      .catch(console.error);

    // Fetch leave allocations
    fetch('/api/odoo/leave/allocation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: Number(uid) }),
    })
      .then(res => res.json())
      .then(data => {
        setLeaveAllocations(data.allocations || []);
      })
      .catch(console.error);

    // Fetch attendance summary (total hours, attendance rate)
    const now = new Date();
    fetch('/api/odoo/auth/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: Number(uid), range: 'monthly', customDate: format(now, 'yyyy-MM-dd') }),
    })
      .then(res => res.json())
      .then(data => {
        setTotalHours(data.totalHours || 0);
        setAttendanceRate(data.rate || 0);
      })
      .catch(console.error);

    // Fetch pending leave requests
    fetch('/api/odoo/leave/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: Number(uid), filters: { status: 'confirm' } }),
    })
      .then(res => res.json())
      .then(data => {
        setPendingRequests(Array.isArray(data) ? data.length : 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1d1a4e]">Dashboard</h1>
          <p className="text-gray-500 mt-2">Overview of your attendance and leave management</p>
        </div>

        {/* Top Row: Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Hours</CardTitle>
              <p className="text-sm text-muted-foreground">This month</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.round(totalHours)}h</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendance Rate</CardTitle>
              <p className="text-sm text-muted-foreground">This month</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.round(attendanceRate)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Requests</CardTitle>
              <p className="text-sm text-muted-foreground">Leave applications</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingRequests}</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition" onClick={() => {}}>
            <CardHeader>
              <CardTitle className="text-lg">Overtime Requests</CardTitle>
              <p className="text-sm text-muted-foreground">This month</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overtimeRequests}</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition" onClick={() => {}}>
            <CardHeader>
              <CardTitle className="text-lg">Claim Requests</CardTitle>
              <p className="text-sm text-muted-foreground">This month</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{claimRequests}</div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row: Today's Attendance and Leave Balance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <AttendanceWidget />
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold">Leave Balance</CardTitle>
              <CardDescription>Track your available leave</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaveAllocations.map((alloc: any) => (
                  <LeaveBalanceCard
                    key={alloc.id}
                    type={alloc.holiday_status_id?.[1] || 'Leave'}
                    used={alloc.leaves_taken ?? 0}
                    total={alloc.number_of_days_display ?? alloc.max_leaves ?? 0}
                    color="bg-blue-600"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Third Row: Shift Codes */}
        <div className="mt-6">
          <ShiftCodes />
        </div>
      </div>
    </MainLayout>
  );
}
