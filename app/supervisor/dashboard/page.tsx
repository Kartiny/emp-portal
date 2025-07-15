// app/supervisor/dashboard/page.tsx
'use client';

import { MainLayout } from '@/components/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, UserCheck, UserX, Clock, FileText, ClipboardList } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function SupervisorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const uid = localStorage.getItem('uid');
    if (!uid) {
      setError('Not logged in');
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch('/api/odoo/supervisor/dashboard', {
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
  }, []);

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-screen py-8">
        {loading ? (
          <div className="text-lg text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 w-full max-w-6xl mb-12">
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
            </div>
            <Card className="w-full max-w-4xl shadow-md">
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
          </>
        )}
      </div>
    </MainLayout>
  );
} 