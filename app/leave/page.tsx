'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeaveType, LeaveRequest } from '@/lib/odooXml';
import { toast } from 'sonner';

interface LeaveBalance {
  type: string;
  entitled: number;
  used: number;
  remaining: number;
}

// Extend the LeaveAllocation type for UI fields
interface LeaveAllocationUI {
  id: number;
  holiday_status_id: [number, string];
  number_of_days?: number;
  number_of_days_display?: number;
  leaves_taken?: number;
  state?: string;
  date_from?: string;
  date_to?: string;
  manager_id?: [number, string];
  notes?: string;
}

export default function LeavePage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveAllocations, setLeaveAllocations] = useState<LeaveAllocationUI[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Leave request form state
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState('');
  const [selectedType, setSelectedType] = useState<LeaveType | null>(null);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('');
  const [document, setDocument] = useState<File | null>(null);
  
  // Filters state
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawUid = localStorage.getItem('uid');
        if (!rawUid) {
          setError('Not logged in');
          return;
        }
        const uid = Number(rawUid);

        // Fetch all leave-related data
        const [types, allocations, requests] = await Promise.all([
          fetch('/api/odoo/leave/types', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid })
          }).then(res => res.json()),
          fetch('/api/odoo/leave/allocation', {
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
        if (allocations.error) throw new Error(allocations.error);
        if (requests.error) throw new Error(requests.error);

        setLeaveTypes(types);
        setLeaveAllocations(allocations.allocations || []);
        setLeaveRequests(requests);
      } catch (err) {
        console.error('Error fetching leave data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load leave data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [yearFilter, typeFilter, statusFilter]);

  const handleLeaveRequest = async () => {
    if (!startDate || !endDate || !selectedLeaveTypeId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const rawUid = localStorage.getItem('uid');
      if (!rawUid) throw new Error('Not logged in');
      const uid = Number(rawUid);

      const response = await fetch('/api/odoo/leave/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          request: {
            leaveTypeId: parseInt(selectedLeaveTypeId),
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd'),
            reason
          }
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Leave request submitted successfully');
      setIsRequestOpen(false);
      // Refresh leave requests
      const newRequests = await fetch('/api/odoo/leave/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid })
      }).then(res => res.json());
      if (newRequests.error) throw new Error(newRequests.error);
      setLeaveRequests(newRequests);
    } catch (err) {
      console.error('Error submitting leave request:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to submit leave request');
    }
  };

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

  const isValid = () => {
    if (!selectedLeaveTypeId || !startDate || !endDate) return false;
    if (selectedType?.request_unit !== 'day' && !duration) return false;
    if (selectedType?.support_document && !document) return false;
    return true;
  };

  // Update selectedType when selectedLeaveTypeId changes
  useEffect(() => {
    const type = leaveTypes.find(t => t.id.toString() === selectedLeaveTypeId);
    setSelectedType(type || null);
  }, [selectedLeaveTypeId, leaveTypes]);

  // Set default leave type to 'Annual Leave' if available
  useEffect(() => {
    if (leaveTypes.length > 0 && !selectedLeaveTypeId) {
      const annual = leaveTypes.find(t => t.name.toLowerCase().includes('annual'));
      if (annual) setSelectedLeaveTypeId(annual.id.toString());
      else setSelectedLeaveTypeId(leaveTypes[0].id.toString());
    }
  }, [leaveTypes]);

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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">View and manage your leave requests</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {leaveAllocations.map((allocation) => (
            <Card key={allocation.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {allocation.holiday_status_id?.[1] || '—'}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {allocation.state ? `Status: ${allocation.state}` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Allocated: {allocation.number_of_days_display ?? allocation.number_of_days ?? '-'} days</div>
                  <div>Used: {allocation.leaves_taken ?? '-'} days</div>
                  <div>From: {allocation.date_from || '-'} To: {allocation.date_to || '-'}</div>
                  <div>Manager: {allocation.manager_id?.[1] || '-'}</div>
                  <div>Notes: {allocation.notes || '-'}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Leave Request Button and Dialog */}
        <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full md:w-auto">
              Apply for Leave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Leave Request</DialogTitle>
              <DialogDescription>
                Submit a new leave request. Please fill in all required fields.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Leave Type</label>
                <Select value={selectedLeaveTypeId} onValueChange={setSelectedLeaveTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem 
                        key={type.id} 
                        value={type.id.toString()}
                        className={type.color ? `text-[#${type.color.toString(16)}]` : ''}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span>{type.name}</span>
                          {type.virtual_remaining_leaves !== undefined && (
                            <span className="text-sm text-gray-500">
                              ({type.virtual_remaining_leaves} days remaining)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedType && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Day Duration: Only show if half_day or hour */}
                  {selectedType.request_unit === 'half_day' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Day Duration</label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning</SelectItem>
                          <SelectItem value="afternoon">Afternoon</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {selectedType.request_unit === 'hour' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Hour Duration</label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select hours" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 8 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {i + 1} hour{i > 0 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Supporting Document */}
                  {selectedType.support_document && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Supporting Document
                        <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="file"
                        onChange={(e) => setDocument(e.target.files?.[0] || null)}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </div>
                  )}

                  {/* Reason */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reason</label>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Enter reason for leave"
                    />
                  </div>

                  {selectedType?.unpaid && (
                    <div className="rounded-md bg-yellow-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Unpaid Leave Notice
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>
                              This is an unpaid leave type. Your salary will be adjusted accordingly.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleLeaveRequest} 
                    className="w-full"
                    disabled={!isValid()}
                  >
                    Submit Request
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Filters */}
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

{/* Request Status Cards */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {leaveRequests.map((req) => (
    <Card key={req.id} className="border-l-4
      {req.state === 'validate' ? 'border-green-500' :
       req.state === 'refuse'   ? 'border-red-500' :
       'border-yellow-500'}">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{req.holiday_status_id[1]}</CardTitle>
        <CardDescription className="text-xs">
          {format(new Date(req.request_date_from), 'dd/MM')} – {format(new Date(req.request_date_to), 'dd/MM')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>
          Status: <span className={
            req.state === 'validate' ? 'text-green-600' :
            req.state === 'refuse'   ? 'text-red-600' :
            'text-yellow-600'
          }>
            {getStatusText(req.state)}
          </span>
        </div>
      </CardContent>
    </Card>
  ))}
</div>

        {/* Leave History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Leave History</CardTitle>
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
                  </TableRow>
                ))}
                {leaveRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
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