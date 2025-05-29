// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
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
          <Card className="cursor-pointer hover:shadow-lg transition" onClick={() => setClaimDialogOpen(true)}>
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
    </MainLayout>
  );
}
