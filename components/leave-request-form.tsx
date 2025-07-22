'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDateLong } from "@/lib/utils/dateFormat";
import { CalendarIcon } from "lucide-react";
import { useRef } from 'react';
import { format } from 'date-fns';
import { useEffect } from 'react';

export interface LeaveRequestFormProps {
  onSubmit?: (data: {
    holiday_status_id: string; // Time off type
    request_date_from: string; // Start date
    request_date_to: string;   // End date
    request_unit_half: boolean; // Half day
    request_unit_half_session?: 'am' | 'pm'; // Morning/Afternoon
    request_unit_hours: boolean; // Custom hours
    request_hour_from: string;   // Start time
    request_hour_to: string;     // End time
    number_of_days_display: number; // Duration
    name: string; // Reason
    supported_attachment_ids: number[];
  }) => void;
  isSubmitting?: boolean;
}

export function LeaveRequestForm({ onSubmit, isSubmitting = false }: LeaveRequestFormProps) {
  const [holidayStatusId, setHolidayStatusId] = useState('Annual Leave');
  const [requestDateFrom, setRequestDateFrom] = useState<Date | undefined>();
  const [requestDateTo, setRequestDateTo] = useState<Date | undefined>();
  const [requestUnitHalf, setRequestUnitHalf] = useState(false);
  const [requestUnitHalfSession, setRequestUnitHalfSession] = useState<'am' | 'pm'>('am');
  const [requestUnitHours, setRequestUnitHours] = useState(false);
  const [requestHourFrom, setRequestHourFrom] = useState('');
  const [requestHourTo, setRequestHourTo] = useState('');
  const [numberOfDaysDisplay, setNumberOfDaysDisplay] = useState(0);
  const [name, setName] = useState('');
  const [supportedAttachmentIds, setSupportedAttachmentIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    // Fetch leave types from Odoo
    const fetchLeaveTypes = async () => {
      setLoading(true);
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
        setHolidayStatusId(data[0].id.toString());
      }
      setLoading(false);
    };
    fetchLeaveTypes();
  }, []);

  // Calculate duration
  let durationDays = 0;
  if (requestDateFrom && requestDateTo) {
    durationDays = Math.max(0, Math.ceil((requestDateTo.getTime() - requestDateFrom.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    if (requestUnitHalf) durationDays = 0.5;
    if (requestUnitHours && requestHourFrom && requestHourTo) durationDays = 0;
  }
  let durationHours = 0;
  if (requestUnitHours && requestHourFrom && requestHourTo) {
    const [sh, sm] = requestHourFrom.split(':').map(Number);
    const [eh, em] = requestHourTo.split(':').map(Number);
    const startFloat = sh + sm / 60;
    const endFloat = eh + em / 60;
    durationHours = Math.max(0, parseFloat((endFloat - startFloat).toFixed(2)));
  } else {
    durationHours = durationDays * 8;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };
  const handleRemoveFile = (idx: number) => {
    setFiles(files => files.filter((_, i) => i !== idx));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!requestDateFrom || !requestDateTo) {
      setError('Please select both start and end dates');
      return;
    }
    if (new Date(requestDateFrom) > new Date(requestDateTo)) {
      setError('End date must be after start date');
      return;
    }
    if (!name.trim()) {
      setError('Please provide a reason for your leave');
      return;
    }
    if (requestUnitHours && (!requestHourFrom || !requestHourTo)) {
      setError('Please select custom hours (from and to)');
      return;
    }
    setLoading(true);
    try {
      // 1. Upload files and get attachment IDs
      let attachmentIds: number[] = [];
      if (files.length > 0) {
        attachmentIds = await Promise.all(files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/odoo/upload', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (data.attachmentId) return data.attachmentId;
          throw new Error(data.error || 'Upload failed');
        }));
      }
      // 2. Submit leave request with attachment IDs
      const uid = localStorage.getItem('uid');
      if (!uid) throw new Error('Not logged in');
      const payload = {
        uid: Number(uid),
        request: {
          holiday_status_id: holidayStatusId,
          request_date_from: requestDateFrom.toISOString().slice(0, 10),
          request_date_to: requestDateTo.toISOString().slice(0, 10),
          request_unit_half: requestUnitHalf,
          request_unit_half_session: requestUnitHalf ? requestUnitHalfSession : undefined,
          request_unit_hours: requestUnitHours,
          request_hour_from: requestHourFrom,
          request_hour_to: requestHourTo,
          number_of_days_display: requestUnitHours ? durationHours : durationDays,
          name,
          supported_attachment_ids: attachmentIds,
        },
      };
      const res = await fetch('/api/odoo/leave/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setSuccess(true);
      setError('');
      // Optionally reset form here
    } catch (err: any) {
      setError(err.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl w-full p-8">
      <CardHeader>
        <CardTitle className="text-base">Time Off Request</CardTitle>
        <CardDescription className="text-sm">Fill out the form to submit a leave request</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        {success && <div className="text-green-600 text-sm mt-2">Leave request submitted successfully!</div>}
        {/* First row: Time Off Type */}
        <div className="flex gap-6 items-center">
          <div className="flex-1">
            <Label htmlFor="leaveType" className="text-sm">Time Off Type</Label>
            <select
              id="leaveType"
              className="w-full border rounded px-3 py-2 text-sm"
              value={holidayStatusId}
              onChange={e => setHolidayStatusId(e.target.value)}
              required
            >
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name2 || type.name}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Second row: Dates */}
        <div className="flex gap-6 items-center">
          <div className="flex-1">
            <Label className="text-sm">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-sm py-2",
                    !requestDateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {requestDateFrom ? formatDateLong(requestDateFrom) : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={requestDateFrom}
                  onSelect={setRequestDateFrom}
                  initialFocus
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex-1">
            <Label className="text-sm">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-sm py-2",
                    !requestDateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {requestDateTo ? formatDateLong(requestDateTo) : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={requestDateTo}
                  onSelect={setRequestDateTo}
                  initialFocus
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {/* Third row: Tickboxes and custom hours */}
        <div className="flex gap-6 items-center">
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={requestUnitHalf} onChange={e => setRequestUnitHalf(e.target.checked)} /> Half Day
          </label>
          {requestUnitHalf && (
            <select
              className="border rounded px-2 py-1 text-sm"
              value={requestUnitHalfSession}
              onChange={e => setRequestUnitHalfSession(e.target.value as 'am' | 'pm')}
            >
              <option value="am">Morning</option>
              <option value="pm">Afternoon</option>
            </select>
          )}
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={requestUnitHours} onChange={e => setRequestUnitHours(e.target.checked)} /> Custom Hours
          </label>
          {requestUnitHours && (
            <div className="flex gap-2 items-center">
              <Label className="text-sm">From</Label>
              <Input type="time" value={requestHourFrom} onChange={e => setRequestHourFrom(e.target.value)} className="w-24 text-sm" />
              <Label className="text-sm">To</Label>
              <Input type="time" value={requestHourTo} onChange={e => setRequestHourTo(e.target.value)} className="w-24 text-sm" />
            </div>
          )}
        </div>
        {/* Duration */}
        <div className="flex gap-4 items-center">
          <span className="text-sm font-semibold">Duration:</span>
          <span className="text-sm">{requestUnitHalf ? `${requestUnitHalfSession} (0.5 Day)` : requestUnitHours ? `${durationHours} Hours` : `${durationDays} Days (${durationHours} Hours)`}</span>
        </div>
        {/* Reason */}
        <div className="space-y-2">
          <Label className="text-sm">Reason</Label>
          <Textarea
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full text-sm"
            rows={3}
            placeholder="Enter your reason for leave"
          />
        </div>
        {/* Supporting Document */}
        <div className="space-y-2">
          <Label className="text-sm">Supporting Document</Label>
          <Input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="w-full text-sm"
          />
          {files.length > 0 && (
            <ul className="text-xs mt-2">
              {files.map((file, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  {file.name}
                  <Button type="button" size="sm" variant="ghost" onClick={() => handleRemoveFile(idx)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Save/Discard Buttons */}
        <CardFooter className="flex justify-end space-x-2">
          <Button type="submit" className="w-full" disabled={isSubmitting || loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </Button>
          <Button type="button" variant="outline" className="w-full text-sm py-2" onClick={() => window.history.back()}>
            Discard
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 