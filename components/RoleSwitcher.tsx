"use client";

import { useRole } from '@/context/RoleContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RoleSwitcher() {
  const { roles, setActiveRole, activeRole } = useRole();

  const handleRoleChange = (newRole: string) => {
    setActiveRole(newRole);
  };

  if (!roles || roles.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Role:</span>
      <Select value={activeRole} onValueChange={handleRoleChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role} value={role}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 