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
        payload.request.request_unit_hours = true;
        payload.request.request_hour_from = timeStringToFloat(startTime);
        payload.request.request_hour_to = timeStringToFloat(endTime);
        payload.request.number_of_days_display = calculateHours(startTime, endTime);
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
            <TabsTrigger value="history" onClick={() => router.push('/leave/history')}>Leave History</TabsTrigger>
          </TabsList>
          <TabsContent value="calendar">
            {/* Calendar view here (example below) */}
            <div className="flex justify-center">
              <Calendar mode="multiple" numberOfMonths={3} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
} 