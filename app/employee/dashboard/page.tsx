// app/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/main-layout";
import AttendanceWidget from '@/components/attendance-widget';
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

    fetch(`/api/odoo/expense?uid=${uid}`)
      .then(res => res.json())
      .then(data => {
        setClaims(data.claims || []);
        setClaimRequests(Array.isArray(data.claims) ? data.claims.length : 0);
      })
      .catch(console.error);

    // Check for missed clock-out yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yDate = yesterday.toISOString().slice(0, 10);

    fetch('/api/odoo/auth/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: Number(uid), range: 'day', customDate: yDate }),
    })
      .then(res => res.json())
      .then(data => {
        // Adjust this logic based on your API response structure
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

    // Fetch all attendance records for the current year
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
            uid: Number(uid),
            range: 'custom',
            customRange: { from: start, to: end },
          }),
        });
        const data = await res.json();
        const records = Array.isArray(data.records) ? data.records : [];
        // Build a map: month index (0-11) => { present, late, absent }
        const months = Array.from({ length: 12 }, (_, i) => ({ present: 0, late: 0, absent: 0 }));
        // Helper: get month index from date string
        const getMonthIdx = (dateStr: string) => {
          try { return new Date(dateStr).getMonth(); } catch { return null; }
        };
        // Reference: 9am for late
        const WORK_START_HOUR = 9;
        // Build a set of all days in the year (for absent calculation)
        const allDays = new Set<string>();
        const today = new Date();
        for (let m = 0; m < 12; m++) {
          const daysInMonth = new Date(year, m + 1, 0).getDate();
          for (let d = 1; d <= daysInMonth; d++) {
            const dt = new Date(year, m, d);
            // Only count weekdays (Mon-Fri)
            if (dt.getDay() !== 0 && dt.getDay() !== 6 && dt <= today) {
              allDays.add(dfFormat(dt, 'yyyy-MM-dd'));
            }
          }
        }
        // Track which days have a record
        const daysWithRecord = new Set<string>();
        records.forEach((rec: any) => {
          if (!rec.checkIn || typeof rec.checkIn !== 'string') return;
          const dt = rec.checkIn.slice(0, 10);
          daysWithRecord.add(dt);
          const mIdx = getMonthIdx(rec.checkIn);
          if (mIdx === null) return;
          // Present: has check-in and check-out
          if (rec.checkIn && rec.checkOut) {
            // Late: check-in after 9am
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
        // Absent: working days with no record (only up to today)
        allDays.forEach(dt => {
          if (!daysWithRecord.has(dt)) {
            const mIdx = getMonthIdx(dt + 'T00:00:00');
            if (mIdx !== null) months[mIdx].absent++;
          }
        });
        // Build chart data
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const chartData = months.map((m, i) => ({ name: monthNames[i], ...m }));
        setMonthlyAttendanceData(chartData);
      } finally {
        setMonthlyAttendanceLoading(false);
      }
    };
    fetchYearAttendance();
  }, []);

  useEffect(() => {
    const uid = localStorage.getItem('uid');
    const isVerified = localStorage.getItem('isVerified') === 'true';
    if (!uid) {
      window.location.href = '/login';
    } else if (!isVerified) {
      window.location.href = '/verify';
    }
  }, []);

  const refreshClaims = async () => {
    const uid = localStorage.getItem('uid');
    if (!uid) return;
    const res = await fetch(`/api/odoo/expense?uid=${uid}`);
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
    const uid = localStorage.getItem('uid');
    if (!uid) return;
    const payload = {
      uid: Number(uid),
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

  // Helper for payment mode label
  const paymentModeLabel = (mode: string) => {
    if (mode === 'own_account') return 'Employee';
    if (mode === 'company_account') return 'Company';
    return mode;
  };
  // Helper for state label
  const stateLabel = (state: string) => {
    if (state === 'draft') return 'To Approve';
    if (!state) return '';
    return state.charAt(0).toUpperCase() + state.slice(1);
  };
  // Helper for name label
  const nameLabel = (name: string) => name;

  // Fetch attendance data for dialog
  const fetchAttendanceDialogData = async () => {
    setAttendanceDialogLoading(true);
    try {
      const uid = localStorage.getItem('uid');
      if (!uid) return;
      const now = new Date();
      const res = await fetch('/api/odoo/auth/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uid), range: 'monthly', customDate: format(now, 'yyyy-MM-dd') }),
      });
      const data = await res.json();
      setAttendanceDialogData({ totalHours: data.totalHours || 0, rate: data.rate || 0 });
    } finally {
      setAttendanceDialogLoading(false);
    }
  };

  // Fetch pending leave requests for dialog
  const fetchPendingRequestsData = async () => {
    setPendingLoading(true);
    try {
      const uid = localStorage.getItem('uid');
      if (!uid) return;
      const res = await fetch('/api/odoo/leave/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uid), filters: { status: 'confirm' } }),
      });
      const data = await res.json();
      setPendingRequestsData(Array.isArray(data) ? data : []);
    } finally {
      setPendingLoading(false);
    }
  };

  // Fetch leave balance for dialog
  const fetchLeaveBalanceData = async () => {
    setLeaveBalanceLoading(true);
    try {
      const uid = localStorage.getItem('uid');
      if (!uid) return;
      const res = await fetch('/api/odoo/leave/allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uid) }),
      });
      const data = await res.json();
      setLeaveBalanceData(data.allocations || []);
    } finally {
      setLeaveBalanceLoading(false);
    }
  };

  // Open dialog handlers
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
    const uid = localStorage.getItem('uid');
    if (!uid) return;
    const payload = {
      uid: Number(uid),
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
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1d1a4e]">Dashboard</h1>
          <p className="text-gray-500 mt-2">Overview of your attendance and leave management</p>
        </div>

