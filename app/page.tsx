import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VersionBadge } from "@/components/version-badge"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-20 items-center px-8">
          <div className="flex items-center space-x-4">
            <Image
              src="/logo.png"
              alt="KPRJ Logo"
              width={100}
              height={100}
              className="rounded-lg"
            />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl">
                  KPRJ Management System
                </h3>
              </div>
              <div className="space-x-4">
                <Link href="/login">
                  <Button size="lg" className="bg-[#1d1a4e] text-white hover:bg-[#1d1a4e]/90 text-lg px-8 py-6">Login</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Tracking</CardTitle>
                  <CardDescription>Clock in and out with ease</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Track your work hours accurately with our simple clock in/out system. View your attendance history
                    and statistics.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Leave Management</CardTitle>
                  <CardDescription>Apply for leave and track status</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Apply for various types of leave, check your leave balance, and track approval status all in one
                    place.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Secure Access</CardTitle>
                  <CardDescription>Two-factor authentication</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Enhanced security with two-factor authentication ensures your attendance data remains secure and
                    tamper-proof.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-end justify-end gap-4 md:h-24 md:flex-row">
          <p className="text-sm leading-loose text-muted-foreground">
            &copy; {new Date().getFullYear()} KPRJ Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

