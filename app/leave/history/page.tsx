"use client";
import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { LeaveType, LeaveRequest } from '@/lib/odooXml';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';

export default function LeaveHistoryPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawUid = localStorage.getItem('uid');
        if (!rawUid) {
          setError('Not logged in');
          return;
        }
        const uid = Number(rawUid);
        const [types, requests] = await Promise.all([
          fetch('/api/odoo/leave/types', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid })
          }).then(res => res.json()),
          fetch('/api/odoo/leave/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              uid,
              filters: {
                year: parseInt(yearFilter),
                leaveType: typeFilter !== 'all' ? parseInt(typeFilter) : undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined
              }
            })
          }).then(res => res.json())
        ]);
        if (types.error) throw new Error(types.error);
        if (requests.error) throw new Error(requests.error);
        setLeaveTypes(types);
        setLeaveRequests(requests);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leave data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [yearFilter, typeFilter, statusFilter]);

  function floatToTimeString(val?: number) {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    const h = Math.floor(val);
    const m = Math.round((val - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validate':
        return 'text-green-600';
      case 'refuse':
        return 'text-red-600';
      case 'validate1':
      case 'confirm':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'validate':
        return 'Approved';
      case 'refuse':
        return 'Rejected';
      case 'validate1':
        return 'First Approval';
      case 'confirm':
        return 'Pending';
      default:
        return 'Draft';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p>Loading leave data...</p>
        </div>
      </MainLayout>
    );
  }
  if (error) {
    return (
      <MainLayout>
        <Card>
          <CardContent className="text-red-600 p-6">{error}</CardContent>
        </Card>
      </MainLayout>
    );
  }
  return (
    <MainLayout>
      <div className="space-y-6">
        <Tabs defaultValue="history" className="w-full">
          <TabsList>
            <TabsTrigger value="calendar" onClick={() => router.push('/leave')}>Calendar</TabsTrigger>
            <TabsTrigger value="balance" onClick={() => router.push('/leave/balance')}>Time-Off Balance</TabsTrigger>
            <TabsTrigger value="history" onClick={() => router.push('/leave/history')}>Time-Off History</TabsTrigger>
          </TabsList>
        </Tabs>
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="validate">Approved</SelectItem>
                  <SelectItem value="refuse">Rejected</SelectItem>
                  <SelectItem value="confirm">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Time-Off History</CardTitle>
            <CardDescription>Your leave requests and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      {format(new Date(request.request_date_from), 'dd/MM/yyyy')} - {format(new Date(request.request_date_to), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>{request.holiday_status_id[1]}</TableCell>
                    <TableCell>{request.number_of_days}</TableCell>
                    <TableCell>
                      <span className={getStatusColor(request.state)}>
                        {getStatusText(request.state)}
                      </span>
                    </TableCell>
                    <TableCell>{request.name}</TableCell>
                    <TableCell>
                      {request.state === 'validate' ? request.user_id[1] : '-'}
                    </TableCell>
                    <TableCell>{floatToTimeString(request.request_hour_from)}</TableCell>
                    <TableCell>{floatToTimeString(request.request_hour_to)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))}
                {leaveRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      No leave requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 