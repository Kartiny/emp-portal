// app/manager/dashboard/page.tsx
'use client';

import { MainLayout } from '@/components/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, UserCheck, UserX, Clock, FileText, ClipboardList, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ProfileChangeRequests } from '@/components/profile-change-requests';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function ManagerDashboardPage() {
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
    fetch('/api/odoo/manager/dashboard', {
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
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading dashboard...</p>
          </div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-6">
              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center gap-2 p-3 lg:p-4">
                  <UserCheck className="w-5 h-5 lg:w-6 lg:h-6 text-green-400" />
                  <CardTitle className="text-xs lg:text-base">On Leave</CardTitle>
                </CardHeader>
                <CardContent className="p-3 lg:p-4">
                  <div className="text-lg lg:text-2xl font-bold text-center">{data?.onLeaveCount ?? '--'}</div>
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center gap-2 p-3 lg:p-4">
                  <UserX className="w-4 h-4 lg:w-5 lg:h-5 text-red-400" />
                  <CardTitle className="text-xs lg:text-base">Absence</CardTitle>
                </CardHeader>
                <CardContent className="p-3 lg:p-4">
                  <div className="text-lg lg:text-2xl font-bold text-center">{data?.absenceCount ?? '--'}</div>
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center gap-2 p-3 lg:p-4">
                  <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400" />
                  <CardTitle className="text-xs lg:text-base">OT Req</CardTitle>
                </CardHeader>
                <CardContent className="p-3 lg:p-4">
                  <div className="text-lg lg:text-2xl font-bold text-center">{data?.otRequestsCount ?? '--'}</div>
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center gap-2 p-3 lg:p-4">
                  <ClipboardList className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-400" />
                  <CardTitle className="text-xs lg:text-base">Leave Req</CardTitle>
                </CardHeader>
                <CardContent className="p-3 lg:p-4">
                  <div className="text-lg lg:text-2xl font-bold text-center">{data?.leaveRequestsCount ?? '--'}</div>
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center gap-2 p-3 lg:p-4">
                  <FileText className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400" />
                  <CardTitle className="text-xs lg:text-base">Claim Req</CardTitle>
                </CardHeader>
                <CardContent className="p-3 lg:p-4">
                  <div className="text-lg lg:text-2xl font-bold text-center">{data?.claimRequestsCount ?? '--'}</div>
                </CardContent>
              </Card>
              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center gap-2 p-3 lg:p-4">
                  <Users className="w-4 h-4 lg:w-5 lg:h-5 text-orange-400" />
                  <CardTitle className="text-xs lg:text-base">Profile Req</CardTitle>
                </CardHeader>
                <CardContent className="p-3 lg:p-4">
                  <div className="text-lg lg:text-2xl font-bold text-center">{data?.profileRequestsCount ?? '--'}</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Employee Distribution Chart */}
              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center gap-2 p-4">
                  <BarChart2 className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-600" />
                  <CardTitle className="text-sm lg:text-lg">Employee Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-64 lg:h-96 flex items-center justify-center text-muted-foreground">
                    {data?.barChart && data.barChart.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.barChart} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            type="category" 
                            dataKey="jobTitle" 
                            label={{ value: 'Job Title', position: 'insideBottom', offset: -5 }}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            type="number" 
                            dataKey="count" 
                            label={{ value: 'No of Emp', angle: -90, position: 'insideLeft' }} 
                            allowDecimals={false}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip />
                          <Bar dataKey="count" fill="#6366f1" barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-sm lg:text-base">No data for bar chart.</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Profile Change Requests */}
              <Card className="shadow-md">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm lg:text-lg">Profile Change Requests</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ProfileChangeRequests />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
} 