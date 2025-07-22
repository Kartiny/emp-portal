"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Calendar, Clock, FileText, Home, LogOut, Menu, Receipt, Settings, User, MessageCircle, ListTodo } from "lucide-react"
import { CustomHeader } from "@/components/custom-header"
import RoleSwitcher from './RoleSwitcher';
import { useRole } from '../context/RoleContext';
import { Sidebar, SidebarProvider } from './ui/sidebar';

interface MainLayoutProps {
  children: React.ReactNode
  missedClockOut?: boolean
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

export function MainLayout({ children, missedClockOut }: MainLayoutProps) {
  const { activeRole } = useRole();
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
  };
  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col">
        {/* Top nav bar: sticky and above sidebar */}
        <div className="sticky top-0 z-30 bg-white border-b h-20">
          <CustomHeader missedClockOut={missedClockOut} />
        </div>
        {/* Fixed Sidebar */}
        <div className="fixed left-0 top-20 h-[calc(100vh-5rem)] w-56 bg-white border-r z-20">
          <Sidebar>
            <nav className="flex flex-col gap-2 p-4">
              {menu[activeRole].map(item => (
                <a key={item.name} href={item.href} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </a>
              ))}
            </nav>
          </Sidebar>
            </div>
        {/* Main content with left margin and top margin for header */}
        <main className="flex-1 max-w-screen-xl mx-auto w-full px-8 py-8 ml-56 mt-5">{children}</main>
      </div>
    </SidebarProvider>
  );
}