{/* Top Row: Card with Clock In/Out (left) and Action Buttons (right) */}
<Card className="mt-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-stretch min-h-[320px]">
            {/* Left: Clock In/Out Widget, centered, no border, left-aligned text */}
            <div className="flex items-center justify-center p-8 md:p-12">
              <div className="w-full max-w-md text-left">
                <h2 className="text-2xl font-bold text-[#1d1a4e] mb-2">Attendance</h2>
                <AttendanceWidget />
              </div>
            </div>
            {/* Right: 2x2 grid of action buttons, centered, larger buttons */}
            <div className="flex items-center justify-center p-8 md:p-12">
              <div className="grid grid-cols-2 gap-8 w-full max-w-md">
                <Button variant="secondary" className="flex flex-col items-center py-8 px-4 min-h-[120px] min-w-[120px] text-base font-semibold shadow-sm" onClick={() => setLeaveDialogOpen(true)}>
                  <CalendarIcon className="w-9 h-9 mb-3" />
                  <span>Apply Leave</span>
                </Button>
                <Button variant="secondary" className="flex flex-col items-center py-8 px-4 min-h-[120px] min-w-[120px] text-base font-semibold shadow-sm" onClick={() => setExpenseDialogOpen(true)}>
                  <ReceiptText className="w-9 h-9 mb-3" />
                  <span>Submit Expense</span>
                </Button>
                <Button variant="secondary" className="flex flex-col items-center py-8 px-4 min-h-[120px] min-w-[120px] text-base font-semibold shadow-sm" onClick={() => setOtDialogOpen(true)}>
                  <Clock className="w-9 h-9 mb-3" />
                  <span>OT Request</span>
                </Button>
                <Button variant="secondary" className="flex flex-col items-center py-8 px-4 min-h-[120px] min-w-[120px] text-base font-semibold shadow-sm" onClick={() => setDiscussionDialogOpen(true)}>
                  <MessageCircle className="w-9 h-9 mb-3" />
                  <span>Start Discussion</span>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Second Row: Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition" onClick={openAttendanceDialog}>
            <CardHeader>
              <CardTitle className="text-lg">Attendance Rate</CardTitle>
              <p className="text-sm text-muted-foreground">This month</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.round(attendanceRate)}%</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition" onClick={() => setOvertimeRequests(overtimeRequests + 1)}>
            <CardHeader>
              <CardTitle className="text-lg">Overtime Requests</CardTitle>
              <p className="text-sm text-muted-foreground">This month</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overtimeRequests}</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition" onClick={openPendingDialog}>
            <CardHeader>
              <CardTitle className="text-lg">Pending Requests</CardTitle>
              <p className="text-sm text-muted-foreground">Leave applications</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingRequests}</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition" onClick={() => setClaimDialogOpen(true)}>
            <CardHeader>
              <CardTitle className="text-lg">Claim Requests</CardTitle>
              <p className="text-sm text-muted-foreground">This month</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{claimRequests}</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition" onClick={openLeaveBalanceDialog}>
            <CardHeader>
              <CardTitle className="text-lg">Leave Balance</CardTitle>
              <p className="text-sm text-muted-foreground">This month</p>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {leaveAllocations.reduce((sum, alloc) => sum + ((alloc.number_of_days_display ?? alloc.max_leaves ?? 0) - (alloc.leaves_taken ?? 0)), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        

        {/* Third Row: Monthly Attendance Chart (full width) */}
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow p-6 w-full">
            <h2 className="text-xl font-bold mb-4">Monthly Attendance</h2>
            {monthlyAttendanceLoading ? (
              <div className="h-[300px] flex items-center justify-center text-gray-400">Loading...</div>
            ) : (
              <AttendanceReportChart data={monthlyAttendanceData} />
            )}
          </div>
        </div>

        {/* Third Row: Shift Codes */}
        {missedClockOut && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
            <strong>Reminder:</strong> You forgot to clock out yesterday. Please contact HR or your manager to correct your attendance.
          </div>
        )}
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
          <LeaveRequestDashboardForm onClose={() => setLeaveDialogOpen(false)} />
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

// --- Dashboard Leave Request Form (copied from leave page) ---
function LeaveRequestDashboardForm({ onClose }: { onClose: () => void }) {
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState('');
  const [selectedType, setSelectedType] = useState<any | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [duration, setDuration] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [document, setDocument] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTypes = async () => {
      const uid = localStorage.getItem('uid');
      if (!uid) return;
      const res = await fetch('/api/odoo/leave/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uid) }),
      });
      const data = await res.json();
      setLeaveTypes(data || []);
      if (data && data.length > 0) {
        setSelectedLeaveTypeId(data[0].id.toString());
      }
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    const found = leaveTypes.find((t) => t.id.toString() === selectedLeaveTypeId);
    setSelectedType(found || null);
    setDuration('');
    setStartTime('');
    setEndTime('');
    setDocument(null);
  }, [selectedLeaveTypeId, leaveTypes]);

  function calculateHours(start: string, end: string): number {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startFloat = sh + sm / 60;
    const endFloat = eh + em / 60;
    return Math.max(0, parseFloat((endFloat - startFloat).toFixed(2)));
  }
  function timeStringToFloat(time: string): number | null {
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h + m / 60;
  }
  const isValid = (): boolean => {
    if (!selectedLeaveTypeId || !startDate || !endDate) return false;
    if (selectedType) {
      if (selectedType.request_unit === 'hour') {
        if (duration !== 'hour') return false;
        if (!startTime || !endTime) return false;
        if (calculateHours(startTime, endTime) <= 0) return false;
      } else {
        if (!['full', 'half', 'second_half'].includes(duration)) return false;
      }
    }
    if (selectedType?.support_document && !document) return false;
    return true;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const rawUid = localStorage.getItem('uid');
      if (!rawUid) throw new Error('Not logged in');
      const uid = Number(rawUid);
      const payload: any = {
        uid,
        request: {
          leaveTypeId: parseInt(selectedLeaveTypeId),
          request_date_from: startDate ? startDate.toISOString().slice(0, 10) : '',
          request_date_to: endDate ? endDate.toISOString().slice(0, 10) : '',
          reason,
        },
      };
      if (duration === 'hour') {
        const fromFloat = timeStringToFloat(startTime);
        const toFloat = timeStringToFloat(endTime);
        if (fromFloat === null || toFloat === null) {
          toast.error('Invalid start/end times');
          setSubmitting(false);
          return;
        }
        const hours = calculateHours(startTime, endTime);
        if (hours <= 0) {
          toast.error('End time must be after start time');
          setSubmitting(false);
          return;
        }
        payload.request.request_unit_hours = true;
        payload.request.request_hour_from = parseFloat(fromFloat.toFixed(2));
        payload.request.request_hour_to = parseFloat(toFloat.toFixed(2));
        payload.request.number_of_days_display = parseFloat(hours.toFixed(2));
      } else if (duration === 'half' || duration === 'second_half') {
        payload.request.request_unit_hours = false;
        payload.request.number_of_days = 0.5;
      } else if (duration === 'full') {
        payload.request.request_unit_hours = false;
      }
      if (selectedType?.support_document && document) {
        const formData = new FormData();
        formData.append('file', document);
        const uploadRes = await fetch('/api/odoo/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadJson = await uploadRes.json();
        if (uploadJson.error) throw new Error(uploadJson.error);
        payload.request.attachment_id = uploadJson.attachmentId;
      }
      const response = await fetch('/api/odoo/leave/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      toast.success('Leave request submitted successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1 font-medium">Leave Type</label>
        <Select value={selectedLeaveTypeId} onValueChange={setSelectedLeaveTypeId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select leave type" />
          </SelectTrigger>
          <SelectContent>
            {leaveTypes.map((type) => (
              <SelectItem key={type.id} value={type.id.toString()}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block mb-1 font-medium">Start Date</label>
          <Input
            type="date"
            value={startDate ? startDate.toISOString().slice(0, 10) : ''}
            onChange={(e) => setStartDate(new Date(e.target.value))}
            required
          />
        </div>
        <div className="flex-1">
          <label className="block mb-1 font-medium">End Date</label>
          <Input
            type="date"
            value={endDate ? endDate.toISOString().slice(0, 10) : ''}
            onChange={(e) => setEndDate(new Date(e.target.value))}
            required
          />
        </div>
      </div>
      {selectedType && (
        <div>
          <label className="block mb-1 font-medium">Duration</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1">
              <input type="radio" name="duration" value="half" checked={duration === 'half'} onChange={() => setDuration('half')} />
              Half Day (AM)
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="duration" value="second_half" checked={duration === 'second_half'} onChange={() => setDuration('second_half')} />
              Second Half (PM)
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="duration" value="hour" checked={duration === 'hour'} onChange={() => setDuration('hour')} />
              Hours
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="duration" value="full" checked={duration === 'full'} onChange={() => setDuration('full')} />
              Full Day
            </label>
          </div>
        </div>
      )}
      {duration === 'hour' && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block mb-1 font-medium">Start Time</label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </div>
          <div className="flex-1">
            <label className="block mb-1 font-medium">End Time</label>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </div>
        </div>
      )}
      <div>
        <label className="block mb-1 font-medium">Reason</label>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required />
      </div>
      {selectedType?.support_document && (
        <div>
          <label className="block mb-1 font-medium">Supporting Document</label>
          <Input type="file" onChange={(e) => setDocument(e.target.files?.[0] || null)} required />
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button type="submit" disabled={!isValid() || submitting}>{submitting ? 'Submitting...' : 'Submit'}</Button>
      </div>
    </form>
  );
}
