'use client';

import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Receipt, 
  Clock, 
  FileText, 
  Settings, 
  MessageCircle,
  CheckCircle,
  BarChart3,
  UserCheck,
  Building
} from 'lucide-react';

interface PermissionBasedNavProps {
  className?: string;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  requiredFeature: string;
  requiredRole?: string;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/employee/dashboard',
    icon: LayoutDashboard,
    requiredFeature: 'dashboard'
  },
  {
    id: 'attendance',
    label: 'Attendance',
    href: '/employee/attendance',
    icon: Clock,
    requiredFeature: 'attendance'
  },
  {
    id: 'leave',
    label: 'Leave',
    href: '/employee/leave',
    icon: Calendar,
    requiredFeature: 'leave_requests'
  },
  {
    id: 'expenses',
    label: 'Expenses',
    href: '/employee/expenses',
    icon: Receipt,
    requiredFeature: 'expense_requests'
  },
  {
    id: 'discuss',
    label: 'Discuss',
    href: '/employee/discuss',
    icon: MessageCircle,
    requiredFeature: 'discuss'
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/employee/profile',
    icon: UserCheck,
    requiredFeature: 'profile'
  },
  // Manager/Admin features
  {
    id: 'team-attendance',
    label: 'Team Attendance',
    href: '/manager/team-attendance',
    icon: Clock,
    requiredFeature: 'team_attendance',
    requiredRole: 'manager'
  },
  {
    id: 'approve-leaves',
    label: 'Approve Leaves',
    href: '/manager/approve-leaves',
    icon: CheckCircle,
    requiredFeature: 'approve_leaves',
    requiredRole: 'manager'
  },
  {
    id: 'approve-expenses',
    label: 'Approve Expenses',
    href: '/manager/approve-expenses',
    icon: Receipt,
    requiredFeature: 'approve_expenses',
    requiredRole: 'manager'
  },
  {
    id: 'team-reports',
    label: 'Team Reports',
    href: '/manager/reports',
    icon: BarChart3,
    requiredFeature: 'team_reports',
    requiredRole: 'manager'
  },
  // Administrator features (includes HR features)
  {
    id: 'employee-management',
    label: 'Employee Management',
    href: '/administrator/employees',
    icon: Users,
    requiredFeature: 'employee_management',
    requiredRole: 'administrator'
  },
  {
    id: 'leave-management',
    label: 'Leave Management',
    href: '/administrator/leave-management',
    icon: Calendar,
    requiredFeature: 'leave_management',
    requiredRole: 'administrator'
  },
  {
    id: 'expense-management',
    label: 'Expense Management',
    href: '/administrator/expense-management',
    icon: Receipt,
    requiredFeature: 'expense_management',
    requiredRole: 'administrator'
  },
  {
    id: 'attendance-management',
    label: 'Attendance Management',
    href: '/administrator/attendance-management',
    icon: Clock,
    requiredFeature: 'attendance_management',
    requiredRole: 'administrator'
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/administrator/reports',
    icon: BarChart3,
    requiredFeature: 'reports',
    requiredRole: 'administrator'
  },
  {
    id: 'approvals',
    label: 'Approvals',
    href: '/administrator/approvals',
    icon: CheckCircle,
    requiredFeature: 'approvals',
    requiredRole: 'administrator'
  },
  {
    id: 'contracts',
    label: 'Contracts',
    href: '/administrator/contracts',
    icon: FileText,
    requiredFeature: 'contracts',
    requiredRole: 'administrator'
  },
  {
    id: 'system-settings',
    label: 'System Settings',
    href: '/administrator/settings',
    icon: Settings,
    requiredFeature: 'system_settings',
    requiredRole: 'administrator'
  }
];

export function PermissionBasedNav({ className = '' }: PermissionBasedNavProps) {
  const { availableFeatures, primaryRole, hasFeature, hasRole, loading } = usePermissions();
  const router = useRouter();

  console.log('🔍 PermissionBasedNav - Current state:');
  console.log('  - availableFeatures:', availableFeatures);
  console.log('  - primaryRole:', primaryRole);
  console.log('  - loading:', loading);

  const hasPermission = (item: NavItem): boolean => {
    // Check if user has the required feature
    const hasRequiredFeature = hasFeature(item.requiredFeature);
    console.log(`🔍 Checking permission for ${item.id}:`);
    console.log(`  - requiredFeature: ${item.requiredFeature}, hasFeature: ${hasRequiredFeature}`);
    
    if (!hasRequiredFeature) {
      console.log(`  ❌ No permission - missing feature: ${item.requiredFeature}`);
      return false;
    }

    // Check role requirement if specified
    if (item.requiredRole) {
      const hasRequiredRole = hasRole(item.requiredRole);
      console.log(`  - requiredRole: ${item.requiredRole}, hasRole: ${hasRequiredRole}`);
      if (!hasRequiredRole) {
        console.log(`  ❌ No permission - missing role: ${item.requiredRole}`);
        return false;
      }
    }

    console.log(`  ✅ Permission granted for ${item.id}`);
    return true;
  };

  const getFilteredNavItems = () => {
    const filtered = navItems.filter(hasPermission);
    console.log('🔍 Filtered nav items:', filtered.map(item => item.id));
    return filtered;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredItems = getFilteredNavItems();

  return (
    <nav className={`space-y-2 ${className}`}>
      {filteredItems.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.id}
            href={item.href}
            className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              router.push(item.href);
            }}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
} 