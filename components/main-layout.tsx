"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Calendar, Clock, FileText, Home, LogOut, Menu, Receipt, Settings, User, MessageCircle } from "lucide-react"
import { CustomHeader } from "@/components/custom-header"

interface MainLayoutProps {
  children: React.ReactNode
  missedClockOut?: boolean
}

export function MainLayout({ children, missedClockOut }: MainLayoutProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter();

  const [navigation, setNavigation] = useState([
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Discuss", href: "/discuss", icon: MessageCircle },
    { name: "Attendance", href: "/attendance", icon: Clock },
    { name: "Leave", href: "/leave", icon: Calendar },
    { name: "Expenses", href: "/expenses", icon: Receipt },
    { name: "Profile", href: "/profile", icon: User },
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Check both activeRole and primaryRole from localStorage
    const activeRole = typeof window !== 'undefined' ? localStorage.getItem('activeRole') : null;
    const primaryRole = typeof window !== 'undefined' ? localStorage.getItem('primaryRole') : null;
    const role = activeRole || primaryRole;
    if (role === 'hr') {
      setNavigation([
        { name: "HR Dashboard", href: "/hr/dashboard", icon: Home },
        { name: "Logout", href: "/login", icon: User },
      ]);
    } else if (role === 'supervisor') {
      setNavigation([
        { name: "Supervisor Dashboard", href: "/supervisor/dashboard", icon: Home },
        { name: "Logout", href: "/login", icon: User },
      ]);
    } else {
      setNavigation([
        { name: "Dashboard", href: "/dashboard", icon: Home },
        { name: "Discuss", href: "/discuss", icon: MessageCircle },
        { name: "Attendance", href: "/attendance", icon: Clock },
        { name: "Leave", href: "/leave", icon: Calendar },
        { name: "Expenses", href: "/expenses", icon: Receipt },
        { name: "Profile", href: "/profile", icon: User },
      ]);
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="md:hidden ml-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <nav className="flex flex-col gap-4 py-4">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-2 px-2 py-1 text-sm ${
                          isActive ? "font-medium text-primary" : "text-muted-foreground"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    )
                  })}
                  <Link
                    href="/"
                    className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </Button>
          <CustomHeader missedClockOut={missedClockOut} />
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r md:block">
          <div className="flex h-full flex-col gap-2 p-4">
            <nav className="flex flex-col gap-1 py-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="mt-auto">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => {
                  localStorage.removeItem('uid');
                  localStorage.removeItem('isVerified');
                  localStorage.removeItem('employeeId');
                  localStorage.removeItem('employeeName');
                  localStorage.removeItem('employeeEmail');
                  localStorage.removeItem('jobTitle');
                  localStorage.removeItem('employeeType');
                  localStorage.removeItem('primaryRole');
                  localStorage.removeItem('userRoles');
                  router.replace('/login');
                }}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </aside>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

