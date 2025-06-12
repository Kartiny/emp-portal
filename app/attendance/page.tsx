'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/main-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AttendanceWidget from '@/components/attendance-widget';
import { formatDate, formatTime, formatMonthYear } from '@/lib/utils/dateFormat';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import {
  addMonths,
  addWeeks,
  subMonths,
  subWeeks,
  format,
  startOfWeek,
  endOfWeek,
  differenceInMinutes,
  parseISO,
} from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { toZonedTime } from 'date-fns-tz';
import { ShiftCodes } from '@/components/ui/shift-codes';

const WORK_START_HOUR = 9; // 9 AM
const WORK_END_HOUR = 18;  // 6 PM
const STANDARD_HOURS = 12; // 7am to 7pm = 12 hours

type ViewType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

interface AttendanceRecord {
  id: number;
  checkIn: string;
  checkOut: string | null;
  workedHours: number;
  start_clock_actual?: string;
  end_clock_actual?: string;
}

interface AttendanceData {
  totalHours: number;
  rate: number;
  records: AttendanceRecord[];
  dateRange?: { start: string; end: string };
}

interface DateRangeState {
  type: ViewType;
  customRange?: { from: Date; to: Date };
}

export default function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [todayData, setTodayData] = useState<{
    lastClockIn: string | null;
    lastClockOut: string | null;
    start_clock_actual?: string | null;
    end_clock_actual?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeState>({ type: 'monthly' });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: new Date(),
  });

  // Navigate period controls
  const goToPrevious = () => {
    if (dateRange.type === 'monthly') setCurrentDate((d) => subMonths(d, 1));
    if (dateRange.type === 'weekly')  setCurrentDate((d) => subWeeks(d, 1));
    if (dateRange.type === 'biweekly')setCurrentDate((d) => subWeeks(d, 2));
  };
  const goToNext = () => {
    if (dateRange.type === 'monthly') setCurrentDate((d) => addMonths(d, 1));
    if (dateRange.type === 'weekly')  setCurrentDate((d) => addWeeks(d, 1));
    if (dateRange.type === 'biweekly')setCurrentDate((d) => addWeeks(d, 2));
  };
  const goToCurrent = () => setCurrentDate(new Date());

  const getRangeLabel = () => {
    switch (dateRange.type) {
      case 'daily':
        return format(currentDate, 'dd MMM yyyy');
      case 'weekly': {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end   = endOfWeek(currentDate, { weekStartsOn: 1 });
        return start.getMonth() === end.getMonth()
          ? `${format(start, 'dd')}–${format(end, 'dd MMM yyyy')}`
          : `${format(start, 'dd MMM')}–${format(end, 'dd MMM yyyy')}`;
      }
      case 'biweekly': {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end   = endOfWeek(addWeeks(start, 1), { weekStartsOn: 1 });
        return start.getMonth() === end.getMonth()
          ? `${format(start, 'dd')}–${format(end, 'dd MMM yyyy')}`
          : `${format(start, 'dd MMM')}–${format(end, 'dd MMM yyyy')}`;
      }
      case 'custom': {
        const { from, to } = customDateRange;
        if (from.getMonth() === to.getMonth()) {
          return `${format(from, 'dd')}–${format(to, 'dd MMM yyyy')}`;
        }
        return `${format(from, 'dd MMM')}–${format(to, 'dd MMM yyyy')}`;
      }
      default:
        return formatMonthYear(currentDate);
    }
  };

  // Fetch today's attendance
  const fetchTodayAttendance = async () => {
    try {
      const uid = localStorage.getItem('uid');
      if (!uid) throw new Error('Not logged in');
      const res = await fetch('/api/odoo/auth/attendance/today', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uid) }),
      });
      if (!res.ok) throw new Error(`(${res.status}) ${await res.text()}`);
      setTodayData(await res.json());
    } catch (err: any) {
      console.error("Error fetching today's attendance:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch range attendance
  const fetchAttendanceRange = async () => {
    try {
      setLoading(true);
      setError(null);
      const uidStr = localStorage.getItem('uid');
      if (!uidStr) throw new Error('Not logged in');
      const uid = Number(uidStr);

      const payload: any = {
        uid,
        range: dateRange.type,
        customDate: currentDate.toISOString(),
      };
      if (dateRange.type === 'custom') {
        payload.customRange = {
          from: customDateRange.from.toISOString(),
          to:   customDateRange.to.toISOString(),
        };
      }

      const res = await fetch('/api/odoo/auth/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`(${res.status}) ${await res.text()}`);
      setAttendanceData(await res.json());
    } catch (err: any) {
      console.error('Attendance fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
    const iv = setInterval(fetchTodayAttendance, 60_000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    fetchAttendanceRange();
  }, [dateRange.type, currentDate, customDateRange]);

  // Status computations
  const calculateLateStatus = (checkIn: string, shiftStart?: string) => {
    try {
      const d = toZonedTime(new Date(checkIn), 'Asia/Kuala_Lumpur');
      let ref = new Date(d);
      if (shiftStart) {
        const [h, m] = shiftStart.split(':').map(Number);
        ref.setHours(h, m, 0, 0);
      } else {
        ref.setHours(WORK_START_HOUR, 0, 0, 0);
      }
      const mins = differenceInMinutes(d, ref);
      const absMins = Math.abs(mins);
      const h = Math.floor(absMins / 60);
      const m = absMins % 60;
      const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
      if (mins === 0) return { isLate: false, isEarly: false, status: 'On time' };
      if (mins > 0)  return { isLate: true, isEarly: false, status: `Late by ${timeStr}` };
      if (mins < 0)  return { isLate: false, isEarly: true, status: `Clocked in ${timeStr} early` };
      return { isLate: false, isEarly: false, status: 'On time' };
    } catch {
      return { isLate: false, isEarly: false, status: 'N/A' };
    }
  };
  const calculateEarlyLeaveStatus = (checkOut: string, late: boolean, shiftEnd?: string) => {
    try {
      const d = toZonedTime(new Date(checkOut), 'Asia/Kuala_Lumpur');
      let ref = new Date(d);
      if (shiftEnd) {
        const [h, m] = shiftEnd.split(':').map(Number);
        ref.setHours(h, m, 0, 0);
      } else {
        ref.setHours(WORK_END_HOUR, 0, 0, 0);
      }
      const mins = differenceInMinutes(ref, d);
      const absMins = Math.abs(mins);
      const h = Math.floor(absMins / 60);
      const m = absMins % 60;
      const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
      if (mins === 0)  return { isEarly: false, status: late ? 'Left on time' : 'Full day' };
      if (mins > 0)   return { isEarly: true,  status: `Left early by ${timeStr}` };
      if (mins < 0)   return { isEarly: false, status: `Left late by ${timeStr}` };
      return { isEarly: false, status: 'N/A' };
    } catch {
      return { isEarly: false, status: 'N/A' };
    }
  };
  const calculateOvertimeHours = (checkOut: string) => {
    try {
      const d = toZonedTime(new Date(checkOut), 'Asia/Kuala_Lumpur');
      const ref = new Date(d); ref.setHours(WORK_END_HOUR, 0, 0, 0);
      const mins = differenceInMinutes(d, ref);
      return mins > 0 ? mins / 60 : 0;
    } catch {
      return 0;
    }
  };
  const formatHours = (h: number) => `${Math.floor(h)}h ${Math.round((h%1)*60)}m`;

  // Compute missedClockOut
  const now = toZonedTime(new Date(), 'Asia/Kuala_Lumpur');
  const missedClockOut = !!(
    todayData &&
    todayData.lastClockIn &&
    !todayData.lastClockOut &&
    (now.getHours() > WORK_END_HOUR || (now.getHours() === WORK_END_HOUR && now.getMinutes() > 0))
  );

  if (loading) {
    return (
      <MainLayout missedClockOut={missedClockOut}>
        <div className="flex items-center justify-center h-64">
          <p>Loading attendance data...</p>
        </div>
      </MainLayout>
    );
  }
  if (error) {
    return (
      <MainLayout missedClockOut={missedClockOut}>
        <Card>
          <CardContent className="text-red-600 p-6">{error}</CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout missedClockOut={missedClockOut}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Attendance</h1>
            <p className="text-muted-foreground">View and manage your attendance</p>
          </div>
          <Button
            className="bg-blue-900 text-white hover:bg-blue-800 transition-colors"
            onClick={() => alert('Overtime Request logic coming soon!')}
          >
            Overtime Request
          </Button>
        </div>

        {/* Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AttendanceWidget />
          
          <Card>
            <CardHeader>
              <CardTitle>Today's Attendance</CardTitle>
              <CardDescription>Current attendance status</CardDescription>
            </CardHeader>
            <CardContent>
              {todayData ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm">Check-in Status</p>
                    <p className={
                      !todayData.lastClockIn
                        ? 'text-red-600'
                        : calculateLateStatus(todayData.lastClockIn || '', todayData.start_clock_actual || undefined).isLate
                          ? 'text-yellow-600'
                          : calculateLateStatus(todayData.lastClockIn || '', todayData.start_clock_actual || undefined).isEarly
                            ? 'text-blue-600'
                            : 'text-green-600'
                    }>
                      {!todayData.lastClockIn
                        ? 'Not clocked in today'
                        : calculateLateStatus(todayData.lastClockIn || '', todayData.start_clock_actual || undefined).status}
                    </p>
                  </div>
                  {todayData.lastClockOut && (
                    <>
                      <div>
                        <p className="text-sm">Check-out Status</p>
                        <p className={calculateEarlyLeaveStatus(
                          todayData.lastClockOut || '',
                          calculateLateStatus(todayData.lastClockIn || '', todayData.start_clock_actual || undefined).isLate,
                          todayData.end_clock_actual || undefined
                        ).isEarly ? 'text-red-600' : 'text-green-600'}>
                          {calculateEarlyLeaveStatus(
                            todayData.lastClockOut || '',
                            calculateLateStatus(todayData.lastClockIn || '', todayData.start_clock_actual || undefined).isLate,
                            todayData.end_clock_actual || undefined
                          ).status}
                        </p>
                      </div>
                      {calculateOvertimeHours(todayData.lastClockOut) > 0 && (
                        <div>
                          <p className="text-sm">Overtime</p>
                          <p className="text-lg text-blue-600">
                            {formatHours(calculateOvertimeHours(todayData.lastClockOut))}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground">No attendance recorded for today</div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
            <CardDescription>
              {attendanceData?.dateRange
                ? `From ${formatDate(attendanceData.dateRange.start)} to ${formatDate(attendanceData.dateRange.end)}`
                : 'Your attendance statistics'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm">Total Hours</p>
                <p className="text-2xl font-bold">{attendanceData?.totalHours.toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-sm">Attendance Rate</p>
                <p className="text-2xl font-bold">{attendanceData?.rate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex items-center gap-4 py-2 px-4 bg-[#1d1a4e] rounded-lg">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPrevious} disabled={dateRange.type === 'daily' || dateRange.type === 'custom'}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={goToCurrent}>
              {getRangeLabel()}
            </Button>
            <Button variant="outline" size="icon" onClick={goToNext} disabled={dateRange.type === 'daily' || dateRange.type === 'custom' || format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Select value={dateRange.type} onValueChange={(v: ViewType) => setDateRange({ type: v })}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily View</SelectItem>
              <SelectItem value="weekly">Weekly View</SelectItem>
              <SelectItem value="biweekly">Bi-Weekly View</SelectItem>
              <SelectItem value="monthly">Monthly View</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {dateRange.type === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" /> Select Dates
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="range"
                  selected={customDateRange}
                  onSelect={(range) => range?.from && range?.to && setCustomDateRange({ from: range.from, to: range.to })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>Your attendance history</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Worked Hours</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Overtime Approved Hour(s)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData?.records.map((rec) => {
                  const late = calculateLateStatus(rec.checkIn, rec.start_clock_actual);
                  const early = rec.checkOut
                    ? calculateEarlyLeaveStatus(rec.checkOut, late.isLate, rec.end_clock_actual)
                    : null;
                  const overtime = rec.checkOut
                    ? calculateOvertimeHours(rec.checkOut)
                    : 0;

                  return (
                    <TableRow key={rec.id}>
                      <TableCell>{formatDate(rec.checkIn)}</TableCell>
                      <TableCell>{formatTime(rec.checkIn)}</TableCell>
                      <TableCell>
                        {rec.checkOut ? formatTime(rec.checkOut) : '-'}
                      </TableCell>
                      <TableCell>
                        {rec.workedHours ? formatHours(rec.workedHours) : '-'}
                      </TableCell>
                      <TableCell>
                        {overtime ? formatHours(overtime) : '-'}
                      </TableCell>
                      <TableCell>
                        {'-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {!rec.checkIn ? (
                            <span className="text-red-600">Not clocked in</span>
                          ) : late.isLate ? (
                            <span className="text-yellow-600">{late.status}</span>
                          ) : late.isEarly ? (
                            <span className="text-blue-600">{late.status}</span>
                          ) : (
                            <span className="text-green-600">{late.status}</span>
                          )}
                          {rec.checkOut && (
                            <>
                              <br />
                              {early?.isEarly ? (
                                <span className="text-red-600">{early.status}</span>
                              ) : early && early.status && early.status !== 'Full day' && early.status !== 'Left on time' ? (
                                <span className="text-green-600">{early.status}</span>
                              ) : null}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!attendanceData?.records ||
                  attendanceData.records.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No attendance records found
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
