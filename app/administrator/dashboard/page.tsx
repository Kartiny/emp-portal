 // app/administrator/dashboard/page.tsx
'use client';

import { MainLayout } from '@/components/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, UserCheck, UserX, Clock, FileText, ClipboardList, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import PendingRequestsWidget from '@/components/pending-requests-widget';

export default function AdministratorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    const uid = localStorage.getItem('uid');
    if (!uid) {
      setError('Not logged in');
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch('/api/odoo/administrator/dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: Number(uid) }),
    })
      .then(res => res.json())
      .then(res => {
        if (res.error) setError(res.error);
        else setData(res);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    // Fetch pending profile change requests count
    fetchPendingRequestsCount(uid);
  }, []);

  const fetchPendingRequestsCount = async (uid: string) => {
    try {
      const response = await fetch('/api/odoo/profile/pending-requests', {
        headers: {
          'uid': uid,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingRequestsCount(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching pending requests count:', error);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Administrator Dashboard</h1>
          <p className="text-gray-600">Overview of system activities and pending approvals</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading dashboard...</p>
          </div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center gap-2">
                  <UserCheck className="w-6 h-6 text-green-400" />
                  <CardTitle className="text-base">On Leave</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-center">{data?.onLeaveCount ?? '--'}</div>
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center gap-2">
                  <UserX className="w-5 h-5 text-red-400" />
                  <CardTitle className="text-base">Absence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-center">{data?.absenceCount ?? '--'}</div>
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <CardTitle className="text-base">OT Req</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-center">{data?.otRequestsCount ?? '--'}</div>
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-yellow-400" />
                  <CardTitle className="text-base">Leave Req</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-center">{data?.leaveRequestsCount ?? '--'}</div>
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <CardTitle className="text-base">Claim Req</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-center">{data?.claimRequestsCount ?? '--'}</div>
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center gap-2">
                  <Users className="w-5 h-5 text-orange-400" />
                  <CardTitle className="text-base">Profile Req</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-center">{pendingRequestsCount}</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Employee Distribution Chart */}
              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-600" />
                  <CardTitle className="text-lg">Employee Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 flex items-center justify-center text-muted-foreground">
                    {data?.barChart && data.barChart.length > 0 ? (
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={data.barChart} margin={{ left: 40, right: 20, top: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="category" dataKey="jobTitle" label={{ value: 'Job Title', position: 'insideBottom', offset: -5 }} />
                          <YAxis type="number" dataKey="count" label={{ value: 'No of Emp', angle: -90, position: 'insideLeft' }} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#6366f1" barSize={32} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <span>No data for bar chart.</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pending Profile Change Requests */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Pending Profile Change Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PendingRequestsWidget />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
} 