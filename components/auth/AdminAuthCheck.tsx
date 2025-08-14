'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AdminAuthCheckProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager' | 'employee';
}

export function AdminAuthCheck({ children, requiredRole = 'admin' }: AdminAuthCheckProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const uid = localStorage.getItem('uid');
      const primaryRole = localStorage.getItem('primaryRole');
      const availableFeatures = JSON.parse(localStorage.getItem('availableFeatures') || '[]');
      const isVerified = localStorage.getItem('isVerified') === 'true';

      if (!uid) {
        router.push('/login');
        return;
      }

      if (!isVerified) {
        router.push('/verify');
        return;
      }

      // Check role-based access
      let hasAccess = false;
      
      switch (requiredRole) {
        case 'admin':
          hasAccess = primaryRole === 'administrator';
          break;
        case 'manager':
          hasAccess = primaryRole === 'manager' || primaryRole === 'administrator';
          break;
        case 'employee':
          hasAccess = true; // All authenticated users can access employee pages
          break;
        default:
          hasAccess = false;
      }

      // Additional check: verify permissions with backend if needed
      if (hasAccess && requiredRole !== 'employee') {
        try {
          const response = await fetch('/api/odoo/auth/permissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: Number(uid) }),
          });

          if (response.ok) {
            const data = await response.json();
            // Update localStorage with fresh permission data
            if (data.availableFeatures) {
              localStorage.setItem('availableFeatures', JSON.stringify(data.availableFeatures));
            }
            if (data.primaryRole) {
              localStorage.setItem('primaryRole', data.primaryRole);
            }
          }
        } catch (error) {
          console.warn('Could not verify permissions with backend:', error);
          // Continue with cached permissions
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