'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/main-layout';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { DayClickEventHandler } from 'react-day-picker';

import { LeaveType, LeaveRequest } from '@/lib/odooXml'; // your type definitions
import { LeaveRequestForm } from '@/components/leave-request-form';
import { useRole } from '@/context/RoleContext';
import RoleSwitcher from '@/components/RoleSwitcher';

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
  const { activeRole } = useRole();
  // ───── State ────────────────────────────────────────────────────────────────
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveAllocations, setLeaveAllocations] = useState<LeaveAllocationUI[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Leave request form state
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<LeaveType | null>(null);
  const [reason, setReason] = useState<string>('');
  const [duration, setDuration] = useState<'full' | 'half' | 'second_half' | 'hour' | ''>('');
  const [document, setDocument] = useState<File | null>(null);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  // Filters state
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const router = useRouter();
  const searchParams = useSearchParams();

  // ───── Data Fetching ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawUid = localStorage.getItem('uid');
        if (!rawUid) {
          setError('Not logged in');
          return;
        }
        const uid = Number(rawUid);

        // Fetch all leave-related data in parallel
        const [typesRes, allocsRes, requestsRes] = await Promise.all([
          fetch('/api/odoo/leave/types', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId: uid }),
          }).then(res => res.json()),
          fetch('/api/odoo/leave/allocation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId: uid }),
          }).then(res => res.json()),
          fetch('/api/odoo/leave/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: uid,
              filters: {
                year: parseInt(yearFilter),
                leaveType:
                  typeFilter !== 'all' ? parseInt(typeFilter) : undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
              },
            }),
          }).then(res => res.json()),
        ]);

        if (typesRes.error) throw new Error(typesRes.error);
        if (allocsRes.error) throw new Error(allocsRes.error);
        if (requestsRes.error) throw new Error(requestsRes.error);

        setLeaveTypes(typesRes);
        setLeaveAllocations(allocsRes.allocations || []);
        setLeaveRequests(requestsRes);
      } catch (err) {
        console.error('Error fetching leave data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load leave data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [yearFilter, typeFilter, statusFilter]);

  // Open request form if ?request=1 is in URL
  useEffect(() => {
    if (searchParams?.get('request') === '1') {
      setIsRequestOpen(true);
    }
  }, [searchParams]);

  // Update selectedType whenever selectedLeaveTypeId changes
  useEffect(() => {
    const found = leaveTypes.find((t) => t.id.toString() === selectedLeaveTypeId);
    setSelectedType(found || null);
    // Reset duration / times if type changes
    setDuration('');
    setStartTime('');
    setEndTime('');
    setDocument(null);
  }, [selectedLeaveTypeId, leaveTypes]);

  // Default the leave type to "Annual" if available
  useEffect(() => {
    if (leaveTypes.length > 0 && !selectedLeaveTypeId) {
      const annual = leaveTypes.find((t) =>
        t.name.toLowerCase().includes('annual')
      );
      if (annual) setSelectedLeaveTypeId(annual.id.toString());
      else setSelectedLeaveTypeId(leaveTypes[0].id.toString());
    }
  }, [leaveTypes]);

  // ───── Helpers ─────────────────────────────────────────────────────────────
  /** Calculate difference in hours between two "HH:mm" strings */
  function calculateHours(start: string, end: string): number {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startFloat = sh + sm / 60;
    const endFloat = eh + em / 60;
    return Math.max(0, parseFloat((endFloat - startFloat).toFixed(2)));
  }

  /** Convert "HH:mm" to a float hour (e.g. "07:30" → 7.5) */
  function timeStringToFloat(time: string): number | null {
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h + m / 60;
  }

  /** Convert a float hour back to "HH:mm" string, if ever needed */
  function floatToTimeString(val?: number): string {
    if (typeof val !== 'number' || isNaN(val)) return '';
    const h = Math.floor(val);
    const m = Math.round((val - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /** Check if request form is valid before enabling "Submit" */
  const isValid = (): boolean => {
    if (!selectedLeaveTypeId || !startDate || !endDate) return false;

    // If the leave type's "request_unit" is "hour", we must have duration="hour"
    // If the leave type's "request_unit" is "day", we must have duration = 'full'|'half'|'second_half'
    if (selectedType) {
      if (selectedType.request_unit === 'hour') {
        // Must choose the "Hours" radio
        if (duration !== 'hour') return false;
        // Must have valid startTime & endTime
        if (!startTime || !endTime) return false;
        if (calculateHours(startTime, endTime) <= 0) return false;
      } else {
        // Must choose one of the day-based options
        if (!['full', 'half', 'second_half'].includes(duration)) return false;
      }
    }

    // If this leave type requires a supporting document, ensure it's uploaded
    if (selectedType?.support_document && !document) return false;

    // It's valid
    return true;
  };

  // ───── Handle the "Submit Leave Request" ───────────────────────────────────
  const handleLeaveRequest = async () => {
    if (!isValid()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const rawUid = localStorage.getItem('uid');
      if (!rawUid) throw new Error('Not logged in');
      const uid = Number(rawUid);

      // Build the base of the payload
      const payload: any = {
        uid,
        request: {
          leaveTypeId: parseInt(selectedLeaveTypeId),
          request_date_from: format(startDate!, 'yyyy-MM-dd'),
          request_date_to: format(endDate!, 'yyyy-MM-dd'),
          reason,
        },
      };

      // If the request is "Hourly"
      if (duration === 'hour') {
        const fromFloat = timeStringToFloat(startTime);
        const toFloat = timeStringToFloat(endTime);
        if (fromFloat === null || toFloat === null) {
          toast.error('Invalid start/end times');
          return;
        }
        const hours = calculateHours(startTime, endTime);
        if (hours <= 0) {
          toast.error('End time must be after start time');
          return;
        }
        payload.request.request_unit_hours = true;
        payload.request.request_hour_from = parseFloat(fromFloat.toFixed(2));
        payload.request.request_hour_to = parseFloat(toFloat.toFixed(2));
        // number_of_days_display is sometimes used to show hours on Odoo side
        payload.request.number_of_days_display = parseFloat(hours.toFixed(2));
      }
      // If the request is "Half-Day (AM or PM)" or "Second Half-Day"
      else if (duration === 'half' || duration === 'second_half') {
        // For a "half-day," we send number_of_days = 0.5
        payload.request.request_unit_hours = false;
        payload.request.number_of_days = 0.5;
      }
      // If the request is "Full Day"
      else if (duration === 'full') {
        payload.request.request_unit_hours = false;
        // We do NOT explicitly set number_of_days here,
        // because Odoo will compute "(date_to−date_from)+1" as days.
        // If you want to guarantee "1 day," you could do payload.request.number_of_days = 1.0;
        // But Odoo can infer it from the date range.
      }

      // Attach document (if required)
      if (selectedType?.support_document && document) {
        const formData = new FormData();
        formData.append('file', document);
        // Assume you have an upload endpoint at /api/odoo/upload
        const uploadRes = await fetch('/api/odoo/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadJson = await uploadRes.json();
        if (uploadJson.error) throw new Error(uploadJson.error);
        // uploadJson should return { attachmentId: number }
        payload.request.attachment_id = uploadJson.attachmentId;
      }

      // Debug: see exactly what we're sending
      console.log('Leave Request Payload:', payload);

      const response = await fetch('/api/odoo/leave/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Leave request submitted successfully');
      setIsRequestOpen(false);

      // Refresh the list of leave requests
      const newRequests = await fetch('/api/odoo/leave/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: uid }),
      }).then((res) => res.json());
      if (newRequests.error) throw new Error(newRequests.error);
      setLeaveRequests(newRequests);
    } catch (err) {
      console.error('Error submitting leave request:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to submit leave request');
    }
  };

  // ───── Calendar Day Click Handler ─────────────────────────────────────────
  const handleCalendarDayClick: DayClickEventHandler = (date) => {
    // Open the request dialog, pre-fill both start & end as the clicked date
    setStartDate(date);
    setEndDate(date);
    setIsRequestOpen(true);
  };

  // ───── Render Loading / Error States ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading leave data...</p>
      </div>
    );
  }

  if (error) {
    return (
        <Card>
          <CardContent className="text-red-600 p-6">{error}</CardContent>
        </Card>
    );
  }

  // ───── Main JSX ───────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-6">
        <Tabs defaultValue="calendar" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="balance">
                Leave Balance
              </TabsTrigger>
              <TabsTrigger value="history">
                Leave History
              </TabsTrigger>
            </TabsList>
            <button
              className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors ml-4"
              onClick={() => setIsRequestOpen(true)}
            >
              Request Leave
            </button>
          </div>

          {/* ─── Calendar Tab ──────────────────────────────────────────────── */}
          <TabsContent value="calendar">
            <div className="flex justify-center">
              <Calendar mode="single" onDayClick={handleCalendarDayClick} initialMonth={new Date()} />
            </div>
          </TabsContent>

          {/* ─── Balance Tab ───────────────────────────────────────────────── ── */}
          <TabsContent value="balance">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Validity Period</TableHead>
                    <TableHead>Allocation</TableHead>
                    <TableHead>Used Days</TableHead>
                    <TableHead>Remaining Days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveAllocations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No leave allocations found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaveAllocations.map((alloc) => (
                      <TableRow key={alloc.id}>
                        <TableCell>{alloc.holiday_status_id?.[1] || '-'}</TableCell>
                        <TableCell>
                          {alloc.date_from
                            ? `${alloc.date_from} – ${alloc.date_to || '-'}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {alloc.number_of_days_display || alloc.number_of_days || '-'}
                        </TableCell>
                        <TableCell>{alloc.leaves_taken || 0}</TableCell>
                        <TableCell>
                          {alloc.number_of_days !== undefined && alloc.leaves_taken !== undefined
                            ? (alloc.number_of_days - alloc.leaves_taken).toFixed(2)
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ─── History Tab ───────────────────────────────────────────────── ── */}
          <TabsContent value="history">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No leave requests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaveRequests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>{req.holiday_status_id?.[1] || '-'}</TableCell>
                        <TableCell>{req.request_date_from || '-'}</TableCell>
                        <TableCell>{req.request_date_to || '-'}</TableCell>
                        <TableCell>{req.number_of_days_display || req.number_of_days || '-'}</TableCell>
                        <TableCell>{req.state || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* ─── Leave Request Dialog ─────────────────────────────────────────────── */}
        <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
            </DialogHeader>
            <LeaveRequestForm onSubmit={handleLeaveRequest} isSubmitting={loading} />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
