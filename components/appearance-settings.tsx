"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTheme } from "next-themes"

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize the appearance of the application</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Theme</h3>
          <RadioGroup value={theme} onValueChange={setTheme} className="grid grid-cols-3 gap-4">
            <div>
              <RadioGroupItem value="light" id="theme-light" className="sr-only" />
              <Label
                htmlFor="theme-light"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
              >
                <div className="mb-2 rounded-md bg-white p-2 shadow-sm">
                  <div className="space-y-2">
                    <div className="h-2 w-[80px] rounded-lg bg-[#eaeaea]" />
                    <div className="h-2 w-[100px] rounded-lg bg-[#eaeaea]" />
                  </div>
                </div>
                <span className="block w-full text-center">Light</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
              <Label
                htmlFor="theme-dark"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
              >
                <div className="mb-2 rounded-md bg-slate-950 p-2 shadow-sm">
                  <div className="space-y-2">
                    <div className="h-2 w-[80px] rounded-lg bg-slate-800" />
                    <div className="h-2 w-[100px] rounded-lg bg-slate-800" />
                  </div>
                </div>
                <span className="block w-full text-center">Dark</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="system" id="theme-system" className="sr-only" />
              <Label
                htmlFor="theme-system"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
              >
                <div className="mb-2 rounded-md bg-gradient-to-r from-white to-slate-950 p-2 shadow-sm">
                  <div className="space-y-2">
                    <div className="h-2 w-[80px] rounded-lg bg-gradient-to-r from-[#eaeaea] to-slate-800" />
                    <div className="h-2 w-[100px] rounded-lg bg-gradient-to-r from-[#eaeaea] to-slate-800" />
                  </div>
                </div>
                <span className="block w-full text-center">System</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Font Size</h3>
          <RadioGroup defaultValue="medium" className="grid grid-cols-3 gap-4">
            <div>
              <RadioGroupItem value="small" id="font-small" className="sr-only" />
              <Label
                htmlFor="font-small"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
              >
                <span className="text-sm">Aa</span>
                <span className="block w-full text-center">Small</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="medium" id="font-medium" className="sr-only" />
              <Label
                htmlFor="font-medium"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
              >
                <span className="text-base">Aa</span>
                <span className="block w-full text-center">Medium</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="large" id="font-large" className="sr-only" />
              <Label
                htmlFor="font-large"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
              >
                <span className="text-lg">Aa</span>
                <span className="block w-full text-center">Large</span>
              </Label>
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

