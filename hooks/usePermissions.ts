import { useState, useEffect } from 'react';

interface Permission {
  groupId: number;
  groupName: string;
  category: string;
  role: string;
  accessLevel: string;
  permissions: Array<{
    model: string;
    read: boolean;
    write: boolean;
    create: boolean;
    delete: boolean;
  }>;
}

interface UsePermissionsReturn {
  availableFeatures: string[];
  primaryRole: string;
  permissions: Permission[];
  hasFeature: (feature: string) => boolean;
  hasRole: (role: string) => boolean;
  hasModelPermission: (model: string, permission: 'read' | 'write' | 'create' | 'delete') => boolean;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const [availableFeatures, setAvailableFeatures] = useState<string[]>([]);
  const [primaryRole, setPrimaryRole] = useState<string>('employee');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPermissions = async () => {
    try {
      const uid = localStorage.getItem('uid');
      console.log('🔍 usePermissions - UID from localStorage:', uid);
      
      if (!uid) {
        console.log('❌ usePermissions - No UID found, setting default permissions');
        setAvailableFeatures(['dashboard', 'profile']);
        setPrimaryRole('employee');
        setPermissions([]);
        setLoading(false);
        return;
      }

      // Try to get permissions from localStorage first
      const cachedFeatures = JSON.parse(localStorage.getItem('availableFeatures') || '[]');
      const cachedRole = localStorage.getItem('primaryRole') || 'employee';
      const cachedPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]');

      console.log('🔍 usePermissions - Cached data:');
      console.log('  - cachedFeatures:', cachedFeatures);
      console.log('  - cachedRole:', cachedRole);
      console.log('  - cachedPermissions length:', cachedPermissions.length);

      setAvailableFeatures(cachedFeatures);
      setPrimaryRole(cachedRole);
      setPermissions(cachedPermissions);

      // Then refresh from backend
      try {
        console.log('🔍 usePermissions - Fetching fresh permissions from backend...');
        const response = await fetch('/api/odoo/auth/permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: Number(uid) }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ usePermissions - Backend response:', data);
          console.log('  - availableFeatures:', data.availableFeatures);
          console.log('  - primaryRole:', data.primaryRole);
          console.log('  - employeeType:', data.employeeType);
          
          setAvailableFeatures(data.availableFeatures || []);
          setPrimaryRole(data.primaryRole || 'employee');
          setPermissions(data.permissions || []);

          // Update localStorage
          localStorage.setItem('availableFeatures', JSON.stringify(data.availableFeatures || []));
          localStorage.setItem('primaryRole', data.primaryRole || 'employee');
          localStorage.setItem('userPermissions', JSON.stringify(data.permissions || []));
        } else {
          console.error('❌ usePermissions - Backend response not ok:', response.status);
        }
      } catch (error) {
        console.warn('Could not refresh permissions from backend:', error);
        // Continue with cached permissions
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      setAvailableFeatures(['dashboard', 'profile']);
      setPrimaryRole('employee');
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (feature: string): boolean => {
    return availableFeatures.includes(feature);
  };

  const hasRole = (role: string): boolean => {
    const roleHierarchy = {
      'employee': 1,
      'manager': 2,
      'administrator': 3
    };

    const userRoleLevel = roleHierarchy[primaryRole as keyof typeof roleHierarchy] || 1;
    const requiredRoleLevel = roleHierarchy[role as keyof typeof roleHierarchy] || 1;

    return userRoleLevel >= requiredRoleLevel;
  };

  const hasModelPermission = (model: string, permission: 'read' | 'write' | 'create' | 'delete'): boolean => {
    return permissions.some(group => 
      group.permissions.some(perm => 
        perm.model.toLowerCase().includes(model.toLowerCase()) && perm[permission]
      )
    );
  };

  const refreshPermissions = async () => {
    setLoading(true);
    await loadPermissions();
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  return {
    availableFeatures,
    primaryRole,
    permissions,
    hasFeature,
    hasRole,
    hasModelPermission,
    loading,
    refreshPermissions
  };
} 