"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode } from "lucide-react"

interface TwoFactorSetupProps {
  onComplete: () => void
}

export function TwoFactorSetup({ onComplete }: TwoFactorSetupProps) {
  const [method, setMethod] = useState<"app" | "sms">("app")
  const [code, setCode] = useState("")
  const [phone, setPhone] = useState("")

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    onComplete()
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium">Set Up Two-Factor Authentication</h3>
        <p className="text-sm text-muted-foreground">Secure your account with two-factor authentication</p>
      </div>
      <Tabs defaultValue="app" onValueChange={(value) => setMethod(value as "app" | "sms")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="app">Authenticator App</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
        </TabsList>
        <TabsContent value="app" className="space-y-4">
          <div className="flex justify-center py-4">
            <div className="border p-4 inline-flex items-center justify-center">
              <QrCode size={150} />
            </div>
          </div>
          <p className="text-sm text-center text-muted-foreground">Scan this QR code with your authenticator app</p>
          <div className="space-y-2">
            <Label htmlFor="app-code">Verification Code</Label>
            <Input
              id="app-code"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
            />
          </div>
          <Button onClick={handleVerify} className="w-full">
            Verify
          </Button>
        </TabsContent>
        <TabsContent value="sms" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+1 (555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <Button onClick={() => {}} className="w-full">
            Send Code
          </Button>
          <div className="space-y-2">
            <Label htmlFor="sms-code">Verification Code</Label>
            <Input
              id="sms-code"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
            />
          </div>
          <Button onClick={handleVerify} className="w-full">
            Verify
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  )
}

