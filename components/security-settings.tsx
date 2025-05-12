"use client"

import { Badge } from "@/components/ui/badge"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function SecuritySettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would call an API to change the password
    console.log("Changing password")
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" required />
            </div>
            <Button type="submit">Update Password</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="two-factor">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Receive a verification code via authenticator app or SMS</p>
            </div>
            <Switch id="two-factor" checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
          </div>

          {twoFactorEnabled && (
            <div className="rounded-md bg-muted p-4">
              <h4 className="mb-2 text-sm font-medium">Two-Factor Authentication is enabled</h4>
              <p className="text-sm text-muted-foreground">
                You will be required to enter a verification code when logging in.
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm">
                  Change Method
                </Button>
                <Button variant="outline" size="sm">
                  View Recovery Codes
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Login Sessions</CardTitle>
          <CardDescription>Manage your active login sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-medium">Current Session</h4>
                <p className="text-xs text-muted-foreground">Windows 10 • Chrome • New York, USA</p>
                <p className="text-xs text-muted-foreground">Started: Today, 10:30 AM</p>
              </div>
              <Badge variant="outline" className="text-xs">
                Active
              </Badge>
            </div>
          </div>
          <div className="rounded-md border p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-medium">Previous Session</h4>
                <p className="text-xs text-muted-foreground">macOS • Safari • New York, USA</p>
                <p className="text-xs text-muted-foreground">Last active: Yesterday, 4:15 PM</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                Revoke
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            Log Out of All Sessions
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

