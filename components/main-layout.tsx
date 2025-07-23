"use client"

import type React from "react"
import { useRole } from '../context/RoleContext'
import { Sidebar, SidebarProvider } from './ui/sidebar'
import { CustomHeader } from "@/components/custom-header"
import {
  Calendar,
  Clock,
  Home,
  ListTodo,
  MessageCircle,
  Receipt,
  User
} from "lucide-react"

interface MainLayoutProps {
  children: React.ReactNode
  missedClockOut?: boolean
}

export function MainLayout({ children, missedClockOut }: MainLayoutProps) {
  const { activeRole } = useRole()

  const menu = {
    employee: [
      { name: "Dashboard", href: "/employee/dashboard", icon: Home },
      { name: "Discuss", href: "/employee/discuss", icon: MessageCircle },
      { name: "Attendance", href: "/employee/attendance", icon: Clock },
      { name: "Leave", href: "/employee/leave", icon: Calendar },
      { name: "Expenses", href: "/employee/expenses", icon: Receipt },
      { name: "Profile", href: "/employee/profile", icon: User },
    ],
    hr: [
      { name: "Dashboard", href: "/hr/dashboard", icon: Home },
      { name: "Employees", href: "/hr/employees", icon: User },
      { name: "Attendance Management", href: "/hr/attendance-management", icon: Clock },
      { name: "Leave Management", href: "/hr/leave-management", icon: Calendar },
      { name: "Expense Management", href: "/hr/expense-management", icon: Receipt },
      { name: "Reports", href: "/hr/reports", icon: ListTodo },
      { name: "Profile", href: "/hr/profile", icon: User },
    ],
    supervisor: [
      { name: "Dashboard", href: "/supervisor/dashboard", icon: Home },
      { name: "Team Attendance", href: "/supervisor/team-attendance", icon: Clock },
      { name: "Approve Leaves", href: "/supervisor/approve-leaves", icon: Calendar },
      { name: "Approve Expenses", href: "/supervisor/approve-expenses", icon: Receipt },
      { name: "Profile", href: "/supervisor/profile", icon: User },
    ],
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Top Bar */}
        <div className="fixed top-0 left-0 right-0 h-20 bg-white border-b z-30">
          <CustomHeader missedClockOut={missedClockOut} />
        </div>

        {/* Content below Top Bar */}
        <div className="flex pt-20">
          {/* Sidebar */}
          <aside className="w-56 h-[calc(100vh-5rem)] bg-white border-r z-20 overflow-y-auto">
            <Sidebar>
              <nav className="flex flex-col gap-2 p-4">
                {menu[activeRole].map(item => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-100"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </a>
                ))}
              </nav>
            </Sidebar>
          </aside>

          {/* Main Content */}
          <main className="flex-1 bg-gray-50 px-8 py-8 overflow-x-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
