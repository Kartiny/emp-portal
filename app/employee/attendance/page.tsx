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
  getDaysInMonth,
} from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { toZonedTime } from 'date-fns-tz';
import { ShiftCodes } from '@/components/ui/shift-codes';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const WORK_START_HOUR = 9; // 9 AM
const WORK_END_HOUR = 18;  // 6 PM
const STANDARD_HOURS = 12; // 7am to 7pm = 12 hours
const MALAYSIA_TZ = 'Asia/Kuala_Lumpur';

type ViewType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

interface AttendanceRecord {
  id: number;
  day?: string;
  date?: string;
  checkIn?: number | null | undefined;
  checkOut?: number | null | undefined;
  workedHours?: number;
  shiftCode?: string;
  mealIn?: number | null | undefined;
  mealOut?: number | null | undefined;
  status?: string | null;
  attn_type: string; // 'i' or 'o'
  datetime: string; // ISO string
  job_id?: any;
  machine_id?: any;
  latitude?: any;
  longitude?: any;
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

function formatTimeKL(dt: string | null | undefined) {
  if (!dt) return '-';
  try {
    // Parse as local time, do not convert timezone
    const [datePart, timePart] = dt.split(' ');
    if (!timePart) return '-';
    const [h, m] = timePart.split(':');
    return `${h}:${m}`;
  } catch {
    return '-';
  }
}

// Helper to format minutes as 'X hr Y min'
function formatHrMin(mins: number) {
  const absMins = Math.abs(Math.round(mins));
  const h = Math.floor(absMins / 60);
  const m = absMins % 60;
  if (h > 0 && m > 0) return `${h} hr ${m} min`;
  if (h > 0) return `${h} hr`;
  return `${m} min`;
}

function floatToTimeString(floatVal: number | null | undefined) {
  if (typeof floatVal !== 'number' || isNaN(floatVal)) return '-';
  const hours = Math.floor(floatVal);
  const minutes = Math.round((floatVal - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

const statusLabels: Record<string, string> = {
  ab: 'Absence',
  weekend: 'Week End',
  ph: 'Public Holiday',
  leave: 'Leave',
  medical: 'Medical',
  annual: 'Annual',
  maternity: 'Maternity',
  unpaid: 'Unpaid',
  other: 'Other Leave',
  hospital: 'Hospital',
};

export default function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [todayData, setTodayData] = useState<{
    lastClockIn: string | null;
    lastClockOut: string | null;
    start_clock_actual?: string | null;
    end_clock_actual?: string | null;
    shiftConfig?: {
      grace_period_late_in: number;
      grace_period_early_out: number;
      meal_hour_value: string;
    };
    records?: AttendanceRecord[]; // Added for parsing
    latenessMins?: number;
    latenessStr?: string;
    earlyOutMins?: number;
    earlyOutStr?: string;
    checkInMins?: number;
    checkInStatus?: string;
    mealCheckOutMins?: number;
    mealCheckOutStatus?: string;
    mealCheckInMins?: number;
    mealCheckInStatus?: string;
    checkOutMins?: number;
    checkOutStatus?: string;
    workedHours?: number; // Added for today's worked hours
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeState>({ type: 'monthly' });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date }>(
    {
      from: new Date(),
      to: new Date(),
    },
  );
  const [roster, setRoster] = useState<any>(null);
  const [rosterMonth, setRosterMonth] = useState<number>(new Date().getMonth());
  const [rosterYear, setRosterYear] = useState<number>(new Date().getFullYear());
  const [rosterLoading, setRosterLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('today');

  // Navigate period controls
  const goToPrevious = () => {
    if (dateRange.type === 'monthly') setCurrentDate((d) => subMonths(d, 1));
    if (dateRange.type === 'weekly') setCurrentDate((d) => subWeeks(d, 1));
    if (dateRange.type === 'biweekly') setCurrentDate((d) => subWeeks(d, 2));
  };
  const goToNext = () => {
    if (dateRange.type === 'monthly') setCurrentDate((d) => addMonths(d, 1));
    if (dateRange.type === 'weekly') setCurrentDate((d) => addWeeks(d, 1));
    if (dateRange.type === 'biweekly') setCurrentDate((d) => addWeeks(d, 2));
  };
  const goToCurrent = () => setCurrentDate(new Date());

  const getRangeLabel = () => {
    switch (dateRange.type) {
      case 'daily':
        return format(currentDate, 'dd MMM yyyy');
      case 'weekly': {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        return start.getMonth() === end.getMonth()
          ? `${format(start, 'dd')}–${format(end, 'dd MMM yyyy')}`
          : `${format(start, 'dd MMM')}–${format(end, 'dd MMM yyyy')}`;
      }
      case 'biweekly': {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(addWeeks(start, 1), { weekStartsOn: 1 });
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
          to: customDateRange.to.toISOString(),
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

  const fetchRoster = async () => {
    setRosterLoading(true);
    try {
      const uidStr = localStorage.getItem('uid');
      if (!uidStr) throw new Error('Not logged in');
      // Send rosterMonth + 1 to backend (1-based)
      const res = await fetch('/api/odoo/auth/attendance/shift-roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uidStr), year: rosterYear, month: rosterMonth + 1 }),
      });
      if (!res.ok) throw new Error(`(${res.status}) ${await res.text()}`);
      const data = await res.json();
      setRoster(data);
    } catch (err) {
      setRoster(null);
    } finally {
      setRosterLoading(false);
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

  useEffect(() => {
    fetchRoster();
  }, [rosterMonth, rosterYear]);

  // Status computations
  const calculateCheckInStatus = (checkIn: string, shiftStart?: string) => {
    try {
      const d = toZonedTime(new Date(checkIn), 'Asia/Kuala_Lumpur');
      const ref = new Date(d);
      if (shiftStart) {
        const [h, m] = shiftStart.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return { isLate: false, status: 'N/A' };
        ref.setHours(h, m, 0, 0);
      } else {
        ref.setHours(WORK_START_HOUR, 0, 0, 0);
      }
      const mins = differenceInMinutes(d, ref);
      if (mins <= 0) return { isLate: false, status: 'On time' };
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      if (isNaN(h) || isNaN(m)) return { isLate: true, status: 'Late in (invalid time)' };
      const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
      return { isLate: true, status: `Late in by ${timeStr}` };
    } catch {
      return { isLate: false, status: 'N/A' };
    }
  };
  const calculateCheckOutStatus = (checkOut: string, shiftEnd?: string) => {
    try {
      const d = toZonedTime(new Date(checkOut), 'Asia/Kuala_Lumpur');
      const ref = new Date(d);
      if (shiftEnd) {
        const [h, m] = shiftEnd.split(':').map(Number);
        ref.setHours(h, m, 0, 0);
      } else {
        ref.setHours(WORK_END_HOUR, 0, 0, 0);
      }
      const mins = differenceInMinutes(ref, d);
      if (mins === 0) return { isEarly: false, status: 'On time' };
      if (mins > 0) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
        return { isEarly: true, status: `Early check out by ${timeStr}` };
      }
      return { isEarly: false, status: 'On time' };
    } catch {
      return { isEarly: false, status: 'N/A' };
    }
  };
  const calculateOvertimeHours = (checkOut: string) => {
    try {
      const d = toZonedTime(new Date(checkOut), 'Asia/Kuala_Lumpur');
      const ref = new Date(d);
      ref.setHours(WORK_END_HOUR, 0, 0, 0);
      const mins = differenceInMinutes(d, ref);
      return mins > 0 ? mins / 60 : 0;
    } catch {
      return 0;
    }
  };
  const formatHours = (h: number) => `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`;

  // Compute missedClockOut
  const now = new Date();
  const missedClockOut = !!(
    todayData &&
    todayData.lastClockIn &&
    !todayData.lastClockOut &&
    todayData.end_clock_actual &&
    (() => {
      const [endHour, endMinute] = todayData.end_clock_actual.split(':').map(Number);
      return (
        now.getHours() > endHour ||
        (now.getHours() === endHour && now.getMinutes() > endMinute)
      );
    })()
  );

  // Extract firstCheckIn, firstCheckOut, secondCheckIn, secondCheckOut from todayData.records
  const firstCheckIn =
    todayData && Array.isArray(todayData.records)
      ? todayData.records.filter((r) => r.attn_type === 'i')[0]?.datetime || null
      : null;
  const firstCheckOut =
    todayData && Array.isArray(todayData.records)
      ? todayData.records.filter((r) => r.attn_type === 'o')[0]?.datetime || null
      : null;
  const secondCheckIn =
    todayData && Array.isArray(todayData.records)
      ? todayData.records.filter((r) => r.attn_type === 'i')[1]?.datetime || null
      : null;
  const secondCheckOut =
    todayData && Array.isArray(todayData.records)
      ? todayData.records.filter((r) => r.attn_type === 'o')[1]?.datetime || null
      : null;

  // Extract last clock in/out for display
  const lastClockIn =
    todayData && Array.isArray(todayData.records)
      ? [...todayData.records].reverse().find((r) => r.attn_type === 'i')?.datetime || null
      : null;
  const lastClockOut =
    todayData && Array.isArray(todayData.records)
      ? [...todayData.records].reverse().find((r) => r.attn_type === 'o')?.datetime || null
      : null;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p>Loading attendance data...</p>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">Today's Attendance</TabsTrigger>
            <TabsTrigger value="summary">Attendance Summary</TabsTrigger>
            <TabsTrigger value="rosters">Shift Rosters</TabsTrigger>
          </TabsList>
          
          <TabsContent value="today">
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance</CardTitle>
                <CardDescription>Clock in/out and status overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: AttendanceWidget */}
                  <div className="flex flex-col justify-center">
                    <AttendanceWidget 
                      today={todayData} 
                      shift={todayData?.shiftInfo || null} 
                      onUpdate={fetchTodayAttendance} 
                    />
                  </div>
                  {/* Right: Statuses */}
                  <div className="flex flex-col justify-center">
                    {todayData ? (
                      <div className="space-y-4">
                        {/* Check-in Status */}
                        <div>
                          <p className="text-sm font-semibold">Check-in Status</p>
                          <p
                            className={
                              todayData.checkInMins && todayData.checkInMins > 0
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }
                          >
                            {todayData.checkInStatus || 'N/A'}
                          </p>
                        </div>
                        {/* Meal Check Out Status */}
                        <div>
                          <p className="text-sm font-semibold">Meal Check Out Status</p>
                          <p
                            className={
                              todayData.mealCheckOutMins && todayData.mealCheckOutMins !== 0
                                ? todayData.mealCheckOutMins > 0
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                                : 'text-green-600'
                            }
                          >
                            {todayData.mealCheckOutStatus || 'N/A'}
                          </p>
                        </div>
                        {/* Meal Check In Status */}
                        <div>
                          <p className="text-sm font-semibold">Meal Check In Status</p>
                          <p
                            className={
                              todayData.mealCheckInMins && todayData.mealCheckInMins !== 0
                                ? todayData.mealCheckInMins > 0
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                                : 'text-green-600'
                            }
                          >
                            {todayData.mealCheckInStatus || 'N/A'}
                          </p>
                        </div>
                        {/* Check-out Status */}
                        <div>
                          <p className="text-sm font-semibold">Check-out Status</p>
                          <p
                            className={
                              todayData.checkOutMins && todayData.checkOutMins > 0
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }
                          >
                            {todayData.checkOutStatus || 'N/A'}
                          </p>
                        </div>
                        {/* Overtime (leave as is) */}
                        {secondCheckOut && calculateOvertimeHours(secondCheckOut) > 0 && (
                          <div>
                            <p className="text-sm font-semibold">Overtime</p>
                            <p className="text-blue-600">
                              {(() => {
                                // Use Math.floor for overtime hours
                                const ot = calculateOvertimeHours(secondCheckOut);
                                const h = Math.floor(ot);
                                const m = Math.floor((ot % 1) * 60);
                                return `${h}h ${m}m`;
                              })()}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No attendance recorded for today</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="summary">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm">Total Hours</p>
                    <p className="text-xl lg:text-2xl font-bold">{attendanceData?.totalHours.toFixed(1)}h</p>
                  </div>
                  <div>
                    <p className="text-sm">Attendance Rate</p>
                    <p className="text-xl lg:text-2xl font-bold">{attendanceData?.rate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-4 py-2 px-4 bg-[#1d1a4e] rounded-lg">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPrevious}
                  disabled={dateRange.type === 'daily' || dateRange.type === 'custom'}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={goToCurrent} className="text-sm lg:text-base">
                  {getRangeLabel()}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNext}
                  disabled={
                    dateRange.type === 'daily' ||
                    dateRange.type === 'custom' ||
                    format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  }
                >
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
            </div>
            
            {/* Records Table */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
                <CardDescription>Your attendance history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs lg:text-sm">Day</TableHead>
                        <TableHead className="text-xs lg:text-sm">Date</TableHead>
                        <TableHead className="text-xs lg:text-sm">Shift Code</TableHead>
                        <TableHead className="text-xs lg:text-sm">Approved OT Hours</TableHead>
                        <TableHead className="text-xs lg:text-sm">Check In</TableHead>
                        <TableHead className="text-xs lg:text-sm">Check Out</TableHead>
                        <TableHead className="text-xs lg:text-sm">Meal In</TableHead>
                        <TableHead className="text-xs lg:text-sm">Meal Out</TableHead>
                        <TableHead className="text-xs lg:text-sm">Worked Hours</TableHead>
                        <TableHead className="text-xs lg:text-sm">Total OT</TableHead>
                        <TableHead className="text-xs lg:text-sm">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceData?.records.map((rec) => (
                        <TableRow key={rec.id}>
                          <TableCell className="text-xs lg:text-sm">{rec.day}</TableCell>
                          <TableCell className="text-xs lg:text-sm">{formatDate(rec.date || '')}</TableCell>
                          <TableCell className="text-xs lg:text-sm">{rec.shiftCode || '-'}</TableCell>
                          <TableCell className="text-xs lg:text-sm"></TableCell>
                          <TableCell className="text-xs lg:text-sm">{floatToTimeString(rec.checkIn)}</TableCell>
                          <TableCell className="text-xs lg:text-sm">{floatToTimeString(rec.checkOut)}</TableCell>
                          <TableCell className="text-xs lg:text-sm">{floatToTimeString(rec.mealIn)}</TableCell>
                          <TableCell className="text-xs lg:text-sm">{floatToTimeString(rec.mealOut)}</TableCell>
                          <TableCell className="text-xs lg:text-sm">{rec.workedHours ? formatHours(rec.workedHours) : '-'}</TableCell>
                          <TableCell className="text-xs lg:text-sm"></TableCell>
                          <TableCell className="text-xs lg:text-sm">
                            {rec.status && typeof rec.status === 'string' && statusLabels[rec.status]
                              ? statusLabels[rec.status]
                              : rec.status || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!attendanceData?.records || attendanceData.records.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center text-xs lg:text-sm">
                            No attendance records found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rosters">
            <Card>
              <CardHeader>
                <CardTitle>Shift Rosters</CardTitle>
                <CardDescription>View your assigned shifts and rosters here.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
                  <Select value={String(rosterMonth)} onValueChange={(v) => setRosterMonth(Number(v))}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {format(new Date(2000, i, 1), 'MMMM')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(rosterYear)} onValueChange={(v) => setRosterYear(Number(v))}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const y = new Date().getFullYear() - 2 + i;
                        return <SelectItem key={y} value={String(y)}>{y}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {rosterLoading ? (
                  <div>Loading shift roster...</div>
                ) : roster && roster.assigned === false ? (
                  <div className="text-red-600">No duty roster assigned for this month.</div>
                ) : roster && roster.assigned === true && roster.days ? (
                  <>
                    <div className="overflow-x-auto mb-8">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {roster.days.map((day: any, i: number) => (
                              <TableHead key={i} className="text-center text-xs lg:text-sm">{`Day${day.day}`}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            {roster.days.map((day: any, i: number) => {
                              const dateObj = new Date(roster.year, roster.month - 1, day.day);
                              const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                              return (
                                <TableCell key={i} className="text-center text-xs lg:text-sm">
                                  <div>{weekday}</div>
                                  <div className="font-semibold">{day.code || '-'}</div>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : roster && roster.assigned === true && !roster.days ? (
                  <div className="text-muted-foreground">No shift data for this month.</div>
                ) : (
                  <div className="text-muted-foreground">No shift roster found for this month.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}