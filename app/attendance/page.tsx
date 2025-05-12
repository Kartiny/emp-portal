'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AttendanceWidget from '@/components/attendance-widget';
import { formatDate, formatTime, formatMonthYear } from '@/lib/utils/dateFormat';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { DateRange } from '@/lib/odooXml';
import { addMonths, addWeeks, subMonths, subWeeks, format, startOfWeek, endOfWeek } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { differenceInMinutes, parseISO, setHours, setMinutes, setSeconds } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const WORK_START_HOUR = 7;  // 7 AM
const WORK_END_HOUR = 19;   // 7 PM
const STANDARD_HOURS = 12; // 7am to 7pm = 12 hours

interface AttendanceRecord {
  id: number;
  checkIn: string;
  checkOut: string | null;
  workedHours: number;
  overtimeHours: number;
  lateMinutes: number;
  earlyMinutes: number;
}

interface AttendanceData {
  totalHours: number;
  rate: number;
  records: AttendanceRecord[];
  dateRange?: {
    start: string;
    end: string;
  };
}

type ViewType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

interface DateRangeState {
  type: ViewType;
  weekNumber?: number;  // For weekly/biweekly views
  customRange?: {
    from: Date;
    to: Date;
  };
}

export default function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [todayData, setTodayData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeState>({ type: 'monthly' });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: new Date()
  });

  const goToPrevious = () => {
    switch (dateRange.type) {
      case 'monthly':
        setCurrentDate(prev => subMonths(prev, 1));
        break;
      case 'weekly':
        setCurrentDate(prev => subWeeks(prev, 1));
        break;
      case 'biweekly':
        setCurrentDate(prev => subWeeks(prev, 2));
        break;
    }
  };

  const goToNext = () => {
    switch (dateRange.type) {
      case 'monthly':
        setCurrentDate(prev => addMonths(prev, 1));
        break;
      case 'weekly':
        setCurrentDate(prev => addWeeks(prev, 1));
        break;
      case 'biweekly':
        setCurrentDate(prev => addWeeks(prev, 2));
        break;
    }
  };

  const goToCurrent = () => {
    setCurrentDate(new Date());
  };

  const getRangeLabel = () => {
    switch (dateRange.type) {
      case 'daily':
        return format(currentDate, 'dd MMM yyyy');
      case 'weekly': {
        // Start from Monday of the current week
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        // End on Sunday
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        // If same month
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${format(weekStart, 'dd')} - ${format(weekEnd, 'dd MMM yyyy')}`;
        }
        // If different months
        return `${format(weekStart, 'dd MMM')} - ${format(weekEnd, 'dd MMM yyyy')}`;
      }
      case 'biweekly': {
        // Start from Monday of the current week
        const biWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        // End after two weeks on Sunday
        const biWeekEnd = endOfWeek(addWeeks(biWeekStart, 1), { weekStartsOn: 1 });
        // If same month
        if (biWeekStart.getMonth() === biWeekEnd.getMonth()) {
          return `${format(biWeekStart, 'dd')} - ${format(biWeekEnd, 'dd MMM yyyy')}`;
        }
        // If different months
        return `${format(biWeekStart, 'dd MMM')} - ${format(biWeekEnd, 'dd MMM yyyy')}`;
      }
      case 'custom':
        if (customDateRange.from && customDateRange.to) {
          if (customDateRange.from.getMonth() === customDateRange.to.getMonth()) {
            return `${format(customDateRange.from, 'dd')} - ${format(customDateRange.to, 'dd MMM yyyy')}`;
          }
          return `${format(customDateRange.from, 'dd MMM')} - ${format(customDateRange.to, 'dd MMM yyyy')}`;
        }
        return 'Custom Range';
      default:
        return formatMonthYear(currentDate);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const uid = localStorage.getItem('uid');
      if (!uid) {
        setError('Not logged in');
        return;
      }

      const res = await fetch('/api/attendance/today', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: Number(uid) }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch today\'s attendance');
      }

      const data = await res.json();
      setTodayData(data);
    } catch (err) {
      console.error('Error fetching today\'s attendance:', err);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
    
    // Refresh today's attendance every minute
    const interval = setInterval(fetchTodayAttendance, 60000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const rawUid = localStorage.getItem('uid');
    if (!rawUid) {
      setError('Not logged in');
      setLoading(false);
      return;
    }
    const uid = Number(rawUid);

    const fetchData = async () => {
      try {
        const res = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            uid, 
            range: dateRange.type,
            customDate: currentDate.toISOString(),
            ...(dateRange.type === 'custom' && {
              customRange: {
                from: customDateRange.from.toISOString(),
                to: customDateRange.to.toISOString()
              }
            })
          }),
        });
        const data = await res.json();
        console.log("✅ API response:", data);
    
        if (data.error) {
          setError(data.error);
        } else {
          setAttendanceData(data);
        }
      } catch (err) {
        console.error('❌ Attendance fetch error:', err);
        setError('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };    

    fetchData();
  }, [dateRange.type, currentDate, customDateRange]);

  const calculateLateStatus = (checkInTime: string) => {
    try {
      if (!checkInTime) {
        console.log('No check-in time provided');
        return {
          isLate: false,
          status: 'Status unavailable',
          minutes: 0
        };
      }

      console.log('Calculating late status for:', checkInTime);
      
      // Convert to Malaysia timezone first
      const checkInDate = toZonedTime(new Date(checkInTime), 'Asia/Kuala_Lumpur');
      console.log('Check-in time in Malaysia timezone:', checkInDate);
      
      // Create expected check-in time (7 AM on the same day)
      const expectedCheckIn = new Date(checkInDate);
      expectedCheckIn.setHours(WORK_START_HOUR, 0, 0, 0);
      
      // If check-in is exactly at 7 AM
      if (checkInDate.getHours() === WORK_START_HOUR && checkInDate.getMinutes() === 0) {
        return {
          isLate: false,
          status: 'On time',
          minutes: 0
        };
      }
      
      // If check-in is after 7 AM
      if (checkInDate.getHours() > WORK_START_HOUR || 
          (checkInDate.getHours() === WORK_START_HOUR && checkInDate.getMinutes() > 0)) {
        const lateMinutes = differenceInMinutes(checkInDate, expectedCheckIn);
        
        if (lateMinutes < 60) {
          return {
            isLate: true,
            status: `Checked in late by ${lateMinutes} minutes`,
            minutes: lateMinutes
          };
        } else {
          const hours = Math.floor(lateMinutes / 60);
          const mins = lateMinutes % 60;
          return {
            isLate: true,
            status: `Checked in late by ${hours}h ${mins}m`,
            minutes: lateMinutes
          };
        }
      }
      
      return {
        isLate: false,
        status: 'On time',
        minutes: 0
      };
    } catch (error) {
      console.error('Error calculating late status:', error, 'for time:', checkInTime);
      return {
        isLate: false,
        status: 'Status unavailable',
        minutes: 0
      };
    }
  };

  const calculateEarlyLeaveStatus = (checkOutTime: string, checkInStatus: { isLate: boolean }) => {
    try {
      console.log('Calculating early leave for:', checkOutTime);
      
      // Create actual check-out time
      const checkOutDate = new Date(checkOutTime);
      if (isNaN(checkOutDate.getTime())) {
        throw new Error(`Invalid date format: ${checkOutTime}`);
      }
      
      // Convert to Malaysia timezone
      const malaysiaDate = new Date(checkOutDate.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
      
      // Create expected check-out time (7 PM on the same day)
      const expectedCheckOut = new Date(malaysiaDate);
      expectedCheckOut.setHours(WORK_END_HOUR, 0, 0, 0);
      
      // If check-out is exactly at 7 PM
      if (malaysiaDate.getHours() === WORK_END_HOUR && malaysiaDate.getMinutes() === 0) {
        return {
          isEarly: false,
          status: checkInStatus.isLate ? 'Left on time' : 'Completed full day',
          minutes: 0
        };
      }
      
      // If check-out is after 7 PM, it's overtime
      if (malaysiaDate.getHours() > WORK_END_HOUR || 
          (malaysiaDate.getHours() === WORK_END_HOUR && malaysiaDate.getMinutes() > 0)) {
        return {
          isEarly: false,
          status: checkInStatus.isLate ? 'Worked overtime' : 'Completed full day with overtime',
          minutes: 0
        };
      }
      
      // If check-out is before 7 PM, calculate how early
      const earlyMinutes = differenceInMinutes(expectedCheckOut, malaysiaDate);
      if (earlyMinutes < 60) {
        return {
          isEarly: true,
          status: `Left early by ${earlyMinutes} minutes`,
          minutes: earlyMinutes
        };
      } else {
        const hours = Math.floor(earlyMinutes / 60);
        const mins = earlyMinutes % 60;
        return {
          isEarly: true,
          status: `Left early by ${hours}h ${mins}m`,
          minutes: earlyMinutes
        };
      }
    } catch (error) {
      console.error('Error calculating early leave status:', error, 'for time:', checkOutTime);
      return {
        isEarly: false,
        status: 'Status unavailable',
        minutes: 0
      };
    }
  };

  const calculateOvertimeHours = (checkOut: string) => {
    try {
      console.log('Calculating overtime for:', checkOut);
      
      // Create actual check-out time
      const checkOutDate = new Date(checkOut);
      if (isNaN(checkOutDate.getTime())) {
        throw new Error(`Invalid date format: ${checkOut}`);
      }
      
      // Convert to Malaysia timezone
      const malaysiaDate = new Date(checkOutDate.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
      
      // Create expected check-out time (7 PM on the same day)
      const expectedCheckOut = new Date(malaysiaDate);
      expectedCheckOut.setHours(WORK_END_HOUR, 0, 0, 0);
      
      // If check-out is after 7 PM, calculate overtime
      if (malaysiaDate > expectedCheckOut) {
        const overtimeMinutes = differenceInMinutes(malaysiaDate, expectedCheckOut);
        return overtimeMinutes / 60;  // Convert to hours
      }
      
      return 0;  // No overtime
    } catch (error) {
      console.error('Error calculating overtime:', error, 'for time:', checkOut);
      return 0;
    }
  };

  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const safeFormatDate = (dateStr: string) => {
    try {
      return formatDate(dateStr);
    } catch (error) {
      console.error('Error formatting date:', dateStr, error);
      return 'Invalid Date';
    }
  };

  const safeFormatTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return formatTime(dateStr);
    } catch (error) {
      console.error('Error formatting time:', dateStr, error);
      return 'Invalid Time';
    }
  };

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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">View and manage your attendance records</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AttendanceWidget />
          
          <Card>
            <CardHeader>
              <CardTitle>Today's Attendance</CardTitle>
              <CardDescription>Current attendance status</CardDescription>
            </CardHeader>
            <CardContent>
              {todayData?.lastClockIn && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Check-in Status</p>
                    <p className={`text-lg ${calculateLateStatus(todayData.lastClockIn).isLate ? 'text-yellow-600' : 'text-green-600'}`}>
                      {calculateLateStatus(todayData.lastClockIn).status}
                    </p>
                  </div>
                  
                  {todayData.lastClockOut && (
                    <>
                      <div>
                        <p className="text-sm font-medium">Check-out Status</p>
                        {(() => {
                          const lateStatus = calculateLateStatus(todayData.lastClockIn);
                          const earlyStatus = calculateEarlyLeaveStatus(todayData.lastClockOut, lateStatus);
                          return (
                            <p className={`text-lg ${earlyStatus.isEarly ? 'text-red-600' : 'text-green-600'}`}>
                              {earlyStatus.status}
                            </p>
                          );
                        })()}
                      </div>
                      {calculateOvertimeHours(todayData.lastClockOut) > 0 && (
                        <div>
                          <p className="text-sm font-medium">Overtime</p>
                          <p className="text-lg text-blue-600">
                            {formatHours(calculateOvertimeHours(todayData.lastClockOut))}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              {!todayData?.lastClockIn && (
                <div className="text-muted-foreground">
                  No attendance recorded for today
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
            <CardDescription>
              {attendanceData?.dateRange ? 
                `Attendance statistics from ${formatDate(attendanceData.dateRange.start)} to ${formatDate(attendanceData.dateRange.end)}` :
                'Your attendance statistics'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Total Hours</p>
                <p className="text-2xl font-bold">{attendanceData?.totalHours.toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-sm font-medium">Attendance Rate</p>
                <p className="text-2xl font-bold">{attendanceData?.rate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 py-2 px-4 bg-[#1d1a4e] rounded-lg text-black">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              disabled={dateRange.type === 'daily' || dateRange.type === 'custom'}
              className="hover:bg-white/90 border-white/20 bg-white text-black disabled:text-black/50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="min-w-[140px] hover:bg-white/90 border-white/20 bg-white text-black"
              onClick={goToCurrent}
            >
              {getRangeLabel()}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              disabled={dateRange.type === 'daily' || dateRange.type === 'custom' || 
                format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
              className="hover:bg-white/90 border-white/20 bg-white text-black disabled:text-black/50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Select 
            value={dateRange.type} 
            onValueChange={(value: ViewType) => {
              setDateRange({ type: value });
              if (value !== 'custom') {
                setCurrentDate(new Date());
              }
            }}
          >
            <SelectTrigger className="w-[140px] border-white/20 text-black bg-white hover:bg-white/90 focus:ring-white/20">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent className="bg-white text-black">
              <SelectItem value="daily" className="text-black hover:bg-gray-100">Daily View</SelectItem>
              <SelectItem value="weekly" className="text-black hover:bg-gray-100">Weekly View</SelectItem>
              <SelectItem value="biweekly" className="text-black hover:bg-gray-100">Bi-Weekly View</SelectItem>
              <SelectItem value="monthly" className="text-black hover:bg-gray-100">Monthly View</SelectItem>
              <SelectItem value="custom" className="text-black hover:bg-gray-100">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {dateRange.type === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="hover:bg-white/90 border-white/20 bg-white text-black"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Select Dates
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="range"
                  selected={{
                    from: customDateRange.from,
                    to: customDateRange.to
                  }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setCustomDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>

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
                  <TableHead>Hours Worked</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData?.records.map((record) => {
                  const lateStatus = calculateLateStatus(record.checkIn);
                  const earlyStatus = record.checkOut ? calculateEarlyLeaveStatus(record.checkOut, lateStatus) : null;
                  const overtimeHours = record.checkOut ? calculateOvertimeHours(record.checkOut) : 0;

                  return (
                    <TableRow key={record.id}>
                      <TableCell>{safeFormatDate(record.checkIn)}</TableCell>
                      <TableCell>{safeFormatTime(record.checkIn)}</TableCell>
                      <TableCell>{safeFormatTime(record.checkOut)}</TableCell>
                      <TableCell>{record.workedHours ? formatHours(record.workedHours) : '-'}</TableCell>
                      <TableCell>{overtimeHours > 0 ? formatHours(overtimeHours) : '-'}</TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {lateStatus.isLate && (
                            <div className="text-yellow-600">{lateStatus.status}</div>
                          )}
                          {earlyStatus?.isEarly && (
                            <div className="text-red-600">{earlyStatus.status}</div>
                          )}
                          {!lateStatus.isLate && (!earlyStatus?.isEarly) && (
                            <div className="text-green-600">{earlyStatus?.status || 'On time'}</div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!attendanceData?.records || attendanceData.records.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">No attendance records found</TableCell>
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