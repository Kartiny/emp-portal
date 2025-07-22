// app/hr/dashboard/page.tsx
'use client';

import { MainLayout } from '@/components/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useEffect, useState } from 'react';
import { BarChart2, UserCheck, UserX, Clock, FileText, ClipboardList } from 'lucide-react';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function HrDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/odoo/hr/dashboard')
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
                  <UserCheck className="w-5 h-5 text-green-400" />
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
                        <XAxis type="category" dataKey="department" label={{ value: 'Department', position: 'insideBottom', offset: -5 }} />
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
            <Card className="w-full max-w-4xl shadow-md mt-8">
              <CardHeader>
                <CardTitle className="text-lg">New Joinees This Month</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.newJoinees?.length ? (
                  <ul className="divide-y">
                    {data.newJoinees.map((emp: any) => (
                      <li key={emp.id} className="py-2 flex flex-col md:flex-row md:items-center md:gap-4">
                        <span className="font-medium">{emp.name}</span>
                        <span className="text-sm text-muted-foreground">{emp.job_title}</span>
                        <span className="text-sm text-muted-foreground">{emp.department_id?.[1]}</span>
                        <span className="text-sm text-muted-foreground">Joined: {emp.join_date}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-muted-foreground">No new joinees this month.</div>
                )}
              </CardContent>
            </Card>
            <Card className="w-full max-w-4xl shadow-md mt-8">
              <CardHeader>
                <CardTitle className="text-lg">Recent Exits This Month</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.recentExits?.length ? (
                  <ul className="divide-y">
                    {data.recentExits.map((emp: any) => (
                      <li key={emp.id} className="py-2 flex flex-col md:flex-row md:items-center md:gap-4">
                        <span className="font-medium">{emp.name}</span>
                        <span className="text-sm text-muted-foreground">{emp.job_title}</span>
                        <span className="text-sm text-muted-foreground">{emp.department_id?.[1]}</span>
                        <span className="text-sm text-muted-foreground">Left: {emp.cessation_date}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-muted-foreground">No recent exits this month.</div>
                )}
              </CardContent>
            </Card>
            <Card className="w-full max-w-4xl shadow-md mt-8">
              <CardHeader>
                <CardTitle className="text-lg">Contract Expiry Alerts (Next 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.contractExpiryAlerts?.length ? (
                  <ul className="divide-y">
                    {data.contractExpiryAlerts.map((c: any) => (
                      <li key={c.id} className="py-2 flex flex-col md:flex-row md:items-center md:gap-4">
                        <span className="font-medium">{c.employee_id?.[1]}</span>
                        <span className="text-sm text-muted-foreground">Contract End: {c.date_end}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-muted-foreground">No contracts expiring in the next 30 days.</div>
                )}
              </CardContent>
            </Card>
            <Card className="w-full max-w-4xl shadow-md mt-8">
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <a href="/hr/employees" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Employee</a>
                  <a href="/hr/reports" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">HR Reports</a>
                  {/* Add more links as needed */}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
} 