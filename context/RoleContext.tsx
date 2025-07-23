'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Role = 'employee' | 'hr' | 'supervisor';

interface RoleContextType {
  roles: Role[];
  activeRole: Role;
  setActiveRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: React.ReactNode }) => {
  const [roles, setRoles] = useState<Role[]>(['employee']);
  const [activeRole, setActiveRole] = useState<Role>('employee');

  // On mount, always sync roles and activeRole from localStorage (client-side)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const validRoles: Role[] = ['employee', 'hr', 'supervisor'];
      let storedRoles = JSON.parse(localStorage.getItem('roles') || '[]');
      if (Array.isArray(storedRoles)) {
        storedRoles = storedRoles.filter((r: any) => validRoles.includes(r));
        if (storedRoles.length === 0) storedRoles = ['employee'];
        // Only add 'employee' if the only role is 'supervisor' or 'hr'
        if (storedRoles.length === 1 && (storedRoles[0] === 'supervisor' || storedRoles[0] === 'hr') && !storedRoles.includes('employee')) {
          storedRoles = ['employee', storedRoles[0]];
        }
      } else {
        storedRoles = ['employee'];
      }
      let storedActiveRole = localStorage.getItem('activeRole');
      if (!storedActiveRole || !validRoles.includes(storedActiveRole as Role)) {
        storedActiveRole = storedRoles[0];
      }
      setRoles(storedRoles);
      setActiveRole(storedActiveRole as Role);
    }
  }, []);

  // Persist activeRole in localStorage
  useEffect(() => {
    localStorage.setItem('activeRole', activeRole);
  }, [activeRole]);

  return (
    <RoleContext.Provider value={{ roles, activeRole, setActiveRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within a RoleProvider');
  return ctx;
} 