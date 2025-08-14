'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function RoleBasedRedirect() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const redirectUser = () => {
      const uid = localStorage.getItem('uid');
      const primaryRole = localStorage.getItem('primaryRole');
      const isVerified = localStorage.getItem('isVerified') === 'true';
      const availableFeatures = JSON.parse(localStorage.getItem('availableFeatures') || '[]');
      const employeeType = localStorage.getItem('employeeType');

      console.log('🔍 RoleBasedRedirect debug:');
      console.log('  - uid:', uid);
      console.log('  - primaryRole:', primaryRole);
      console.log('  - isVerified:', isVerified);
      console.log('  - employeeType:', employeeType);
      console.log('  - availableFeatures:', availableFeatures);

      if (!uid) {
        console.log('❌ No UID found, redirecting to login');
        router.push('/login');
        return;
      }

      if (!isVerified) {
        console.log('❌ Not verified, redirecting to verify');
        router.push('/verify');
        return;
      }

      // Determine redirect path based on role and available features
      let redirectPath = '/employee/dashboard'; // default

      if (primaryRole) {
        switch (primaryRole) {
          case 'administrator':
            redirectPath = '/administrator/dashboard';
            console.log('✅ Redirecting to administrator dashboard');
            break;
          case 'manager':
            redirectPath = '/manager/dashboard';
            console.log('✅ Redirecting to manager dashboard');
            break;
          case 'employee':
          default:
            redirectPath = '/employee/dashboard';
            console.log('⚠️ Defaulting to employee dashboard (primaryRole:', primaryRole, ')');
            break;
        }
      } else {
        console.log('⚠️ No primaryRole found, defaulting to employee dashboard');
      }

      console.log(`🎭 Redirecting user with role '${primaryRole}' and features:`, availableFeatures, 'to:', redirectPath);
      router.push(redirectPath);
    };

    // Small delay to ensure localStorage is available
    const timer = setTimeout(() => {
      redirectUser();
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
}