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

export interface LeaveRequestFormProps {
  onSubmit: (data: {
    startDate: string;
    endDate: string;
    reason: string;
    leaveType: string;
    halfDay: boolean;
    halfDaySession?: 'Morning' | 'Afternoon';
    customHours: boolean;
    customHourValue: string;
    files: File[];
  }) => void;
  isSubmitting?: boolean;
}

export function LeaveRequestForm({ onSubmit, isSubmitting = false }: LeaveRequestFormProps) {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  // New fields
  const [leaveType, setLeaveType] = useState('Annual Leave');
  const [halfDay, setHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState<'Morning' | 'Afternoon'>('Morning');
  const [customHours, setCustomHours] = useState(false);
  const [customHourValue, setCustomHourValue] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate duration
  let durationDays = 0;
  if (startDate && endDate) {
    durationDays = Math.max(0, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    if (halfDay) durationDays = 0.5;
    if (customHours && customHourValue) durationDays = 0;
  }
  let durationHours = customHours && customHourValue ? Number(customHourValue) : durationDays * 8;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };
  const handleRemoveFile = (idx: number) => {
    setFiles(files => files.filter((_, i) => i !== idx));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('End date must be after start date');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for your leave');
      return;
    }
    if (customHours && (!customHourValue || isNaN(Number(customHourValue)))) {
      setError('Please enter valid custom hours');
      return;
    }
    onSubmit({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      reason,
      leaveType,
      halfDay,
      halfDaySession: halfDay ? halfDaySession : undefined,
      customHours,
      customHourValue,
      files,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Off Request</CardTitle>
        <CardDescription>Fill out the form to submit a leave request</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="leaveType">Time Off Type</Label>
            <select
              id="leaveType"
              className="w-full border rounded px-2 py-1"
              value={leaveType}
              onChange={e => setLeaveType(e.target.value)}
            >
              <option value="Annual Leave">Annual Leave</option>
              <option value="Medical Leave">Medical Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
              <option value="Maternity Leave">Maternity Leave</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dates">Dates</Label>
            <div className="flex gap-2">
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
                    {startDate ? formatDateLong(startDate) : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="self-center">→</span>
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
                    {endDate ? formatDateLong(endDate) : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
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
        </div>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={halfDay} onChange={e => setHalfDay(e.target.checked)} /> Half Day
          </label>
          {halfDay && (
            <select
              className="border rounded px-2 py-1"
              value={halfDaySession}
              onChange={e => setHalfDaySession(e.target.value as 'Morning' | 'Afternoon')}
            >
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
            </select>
          )}
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={customHours} onChange={e => setCustomHours(e.target.checked)} /> Custom Hours
          </label>
          {customHours && (
            <input
              type="number"
              min="0"
              step="0.5"
              className="border rounded px-2 py-1 w-24"
              placeholder="Hours"
              value={customHourValue}
              onChange={e => setCustomHourValue(e.target.value)}
            />
          )}
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-sm font-semibold">Duration:</span>
          <span className="text-sm">{halfDay ? '0.5 Day' : customHours ? `${customHourValue || 0} Hours` : `${durationDays} Days (${durationHours} Hours)`}</span>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reason">Reason</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter the reason for your leave request"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Supporting Document</Label>
          <input
            ref={fileInputRef}
            type="file"
            className="block border rounded px-2 py-1 w-full"
            onChange={handleFileChange}
            multiple
          />
          {files.length > 0 && (
            <ul className="list-disc pl-5 text-sm">
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
        <CardFooter className="flex justify-end space-x-2">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Save'}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => window.history.back()}>
            Discard
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 