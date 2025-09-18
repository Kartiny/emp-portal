'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/main-layout";
import AttendanceWidget from '@/components/attendance-widget';
import StatusWidget from '@/components/status-widget';
import { LeaveBalanceCard } from '@/components/leave-balance-card';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AttendanceReportChart } from '@/components/attendance-report-chart';
import { differenceInMinutes, parseISO, format as dfFormat } from 'date-fns';
import { LeaveRequestForm } from '@/components/leave-request-form';
import { Calendar as CalendarIcon, ReceiptText, Clock, MessageCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

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

interface TodayAttendance {
  lastClockIn: string | null;
  lastClockOut: string | null;
  records?: Array<{
    id: number;
    datetime: string;
    attn_type: string;
    job_id?: number;
    machine_id?: string;
    latitude?: number;
    longitude?: number;
  }>;
  workedHours?: number;
  latenessStr?: string;
  latenessMins?: number;
  earlyOutStr?: string;
  earlyOutMins?: number;
  gracePeriod?: any;
}

interface ShiftInfo {
  schedule_name: string | null;
  start: string | null;
  end: string | null;
  desc: string | null;
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
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [claims, setClaims] = useState<any[]>([]);
  const [claimForm, setClaimForm] = useState({
    name: '',
    date: '',
    payment_mode: '',
    total_amount: '',
  });
  const [claimFormLoading, setClaimFormLoading] = useState(false);
  const [missedClockOut, setMissedClockOut] = useState(false);
  const router = useRouter();
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [pendingDialogOpen, setPendingDialogOpen] = useState(false);
  const [leaveBalanceDialogOpen, setLeaveBalanceDialogOpen] = useState(false);
  const [overtimeDialogOpen, setOvertimeDialogOpen] = useState(false);
  const [attendanceDialogData, setAttendanceDialogData] = useState<{ totalHours: number; rate: number } | null>(null);
  const [pendingRequestsData, setPendingRequestsData] = useState<any[]>([]);
  const [leaveBalanceData, setLeaveBalanceData] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [leaveBalanceLoading, setLeaveBalanceLoading] = useState(false);
  const [attendanceDialogLoading, setAttendanceDialogLoading] = useState(false);
  const [monthlyAttendanceData, setMonthlyAttendanceData] = useState<{ name: string; present: number; late: number; absent: number }[]>([]);
  const [monthlyAttendanceLoading, setMonthlyAttendanceLoading] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [otDialogOpen, setOtDialogOpen] = useState(false);
  const [discussionDialogOpen, setDiscussionDialogOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    name: '',
    date: '',
    payment_mode: '',
    total_amount: '',
  });
  const [expenseFormLoading, setExpenseFormLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [shiftInfo, setShiftInfo] = useState<ShiftInfo | null>(null);

  const fetchAttendanceData = () => {
    const uid = localStorage.getItem('uid');
    if (!uid) return;
    const uidNum = Number(uid);
    if (isNaN(uidNum) || uidNum <= 0) return;

    fetch('/api/odoo/auth/attendance/today', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: uidNum }),
    })
      .then(res => res.json())
      .then(data => {
        setTodayAttendance(data);
      })
      .catch(console.error);

    fetch('/api/odoo/auth/attendance/shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: uidNum }),
      })
      .then(res => res.json())
      .then(data => {
        setShiftInfo(data);
      })
      .catch(console.error);
  }

  useEffect(() => {
    const uid = localStorage.getItem('uid');
    if (!uid) {
      window.location.href = '/login';
      return;
    }

    const uidNum = Number(uid);
    if (isNaN(uidNum) || uidNum <= 0) {
      window.location.href = '/login';
      return;
    }

    fetch('/api/odoo/auth/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: uidNum }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setProfile(data.user);
        }
      })
      .catch(console.error);

    fetch('/api/odoo/leave/allocation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: uidNum }),
    })
      .then(res => res.json())
      .then(data => {
        setLeaveAllocations(data.allocations || []);
      })
      .catch(console.error);

    const now = new Date();
    fetch('/api/odoo/auth/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: uidNum, range: 'monthly', customDate: format(now, 'yyyy-MM-dd') }),
    })
      .then(res => res.json())
      .then(data => {
        setTotalHours(data.totalHours || 0);
        setAttendanceRate(data.rate || 0);
      })
      .catch(console.error);

    fetch('/api/odoo/leave/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: uidNum, filters: { status: 'confirm' } }),
    })
      .then(res => res.json())
      .then(data => {
        setPendingRequests(Array.isArray(data) ? data.length : 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    fetch(`/api/odoo/expense?uid=${uidNum}`)
      .then(res => res.json())
      .then(data => {
        setClaims(data.claims || []);
        setClaimRequests(Array.isArray(data.claims) ? data.claims.length : 0);
      })
      .catch(console.error);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yDate = yesterday.toISOString().slice(0, 10);

    fetch('/api/odoo/auth/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: uidNum, range: 'day', customDate: yDate }),
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.attendance)) {
          const missed = data.attendance.some(
            (rec: any) => rec.check_in && !rec.check_out
          );
          setMissedClockOut(missed);
          if (missed) {
            toast.warning('You forgot to clock out yesterday. Please contact HR or your manager.');
          }
        }
      })
      .catch(console.error);

    const fetchYearAttendance = async () => {
      setMonthlyAttendanceLoading(true);
      try {
        const now = new Date();
        const year = now.getFullYear();
        const start = `${year}-01-01`;
        const end = `${year}-12-31`;
        const res = await fetch('/api/odoo/auth/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: uidNum,
            range: 'custom',
            customRange: { from: start, to: end },
          }),
        });
        const data = await res.json();
        const records = Array.isArray(data.records) ? data.records : [];
        const months = Array.from({ length: 12 }, (_, i) => ({ present: 0, late: 0, absent: 0 }));
        const getMonthIdx = (dateStr: string) => {
          try { return new Date(dateStr).getMonth(); } catch { return null; }
        };
        const WORK_START_HOUR = 9;
        const allDays = new Set<string>();
        const today = new Date();
        for (let m = 0; m < 12; m++) {
          const daysInMonth = new Date(year, m + 1, 0).getDate();
          for (let d = 1; d <= daysInMonth; d++) {
            const dt = new Date(year, m, d);
            if (dt.getDay() !== 0 && dt.getDay() !== 6 && dt <= today) {
              allDays.add(dfFormat(dt, 'yyyy-MM-dd'));
            }
          }
        }
        const daysWithRecord = new Set<string>();
        records.forEach((rec: any) => {
          if (!rec.checkIn || typeof rec.checkIn !== 'string') return;
          const dt = rec.checkIn.slice(0, 10);
          daysWithRecord.add(dt);
          const mIdx = getMonthIdx(rec.checkIn);
          if (mIdx === null) return;
          if (rec.checkIn && rec.checkOut) {
            const checkInDate = parseISO(rec.checkIn);
            const ref = new Date(checkInDate); ref.setHours(WORK_START_HOUR, 0, 0, 0);
            const mins = differenceInMinutes(checkInDate, ref);
            if (mins > 0) {
              months[mIdx].late++;
            } else {
              months[mIdx].present++;
            }
          }
        });
        allDays.forEach(dt => {
          if (!daysWithRecord.has(dt)) {
            const mIdx = getMonthIdx(dt + 'T00:00:00');
            if (mIdx !== null) months[mIdx].absent++;
          }
        });
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const chartData = months.map((m, i) => ({ name: monthNames[i], ...m }));
        setMonthlyAttendanceData(chartData);
      } finally {
        setMonthlyAttendanceLoading(false);
      }
    };
    fetchYearAttendance();
    fetchAttendanceData();
  }, []);

  useEffect(() => {
    const employeeId = localStorage.getItem('employeeId');
    const isVerified = localStorage.getItem('isVerified') === 'true';
    if (!employeeId) {
      window.location.href = '/login';
    } else if (!isVerified) {
      window.location.href = '/verify';
    }
  }, []);

  const refreshClaims = async () => {
    const employeeId = localStorage.getItem('employeeId');
    if (!employeeId) return;
    const res = await fetch(`/api/odoo/expense?employeeId=${employeeId}`);
    const data = await res.json();
    setClaims(data.claims || []);
    setClaimRequests(Array.isArray(data.claims) ? data.claims.length : 0);
  };

  const handleClaimFormChange = (field: string, value: string) => {
    setClaimForm(f => ({ ...f, [field]: value }));
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimFormLoading(true);
    const employeeId = localStorage.getItem('employeeId');
    if (!employeeId) return;
    const payload = {
      employeeId: Number(employeeId),
      data: {
        name: claimForm.name,
        date: claimForm.date,
        payment_mode: claimForm.payment_mode,
        total_amount: parseFloat(claimForm.total_amount),
      },
    };
    const res = await fetch('/api/odoo/expense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setClaimFormLoading(false);
    if (res.ok) {
      setClaimForm({ name: '', date: '', payment_mode: '', total_amount: '' });
      await refreshClaims();
    }
  };

  const paymentModeLabel = (mode: string) => {
    if (mode === 'own_account') return 'Employee';
    if (mode === 'company_account') return 'Company';
    return mode;
  };
  const stateLabel = (state: string) => {
    if (state === 'draft') return 'To Approve';
    if (!state) return '';
    return state.charAt(0).toUpperCase() + state.slice(1);
  };
  const nameLabel = (name: string) => name;

  const fetchAttendanceDialogData = async () => {
    setAttendanceDialogLoading(true);
    try {
      const employeeId = localStorage.getItem('employeeId');
      if (!employeeId) return;
      const now = new Date();
      const res = await fetch('/api/odoo/auth/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: Number(employeeId), range: 'monthly', customDate: format(now, 'yyyy-MM-dd') }),
      });
      const data = await res.json();
      setAttendanceDialogData({ totalHours: data.totalHours || 0, rate: data.rate || 0 });
    } finally {
      setAttendanceDialogLoading(false);
    }
  };

  const fetchPendingRequestsData = async () => {
    setPendingLoading(true);
    try {
      const employeeId = localStorage.getItem('employeeId');
      if (!employeeId) return;
      const res = await fetch('/api/odoo/leave/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: Number(employeeId), filters: { status: 'confirm' } }),
      });
      const data = await res.json();
      setPendingRequestsData(Array.isArray(data) ? data : []);
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchLeaveBalanceData = async () => {
    setLeaveBalanceLoading(true);
    try {
      const employeeId = localStorage.getItem('employeeId');
      if (!employeeId) return;
      const res = await fetch('/api/odoo/leave/allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: Number(employeeId) }),
      });
      const data = await res.json();
      setLeaveBalanceData(data.allocations || []);
    } finally {
      setLeaveBalanceLoading(false);
    }
  };

  const openAttendanceDialog = () => {
    fetchAttendanceDialogData();
    setAttendanceDialogOpen(true);
  };
  const openPendingDialog = () => {
    fetchPendingRequestsData();
    setPendingDialogOpen(true);
  };
  const openLeaveBalanceDialog = () => {
    fetchLeaveBalanceData();
    setLeaveBalanceDialogOpen(true);
  };

  const handleExpenseFormChange = (field: string, value: string) => {
    setExpenseForm(f => ({ ...f, [field]: value }));
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseFormLoading(true);
    const employeeId = localStorage.getItem('employeeId');
    if (!employeeId) return;
    const payload = {
      employeeId: Number(employeeId),
      data: {
        name: expenseForm.name,
        date: expenseForm.date,
        payment_mode: expenseForm.payment_mode,
        total_amount: parseFloat(expenseForm.total_amount),
      },
    };
    const res = await fetch('/api/odoo/expense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setExpenseFormLoading(false);
    if (res.ok) {
      setExpenseForm({ name: '', date: '', payment_mode: '', total_amount: '' });
      setExpenseDialogOpen(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <MainLayout missedClockOut={missedClockOut}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Employee Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {profile?.name || 'Employee'}</p>
          </div>
          <div className="text-sm text-gray-500">
            {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </div>
        </div>

        {/* Attendance and Status Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AttendanceWidget today={todayAttendance} shift={shiftInfo} onUpdate={fetchAttendanceData} />
          <StatusWidget today={todayAttendance} shift={shiftInfo} />
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setAttendanceDialogOpen(true)}>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              <CardTitle className="text-sm sm:text-base">Total Hours</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}h</div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setPendingDialogOpen(true)}>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <CardTitle className="text-sm sm:text-base">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{pendingRequests}</div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLeaveBalanceDialogOpen(true)}>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <ReceiptText className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              <CardTitle className="text-sm sm:text-base">Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{attendanceRate.toFixed(1)}%</div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setOvertimeDialogOpen(true)}>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
              <CardTitle className="text-sm sm:text-base">Overtime Requests</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold text-purple-600">{overtimeRequests}</div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Pending approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => setLeaveDialogOpen(true)} 
                className="w-full justify-start"
                variant="outline"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Request Leave
              </Button>
              <Button 
                onClick={() => setExpenseDialogOpen(true)} 
                className="w-full justify-start"
                variant="outline"
              >
                <ReceiptText className="w-4 h-4 mr-2" />
                Submit Expense
              </Button>
              <Button 
                onClick={() => setOtDialogOpen(true)} 
                className="w-full justify-start"
                variant="outline"
              >
                <Clock className="w-4 h-4 mr-2" />
                Request Overtime
              </Button>
              <Button 
                onClick={() => setDiscussionDialogOpen(true)} 
                className="w-full justify-start"
                variant="outline"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Start Discussion
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Leave Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <LeaveBalanceCard leaveAllocations={leaveAllocations} />
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Monthly Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80">
                <AttendanceReportChart data={monthlyAttendanceData} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Recent Claims</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {claims.slice(0, 5).map((claim, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{claim.name}</p>
                      <p className="text-xs text-gray-500">{claim.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">${claim.total_amount}</p>
                      <p className="text-xs text-gray-500">{claim.payment_mode}</p>
                    </div>
                  </div>
                ))}
                {claims.length === 0 && (
                  <p className="text-center text-gray-500 text-sm py-4">No recent claims</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Claim Requests</DialogTitle>
          </DialogHeader>
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Your Claims</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-1 border">Name</th>
                    <th className="px-2 py-1 border">Date</th>
                    <th className="px-2 py-1 border">Payment Mode</th>
                    <th className="px-2 py-1 border">Total Amount</th>
                    <th className="px-2 py-1 border">State</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((c, i) => (
                    <tr key={c.id || i}>
                      <td className="px-2 py-1 border">{nameLabel(c.name)}</td>
                      <td className="px-2 py-1 border">{c.date ? format(new Date(c.date), 'dd-MM-yyyy') : '-'}</td>
                      <td className="px-2 py-1 border">{paymentModeLabel(c.payment_mode)}</td>
                      <td className="px-2 py-1 border">{c.total_amount}</td>
                      <td className="px-2 py-1 border">{stateLabel(c.state)}</td>
                    </tr>
                  ))}
                  {claims.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-2">No claims found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Attendance Rate Dialog */}
      <Dialog open={attendanceDialogOpen} onOpenChange={setAttendanceDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
          {/* End of Selection */}
            <DialogTitle>Attendance Rate (This Month)</DialogTitle>
          </DialogHeader>
          {attendanceDialogLoading ? (
            <div className="py-4 text-center">Loading...</div>
          ) : attendanceDialogData ? (
            <div className="py-2">
              <div className="text-2xl font-bold mb-2">{Math.round(attendanceDialogData.rate)}%</div>
              <div>Total Hours: {attendanceDialogData.totalHours.toFixed(1)}h</div>
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500">No data</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Overtime Requests Dialog */}
      <Dialog open={overtimeDialogOpen} onOpenChange={setOvertimeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Overtime Requests</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center text-gray-500">Coming soon</div>
        </DialogContent>
      </Dialog>

      {/* Pending Requests Dialog */}
      <Dialog open={pendingDialogOpen} onOpenChange={setPendingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pending Leave Requests</DialogTitle>
          </DialogHeader>
          {pendingLoading ? (
            <div className="py-4 text-center">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequestsData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No pending requests found</TableCell>
                    </TableRow>
                  ) : (
                    pendingRequestsData.map((req, idx) => (
                      <TableRow key={req.id || idx}>
                        <TableCell>{req.holiday_status_id?.[1] || '-'}</TableCell>
                        <TableCell>{req.request_date_from ? `${req.request_date_from} - ${req.request_date_to || '-'}` : '-'}</TableCell>
                        <TableCell>{req.number_of_days_display ?? req.number_of_days ?? '-'}</TableCell>
                        <TableCell>{req.name || '-'}</TableCell>
                        <TableCell>Pending</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Leave Balance Dialog */}
      <Dialog open={leaveBalanceDialogOpen} onOpenChange={setLeaveBalanceDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Leave Balance Details</DialogTitle>
          </DialogHeader>
          {leaveBalanceLoading ? (
            <div className="py-4 text-center">Loading...</div>
          ) : leaveBalanceData.length === 0 ? (
            <div className="text-center text-gray-500">No leave allocations found.</div>
          ) : (
            <div className="space-y-4">
              {leaveBalanceData.map((alloc: any) => (
                <LeaveBalanceCard
                  key={alloc.id}
                  type={alloc.holiday_status_id?.[1] || 'Leave'}
                  used={alloc.leaves_taken ?? 0}
                  total={alloc.number_of_days_display ?? alloc.number_of_days ?? 0}
                  color="bg-blue-600"
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogs for actions */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>
          <LeaveRequestForm onClose={() => setLeaveDialogOpen(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <Input value={expenseForm.name} onChange={e => handleExpenseFormChange('name', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium">Date</label>
                <Input type="date" value={expenseForm.date} onChange={e => handleExpenseFormChange('date', e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Payment Mode</label>
                <Select value={expenseForm.payment_mode} onValueChange={v => handleExpenseFormChange('payment_mode', v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company_account">Company Account</SelectItem>
                    <SelectItem value="own_account">Own Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium">Total Amount (RM)</label>
                <Input type="number" step="0.01" value={expenseForm.total_amount} onChange={e => handleExpenseFormChange('total_amount', e.target.value)} required />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={expenseFormLoading}>{expenseFormLoading ? 'Submitting...' : 'Submit Claim'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={otDialogOpen} onOpenChange={setOtDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>OT Request</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center text-gray-500">Coming soon</div>
        </DialogContent>
      </Dialog>
      <Dialog open={discussionDialogOpen} onOpenChange={setDiscussionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Discussion</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center text-gray-500">Coming soon</div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}