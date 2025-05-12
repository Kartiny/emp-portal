"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function NotificationSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose how you want to be notified</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Email Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-attendance">Attendance Updates</Label>
                <p className="text-sm text-muted-foreground">Receive notifications about your attendance records</p>
              </div>
              <Switch id="email-attendance" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-leave">Leave Applications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about your leave application status
                </p>
              </div>
              <Switch id="email-leave" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-announcements">Announcements</Label>
                <p className="text-sm text-muted-foreground">Receive important announcements from HR</p>
              </div>
              <Switch id="email-announcements" defaultChecked />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Push Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-attendance">Attendance Reminders</Label>
                <p className="text-sm text-muted-foreground">Receive reminders to clock in and out</p>
              </div>
              <Switch id="push-attendance" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-leave">Leave Updates</Label>
                <p className="text-sm text-muted-foreground">Receive updates about your leave applications</p>
              </div>
              <Switch id="push-leave" defaultChecked />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notification Frequency</h3>
          <RadioGroup defaultValue="immediately">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="immediately" id="immediately" />
              <Label htmlFor="immediately">Immediately</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="daily" id="daily" />
              <Label htmlFor="daily">Daily Digest</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="weekly" id="weekly" />
              <Label htmlFor="weekly">Weekly Digest</Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button>Save Preferences</Button>
      </CardFooter>
    </Card>
  )
}

