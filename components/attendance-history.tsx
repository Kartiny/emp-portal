import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDateLong, formatMonthYear, formatDate } from "@/lib/utils/dateFormat"

interface AttendanceHistoryProps {
  view: "daily" | "weekly" | "monthly"
  date?: Date
}

export function AttendanceHistory({ view, date = new Date() }: AttendanceHistoryProps) {
  // Mock data - in a real app, this would come from an API based on the view and date
  const dailyRecords = [
    { id: 1, type: "Clock In", time: "08:30 AM", location: "Office" },
    { id: 2, type: "Break Start", time: "12:00 PM", location: "Office" },
    { id: 3, type: "Break End", time: "01:00 PM", location: "Office" },
    { id: 4, type: "Clock Out", time: "05:30 PM", location: "Office" },
  ]

  const weeklyRecords = [
    { id: 1, date: formatDate(new Date(2023, 11, 11)), clockIn: "08:30 AM", clockOut: "05:30 PM", totalHours: "8h 00m", status: "Present" },
    { id: 2, date: formatDate(new Date(2023, 11, 12)), clockIn: "08:45 AM", clockOut: "05:45 PM", totalHours: "8h 00m", status: "Present" },
    { id: 3, date: formatDate(new Date(2023, 11, 13)), clockIn: "08:15 AM", clockOut: "05:30 PM", totalHours: "8h 15m", status: "Present" },
    { id: 4, date: formatDate(new Date(2023, 11, 14)), clockIn: "08:30 AM", clockOut: "05:30 PM", totalHours: "8h 00m", status: "Present" },
    { id: 5, date: formatDate(new Date(2023, 11, 15)), clockIn: "08:30 AM", clockOut: "04:30 PM", totalHours: "7h 00m", status: "Present" },
    { id: 6, date: formatDate(new Date(2023, 11, 16)), clockIn: "-", clockOut: "-", totalHours: "-", status: "Weekend" },
    { id: 7, date: formatDate(new Date(2023, 11, 17)), clockIn: "-", clockOut: "-", totalHours: "-", status: "Weekend" },
  ]

  const monthlyRecords = [
    { id: 1, week: "Dec 4 - Dec 10", daysPresent: 5, daysAbsent: 0, totalHours: "40h 15m", overtime: "0h 15m" },
    { id: 2, week: "Dec 11 - Dec 17", daysPresent: 5, daysAbsent: 0, totalHours: "39h 15m", overtime: "0h 00m" },
    { id: 3, week: "Dec 18 - Dec 24", daysPresent: 5, daysAbsent: 0, totalHours: "40h 00m", overtime: "0h 00m" },
    { id: 4, week: "Dec 25 - Dec 31", daysPresent: 3, daysAbsent: 2, totalHours: "24h 00m", overtime: "0h 00m" },
  ]

  const renderDailyView = () => (
    <Card>
      <CardHeader>
        <CardTitle>Daily Attendance</CardTitle>
        <CardDescription>{formatDateLong(date)}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dailyRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.type}</TableCell>
                <TableCell>{record.time}</TableCell>
                <TableCell>{record.location}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

  const renderWeeklyView = () => (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Attendance</CardTitle>
        <CardDescription>Week of {formatDateLong(date)}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Clock In</TableHead>
              <TableHead>Clock Out</TableHead>
              <TableHead>Total Hours</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weeklyRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.date}</TableCell>
                <TableCell>{record.clockIn}</TableCell>
                <TableCell>{record.clockOut}</TableCell>
                <TableCell>{record.totalHours}</TableCell>
                <TableCell>{record.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

  const renderMonthlyView = () => (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Attendance</CardTitle>
        <CardDescription>{formatMonthYear(date)}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Week</TableHead>
              <TableHead>Days Present</TableHead>
              <TableHead>Days Absent</TableHead>
              <TableHead>Total Hours</TableHead>
              <TableHead>Overtime</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthlyRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.week}</TableCell>
                <TableCell>{record.daysPresent}</TableCell>
                <TableCell>{record.daysAbsent}</TableCell>
                <TableCell>{record.totalHours}</TableCell>
                <TableCell>{record.overtime}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

  if (view === "daily") return renderDailyView()
  if (view === "weekly") return renderWeeklyView()
  return renderMonthlyView()
}

