import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatMonthYear } from "@/lib/utils/dateFormat"

interface ReportTableProps {
  type: "attendance" | "leave"
}

export function ReportTable({ type }: ReportTableProps) {
  // Mock data - in a real app, this would come from an API
  const attendanceData = [
    {
      id: 1,
      month: formatMonthYear(new Date(2023, 11, 1)),
      workingDays: 21,
      present: 19,
      late: 1,
      absent: 1,
      totalHours: "152h 30m",
      attendanceRate: "95.2%",
    },
    {
      id: 2,
      month: formatMonthYear(new Date(2023, 10, 1)),
      workingDays: 22,
      present: 22,
      late: 0,
      absent: 0,
      totalHours: "176h 00m",
      attendanceRate: "100%",
    },
    {
      id: 3,
      month: formatMonthYear(new Date(2023, 9, 1)),
      workingDays: 22,
      present: 21,
      late: 1,
      absent: 0,
      totalHours: "167h 45m",
      attendanceRate: "99.5%",
    },
  ]

  const leaveData = [
    {
      id: 1,
      type: "Annual Leave",
      entitled: 20,
      used: 8,
      remaining: 12,
      pending: 3,
      approved: 8,
      rejected: 0,
    },
    {
      id: 2,
      type: "Sick Leave",
      entitled: 10,
      used: 3,
      remaining: 7,
      pending: 0,
      approved: 3,
      rejected: 0,
    },
    {
      id: 3,
      type: "Personal Leave",
      entitled: 5,
      used: 1,
      remaining: 4,
      pending: 0,
      approved: 1,
      rejected: 0,
    },
  ]

  const renderAttendanceTable = () => (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Attendance Summary</CardTitle>
        <CardDescription>Detailed attendance records by month</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Working Days</TableHead>
              <TableHead>Present</TableHead>
              <TableHead>Late</TableHead>
              <TableHead>Absent</TableHead>
              <TableHead>Total Hours</TableHead>
              <TableHead>Attendance Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceData.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.month}</TableCell>
                <TableCell>{row.workingDays}</TableCell>
                <TableCell>{row.present}</TableCell>
                <TableCell>{row.late}</TableCell>
                <TableCell>{row.absent}</TableCell>
                <TableCell>{row.totalHours}</TableCell>
                <TableCell>{row.attendanceRate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

  const renderLeaveTable = () => (
    <Card>
      <CardHeader>
        <CardTitle>Leave Summary</CardTitle>
        <CardDescription>Detailed leave records by type</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Leave Type</TableHead>
              <TableHead>Entitled</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Pending</TableHead>
              <TableHead>Approved</TableHead>
              <TableHead>Rejected</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaveData.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.type}</TableCell>
                <TableCell>{row.entitled}</TableCell>
                <TableCell>{row.used}</TableCell>
                <TableCell>{row.remaining}</TableCell>
                <TableCell>{row.pending}</TableCell>
                <TableCell>{row.approved}</TableCell>
                <TableCell>{row.rejected}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

  return type === "attendance" ? renderAttendanceTable() : renderLeaveTable()
}

