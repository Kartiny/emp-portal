import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function RecentActivitiesWidget() {
  // Mock data - in a real app, this would come from an API
  const activities = [
    {
      id: 1,
      type: "Clock In",
      time: "Today, 08:30 AM",
      description: "You clocked in for the day",
    },
    {
      id: 2,
      type: "Leave Application",
      time: "Yesterday, 04:15 PM",
      description: "You applied for annual leave (Dec 24-26)",
    },
    {
      id: 3,
      type: "Clock Out",
      time: "Yesterday, 05:30 PM",
      description: "You clocked out for the day",
    },
    {
      id: 4,
      type: "Clock In",
      time: "Yesterday, 08:45 AM",
      description: "You clocked in for the day",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
        <CardDescription>Your recent attendance and leave activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 rounded-lg border p-3">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{activity.type}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
                <p className="text-sm">{activity.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

