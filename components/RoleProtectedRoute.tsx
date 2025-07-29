"use client"

import { useRole } from '../context/RoleContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RoleProtectedRoute({ allowedRole, children }: { allowedRole: string; children: React.ReactNode }) {
  const { roles, isHydrated } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !roles.includes(allowedRole as any)) {
      router.replace('/employee/dashboard');
    }
  }, [roles, allowedRole, router, isHydrated]);

  if (!isHydrated || !roles.includes(allowedRole as any)) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
} 