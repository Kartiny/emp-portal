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
      const jobTitle = localStorage.getItem('jobTitle');

      if (!uid) {
        router.push('/login');
        return;
      }

      // Determine redirect path based on role
      let redirectPath = '/employee/dashboard'; // default

      if (primaryRole) {
        switch (primaryRole) {
          case 'admin':
            redirectPath = '/admin/dashboard';
            break;
          case 'hr':
            redirectPath = '/hr/dashboard';
            break;
          default:
            redirectPath = '/employee/dashboard';
            break;
        }
      } else if (jobTitle) {
        // Fallback to job title check for backward compatibility
        if (jobTitle.includes('Manager') || jobTitle.includes('Administrator') || jobTitle.includes('Director')) {
          redirectPath = '/admin/dashboard';
        } else {
          redirectPath = '/employee/dashboard';
        }
      }

      console.log(`🎭 Redirecting user with role '${primaryRole}' to: ${redirectPath}`);
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