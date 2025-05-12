import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export function LeaveBalanceWidget() {
  // Mock data - in a real app, this would come from an API
  const leaveTypes = [
    { type: "Annual Leave", used: 8, total: 20, color: "bg-blue-500" },
    { type: "Sick Leave", used: 3, total: 10, color: "bg-red-500" },
    { type: "Personal Leave", used: 1, total: 5, color: "bg-green-500" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Balance</CardTitle>
        <CardDescription>Track your available leave</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaveTypes.map((leave) => (
            <div key={leave.type} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{leave.type}</p>
                <p className="text-sm text-muted-foreground">
                  {leave.used} / {leave.total} days
                </p>
              </div>
              <Progress value={(leave.used / leave.total) * 100} className={`h-2 ${leave.color}`} />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Link href="/leave/apply">
          <Button>Apply for Leave</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

