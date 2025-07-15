'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/main-layout";
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Clock, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  UserCheck,
  UserX,
  FileText,
  Settings,
  BarChart3,
  Activity,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { toast } from 'sonner';

interface HRStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaveRequests: number;
  pendingExpenseRequests: number;
  newHires: number;
  terminations: number;
  attendanceRate: number;
}

interface LeaveRequest {
  id: number;
  employee_name: string;
  leave_type: string;
  date_from: string;
  date_to: string;
  number_of_days: number;
  state: string;
  create_date: string;
}

interface ExpenseRequest {
  id: number;
  employee_name: string;
  name: string;
  total_amount: number;
  state: string;
  create_date: string;
}

export default function HRDashboard() {
  const [stats, setStats] = useState<HRStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaveRequests: 0,
    pendingExpenseRequests: 0,
    newHires: 0,
    terminations: 0,
    attendanceRate: 0
  });
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [expenseRequests, setExpenseRequests] = useState<ExpenseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const uid = localStorage.getItem('uid');
    const primaryRole = localStorage.getItem('primaryRole');
    
    if (!uid) {
      window.location.href = '/login';
      return;
    }

    // Check if user has HR role
    if (primaryRole !== 'hr' && primaryRole !== 'admin') {
      toast.error('Access denied. HR privileges required.');
      window.location.href = '/login';
      return;
    }

    const isVerified = localStorage.getItem('isVerified');
    if (isVerified !== 'true') {
      window.location.href = '/verify';
    }

    fetchHRData(Number(uid));
  }, []);

  const fetchHRData = async (uid: number) => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const profileRes = await fetch('/api/odoo/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.user);
      }

      // Fetch HR statistics
      const statsRes = await fetch('/api/hr/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch pending leave requests
      const leaveRes = await fetch('/api/hr/leave/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });

      if (leaveRes.ok) {
        const leaveData = await leaveRes.json();
        setLeaveRequests(leaveData.requests || []);
      }

      // Fetch pending expense requests
      const expenseRes = await fetch('/api/hr/expense/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });

      if (expenseRes.ok) {
        const expenseData = await expenseRes.json();
        setExpenseRequests(expenseData.requests || []);
      }

    } catch (error) {
      console.error('Error fetching HR data:', error);
      toast.error('Failed to load HR dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirm':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'validate':
        return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>;
      case 'refuse':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'submit':
        return <Badge className="bg-orange-100 text-orange-800">Submitted</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const handleApproveRequest = async (type: string, id: number) => {
    try {
      const response = await fetch(`/api/hr/${type}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uid: localStorage.getItem('uid'),
          requestId: id 
        }),
      });

      if (response.ok) {
        toast.success(`${type} request approved successfully`);
        fetchHRData(Number(localStorage.getItem('uid')));
      } else {
        toast.error('Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };

  const handleRejectRequest = async (type: string, id: number) => {
    try {
      const response = await fetch(`/api/hr/${type}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uid: localStorage.getItem('uid'),
          requestId: id 
        }),
      });

      if (response.ok) {
        toast.success(`${type} request rejected`);
        fetchHRData(Number(localStorage.getItem('uid')));
      } else {
        toast.error('Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading HR dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {profile?.name || 'HR Manager'}! Manage your workforce effectively.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeEmployees} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                Today's attendance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Leave</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingLeaveRequests}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingExpenseRequests}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Leave Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Pending Leave Requests
              </CardTitle>
              <CardDescription>
                Leave requests awaiting approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaveRequests.length > 0 ? (
                  leaveRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{request.employee_name}</h4>
                          <p className="text-sm text-gray-500">{request.leave_type}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(request.date_from), 'MMM dd')} - {format(new Date(request.date_to), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        {getStatusBadge(request.state)}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApproveRequest('leave', request.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRejectRequest('leave', request.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No pending leave requests</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Expense Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Pending Expense Requests
              </CardTitle>
              <CardDescription>
                Expense requests awaiting approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenseRequests.length > 0 ? (
                  expenseRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{request.employee_name}</h4>
                          <p className="text-sm text-gray-500">{request.name}</p>
                          <p className="text-sm font-medium text-green-600">
                            ${request.total_amount}
                          </p>
                        </div>
                        {getStatusBadge(request.state)}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApproveRequest('expense', request.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRejectRequest('expense', request.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No pending expense requests</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>HR Quick Actions</CardTitle>
            <CardDescription>
              Common HR management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col">
                <UserPlus className="h-6 w-6 mb-2" />
                <span className="text-sm">Add Employee</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <Calendar className="h-6 w-6 mb-2" />
                <span className="text-sm">Leave Management</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <DollarSign className="h-6 w-6 mb-2" />
                <span className="text-sm">Expense Approval</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <BarChart3 className="h-6 w-6 mb-2" />
                <span className="text-sm">HR Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 