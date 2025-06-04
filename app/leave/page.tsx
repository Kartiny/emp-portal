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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { DayClickEventHandler } from "react-day-picker";

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
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // Filters state
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

    // Helper to calculate hours difference
    function calculateHours(start: string, end: string) {
      if (!start || !end) return 0;
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      return Math.max(0, (eh + em / 60) - (sh + sm / 60));
    }

    // Helper to convert 'HH:mm' to float (e.g., '07:30' -> 7.5)
    function timeStringToFloat(time: string) {
      if (!time) return undefined;
      const [h, m] = time.split(':').map(Number);
      return h + (m / 60);
    }

    try {
      const rawUid = localStorage.getItem('uid');
      if (!rawUid) throw new Error('Not logged in');
      const uid = Number(rawUid);

      // Build request payload
      const payload: any = {
        uid,
        request: {
          leaveTypeId: parseInt(selectedLeaveTypeId),
          request_date_from: format(startDate, 'yyyy-MM-dd'),
          request_date_to: format(endDate, 'yyyy-MM-dd'),
          reason,
        },
      };

      if (duration === 'hour') {
        const from = timeStringToFloat(startTime);
        const to = timeStringToFloat(endTime);
        if (typeof from === 'number' && typeof to === 'number' && !isNaN(from) && !isNaN(to)) {
          payload.request.request_unit_hours = true;
          payload.request.request_hour_from = parseFloat(from.toFixed(2));
          payload.request.request_hour_to = parseFloat(to.toFixed(2));
          payload.request.number_of_days_display = calculateHours(startTime, endTime);
        } else {
          toast.error('Please provide valid start and end times');
          return;
        }
      }

      // Debug: print payload before sending
      console.log('Payload for leave request:', payload);

      const response = await fetch('/api/odoo/leave/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  // Helper to format float hour to 'HH:mm'
  function floatToTimeString(val?: number) {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    const h = Math.floor(val);
    const m = Math.round((val - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // Add this handler
  const handleCalendarDayClick: DayClickEventHandler = (date) => {
    setStartDate(date);
    setEndDate(date);
    setIsRequestOpen(true);
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
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="history" onClick={() => router.push('/leave/history')}>My Allocations</TabsTrigger>
          </TabsList>
          <TabsContent value="calendar">
            {/* Calendar view here (example below) */}
            <Calendar mode="multiple" onDayClick={handleCalendarDayClick} initialMonth={new Date()} />
          </TabsContent>
        </Tabs>
        {/* Leave Apply Dialog (already present, just ensure it's controlled by isRequestOpen) */}
        <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleLeaveRequest();
              }}
              className="space-y-4"
            >
              {/* Leave Type */}
              <div>
                <label className="block mb-1 font-medium">Leave Type</label>
                <Select value={selectedLeaveTypeId} onValueChange={setSelectedLeaveTypeId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map(type => (
                      <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Start Date & End Date */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block mb-1 font-medium">Start Date</label>
                  <Input type="date" value={startDate ? format(startDate, 'yyyy-MM-dd') : ''} onChange={e => setStartDate(new Date(e.target.value))} required />
                </div>
                <div className="flex-1">
                  <label className="block mb-1 font-medium">End Date</label>
                  <Input type="date" value={endDate ? format(endDate, 'yyyy-MM-dd') : ''} onChange={e => setEndDate(new Date(e.target.value))} required />
                </div>
              </div>
              {/* Duration Selection */}
              {selectedType?.request_unit !== 'day' && (
                <div>
                  <label className="block mb-1 font-medium">Duration</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1">
                      <input type="radio" name="duration" value="half" checked={duration === 'half'} onChange={() => setDuration('half')} />
                      Half Day
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="radio" name="duration" value="second_half" checked={duration === 'second_half'} onChange={() => setDuration('second_half')} />
                      Second Half
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="radio" name="duration" value="hour" checked={duration === 'hour'} onChange={() => setDuration('hour')} />
                      Hours
                    </label>
                  </div>
                </div>
              )}
              {/* Start/End Time for Hours */}
              {duration === 'hour' && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block mb-1 font-medium">Start Time</label>
                    <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1 font-medium">End Time</label>
                    <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                  </div>
                </div>
              )}
              {/* Reason */}
              <div>
                <label className="block mb-1 font-medium">Reason</label>
                <Textarea value={reason} onChange={e => setReason(e.target.value)} required />
              </div>
              {/* Document Upload (if required) */}
              {selectedType?.support_document && (
                <div>
                  <label className="block mb-1 font-medium">Supporting Document</label>
                  <Input type="file" onChange={e => setDocument(e.target.files?.[0] || null)} required />
                </div>
              )}
              {/* Submit/Cancel Buttons */}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsRequestOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!isValid()}>
                  Submit Request
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
} 