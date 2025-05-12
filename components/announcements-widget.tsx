import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AnnouncementsWidget() {
  // Mock data - in a real app, this would come from an API
  const announcements = [
    {
      id: 1,
      title: "Holiday Schedule",
      date: "Dec 15, 2023",
      content: "The office will be closed from December 24th to January 1st for the holiday season.",
    },
    {
      id: 2,
      title: "New Attendance Policy",
      date: "Dec 10, 2023",
      content: "Starting January, flexible work hours will be implemented. Check your email for details.",
    },
    {
      id: 3,
      title: "System Maintenance",
      date: "Dec 5, 2023",
      content: "The HR system will undergo maintenance on December 18th from 10 PM to 2 AM.",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Announcements</CardTitle>
        <CardDescription>Latest updates from HR</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{announcement.title}</h4>
                <p className="text-xs text-muted-foreground">{announcement.date}</p>
              </div>
              <p className="text-sm">{announcement.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

