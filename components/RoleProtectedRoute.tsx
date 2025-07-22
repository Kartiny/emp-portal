"use client"

import { useRole } from '../context/RoleContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RoleProtectedRoute({ allowedRole, children }: { allowedRole: string; children: React.ReactNode }) {
  const { activeRole } = useRole();
  const router = useRouter();
  useEffect(() => {
    if (activeRole !== allowedRole) {
      if (activeRole === 'hr') router.replace('/hr/dashboard');
      else if (activeRole === 'supervisor') router.replace('/supervisor/dashboard');
      else router.replace('/employee/dashboard');
    }
  }, [activeRole, allowedRole, router]);
  if (activeRole !== allowedRole) return null;
  return <>{children}</>;
} 