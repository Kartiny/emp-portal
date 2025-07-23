"use client";

import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { RoleProvider, Role } from '../context/RoleContext';
import { MainLayout } from "@/components/main-layout";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const noLayoutRoutes = ['/login', '/verify', '/'];
  const showLayout = !noLayoutRoutes.includes(pathname);

  const validRoles: Role[] = ['employee', 'hr', 'supervisor'];
  let roles: Role[] = ['employee'];
  let activeRole: Role = 'employee';
  if (typeof window !== 'undefined') {
    try {
      const storedRoles = JSON.parse(localStorage.getItem('roles') || '[]');
      if (Array.isArray(storedRoles)) {
        roles = storedRoles.filter((r: any) => validRoles.includes(r)) as Role[];
        if (roles.length === 0) roles = ['employee'];
        // Only add 'employee' if the only role is 'supervisor' or 'hr'
        if (roles.length === 1 && (roles[0] === 'supervisor' || roles[0] === 'hr') && !roles.includes('employee')) {
          roles = ['employee', roles[0]];
        }
      }
      const storedActiveRole = localStorage.getItem('activeRole');
      if (storedActiveRole && validRoles.includes(storedActiveRole as Role)) {
        activeRole = storedActiveRole as Role;
      } else {
        activeRole = roles[0];
      }
    } catch {
      roles = ['employee'];
      activeRole = 'employee';
    }
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Icons */}
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body className={inter.className}>
        <RoleProvider initialRoles={roles} initialActiveRole={activeRole}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {showLayout ? <MainLayout>{children}</MainLayout> : children}
        </ThemeProvider>
        </RoleProvider>
      </body>
    </html>
  );
}