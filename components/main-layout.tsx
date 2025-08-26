'use client';

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
  User,
  FileText,
  CheckCircle,
  Edit
} from "lucide-react"

interface MainLayoutProps {
  children: React.ReactNode
  missedClockOut?: boolean
}

export function MainLayout({ children, missedClockOut }: MainLayoutProps) {
  const { roles, isHydrated } = useRole()

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  const allMenus = {
    employee: [
      { name: "Dashboard", href: "/employee/dashboard", icon: Home },
      { name: "Discuss", href: "/employee/discuss", icon: MessageCircle },
      { name: "Attendance", href: "/employee/attendance", icon: Clock },
      { name: "Leave", href: "/employee/leave", icon: Calendar },
      { name: "Expenses", href: "/employee/expenses", icon: Receipt },
      { name: "Profile", href: "/employee/profile", icon: User },
    ],
    administrator: [
      { name: "Dashboard", href: "/administrator/dashboard", icon: Home },
      { name: "Employees", href: "/administrator/employees", icon: User },
      { name: "Attendance Management", href: "/administrator/attendance-management", icon: Clock },
      { name: "Leave Management", href: "/administrator/leave-management", icon: Calendar },
      { name: "Expense Management", href: "/administrator/expense-management", icon: Receipt },
      { name: "Reports", href: "/administrator/reports", icon: FileText },
      { name: "Approvals", href: "/administrator/approvals", icon: CheckCircle },
      { name: "Profile", href: "/administrator/profile", icon: User },
    ],
    manager: [
      { name: "Dashboard", href: "/manager/dashboard", icon: Home },
      { name: "Team Attendance", href: "/manager/team-attendance", icon: Clock },
      { name: "Approve Leaves", href: "/manager/approve-leaves", icon: Calendar },
      { name: "Approve Expenses", href: "/manager/approve-expenses", icon: Receipt },
      { name: "Profile", href: "/manager/profile", icon: User },
    ],
  }

  const getFilteredMenu = () => {
    let menu = []
    if (roles.includes('employee')) {
      menu.push({
        title: 'My Tools',
        items: allMenus.employee,
      })
    }
    if (roles.includes('manager')) {
      menu.push({
        title: 'Manager Tools',
        items: allMenus.manager,
      })
    }
    if (roles.includes('administrator')) {
      menu.push({
        title: 'Administrator Tools',
        items: allMenus.administrator,
      })
    }
    return menu
  }

  const menu = getFilteredMenu()

  return (
    <SidebarProvider>
      {/* Entire page background */}
      <div className="min-h-screen bg-gray-50">

        {/* Top Bar */}
        <div className="fixed top-0 left-0 right-0 h-20 bg-white border-b z-30">
          <CustomHeader missedClockOut={missedClockOut} />
        </div>

        {/* Sidebar */}
        <aside className="fixed top-20 left-0 bottom-0 w-56 bg-white border-r z-20 overflow-y-auto">
          <Sidebar>
            <nav className="flex flex-col gap-4 p-4">
              {menu.map(group => (
                <div key={group.title}>
                  <h2 className="font-bold text-md mb-2">{group.title}</h2>
                  {group.items.map(item => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 text-sm"
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </a>
                  ))}
                </div>
              ))}
            </nav>
          </Sidebar>
        </aside>

        {/* Main Content */}
        <main className="fixed top-20 left-60 right-0 bottom-0 overflow-y-auto px-8 py-8 bg-gray-50">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}