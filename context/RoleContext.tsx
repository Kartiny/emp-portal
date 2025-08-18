'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Role = 'employee' | 'administrator' | 'manager';

interface RoleContextType {
  roles: Role[];
  setRoles: (roles: Role[]) => void;
  isHydrated: boolean;
  selectedCompanyId: number | undefined;
  setSelectedCompanyId: (companyId: number | undefined) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: React.ReactNode }) => {
  const [roles, setRoles] = useState<Role[]>(['employee']);
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(undefined);

  // On mount, always sync roles from localStorage (client-side)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const validRoles: Role[] = ['employee', 'administrator', 'manager'];
      let storedRoles = JSON.parse(localStorage.getItem('roles') || '[]');
      if (Array.isArray(storedRoles)) {
        storedRoles = storedRoles.filter((r: any) => validRoles.includes(r));
        if (storedRoles.length === 0) storedRoles = ['employee'];
        // Only add 'employee' if the only role is 'administrator', 'manager', or 'hr'
        if (storedRoles.length === 1 && (storedRoles[0] === 'administrator' || storedRoles[0] === 'manager') && !storedRoles.includes('employee')) {
          storedRoles = ['employee', storedRoles[0]];
        }
      } else {
        storedRoles = ['employee'];
      }
      console.log('Hydrating RoleContext:', { storedRoles });
      setRoles(storedRoles);

      const storedCompanyId = localStorage.getItem('selectedCompanyId');
      if (storedCompanyId) {
        setSelectedCompanyId(Number(storedCompanyId));
      }

      setIsHydrated(true); // Set to true after hydration
    }
  }, []);

  // Persist roles in localStorage
  useEffect(() => {
    localStorage.setItem('roles', JSON.stringify(roles));
  }, [roles]);

  // Persist selectedCompanyId in localStorage
  useEffect(() => {
    if (selectedCompanyId !== undefined) {
      localStorage.setItem('selectedCompanyId', String(selectedCompanyId));
    } else {
      localStorage.removeItem('selectedCompanyId');
    }
  }, [selectedCompanyId]);

  return (
    <RoleContext.Provider value={{ roles, setRoles, isHydrated, selectedCompanyId, setSelectedCompanyId }}>
      {children}
    </RoleContext.Provider>
  );
};

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within a RoleProvider');
  return ctx;
} 