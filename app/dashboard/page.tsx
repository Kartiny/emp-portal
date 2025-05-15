// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/main-layout";
import AttendanceWidget from '@/components/attendance-widget';

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

        {/* Profile Overview */}
        {profile && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Welcome, {profile.name}</CardTitle>
              <p className="text-sm text-gray-500">{profile.job_title} {profile.department_id ? `- ${Array.isArray(profile.department_id) ? profile.department_id[1] : profile.department_id}` : ''}</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div>
                  <div><strong>Email:</strong> {profile.work_email || profile.login}</div>
                  <div><strong>Phone:</strong> {profile.work_phone || profile.mobile_phone || '-'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leave Allocations Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {leaveAllocations.map((alloc: any) => (
            <Card key={alloc.id}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{alloc.holiday_status_id?.[1] || 'Leave'}</CardTitle>
                <p className="text-xs text-gray-500">{alloc.state ? `Status: ${alloc.state}` : ''}</p>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{alloc.number_of_days_display ?? alloc.max_leaves ?? 0} days</div>
                <p className="text-xs text-gray-500">Used {alloc.leaves_taken ?? 0} days</p>
                {alloc.date_from && alloc.date_to && (
                  <p className="text-xs text-gray-400">{alloc.date_from} to {alloc.date_to}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Today's Attendance and Leave Balance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <AttendanceWidget />
        </div>
      </div>
    </MainLayout>
  );
}
