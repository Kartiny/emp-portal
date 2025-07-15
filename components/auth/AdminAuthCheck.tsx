'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AdminAuthCheckProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'hr' | 'employee';
}

export function AdminAuthCheck({ children, requiredRole = 'admin' }: AdminAuthCheckProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const uid = localStorage.getItem('uid');
      const primaryRole = localStorage.getItem('primaryRole');
      const jobTitle = localStorage.getItem('jobTitle');

      if (!uid) {
        router.push('/login');
        return;
      }

      // Check role-based access
      let hasAccess = false;
      
      switch (requiredRole) {
        case 'admin':
          hasAccess = primaryRole === 'admin';
          break;
        case 'hr':
          hasAccess = primaryRole === 'hr' || primaryRole === 'admin';
          break;
        case 'employee':
          hasAccess = true; // All authenticated users can access employee pages
          break;
        default:
          hasAccess = false;
      }

      // Fallback to job title check for backward compatibility
      if (!hasAccess && jobTitle) {
        if (requiredRole === 'admin' && 
            (jobTitle.includes('Manager') || jobTitle.includes('Administrator') || jobTitle.includes('Director'))) {
          hasAccess = true;
        }
      }

      if (hasAccess) {
        setIsAuthorized(true);
      } else {
        toast.error(`Access denied. ${requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1)} privileges required.`);
        router.push('/login');
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [router, requiredRole]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
} 