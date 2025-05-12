import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface LeaveApplicationsProps {
  status: "pending" | "approved" | "history"
}

export function LeaveApplications({ status }: LeaveApplicationsProps) {
  // Mock data - in a real app, this would come from an API based on the status
  const pendingApplications = [
    {
      id: 1,
      type: "Annual Leave",
      startDate: "Dec 24, 2023",
      endDate: "Dec 26, 2023",
      days: 3,
      reason: "Holiday vacation",
      status: "Pending",
      appliedOn: "Dec 10, 2023",
    },
  ]

  const approvedApplications = [
    {
      id: 2,
      type: "Sick Leave",
      startDate: "Nov 15, 2023",
      endDate: "Nov 16, 2023",
      days: 2,
      reason: "Medical appointment",
      status: "Approved",
      appliedOn: "Nov 14, 2023",
      approvedOn: "Nov 14, 2023",
    },
    {
      id: 3,
      type: "Personal Leave",
      startDate: "Oct 20, 2023",
      endDate: "Oct 20, 2023",
      days: 1,
      reason: "Family event",
      status: "Approved",
      appliedOn: "Oct 15, 2023",
      approvedOn: "Oct 16, 2023",
    },
  ]

  const historyApplications = [
    ...approvedApplications,
    {
      id: 4,
      type: "Annual Leave",
      startDate: "Sep 5, 2023",
      endDate: "Sep 8, 2023",
      days: 4,
      reason: "Summer vacation",
      status: "Completed",
      appliedOn: "Aug 20, 2023",
      approvedOn: "Aug 22, 2023",
    },
    {
      id: 5,
      type: "Sick Leave",
      startDate: "Jul 10, 2023",
      endDate: "Jul 10, 2023",
      days: 1,
      reason: "Not feeling well",
      status: "Completed",
      appliedOn: "Jul 10, 2023",
      approvedOn: "Jul 10, 2023",
    },
  ]

  let applications = []
  let title = ""
  let description = ""

  if (status === "pending") {
    applications = pendingApplications
    title = "Pending Applications"
    description = "Leave applications awaiting approval"
  } else if (status === "approved") {
    applications = approvedApplications
    title = "Approved Applications"
    description = "Leave applications that have been approved"
  } else {
    applications = historyApplications
    title = "Leave History"
    description = "All leave applications"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">No leave applications found</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                {status === "pending" && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>{application.type}</TableCell>
                  <TableCell>
                    {application.startDate} to {application.endDate}
                  </TableCell>
                  <TableCell>{application.days}</TableCell>
                  <TableCell>{application.reason}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        application.status === "Pending"
                          ? "outline"
                          : application.status === "Approved"
                            ? "secondary"
                            : "default"
                      }
                    >
                      {application.status}
                    </Badge>
                  </TableCell>
                  {status === "pending" && (
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Cancel
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

