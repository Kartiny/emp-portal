# Role-Based Access Control (RBAC) System

This document explains the role-based access control system implemented in the E-Global Employee Portal.

## Overview

The application implements a comprehensive role-based access control system that automatically redirects users to appropriate dashboards based on their Odoo user groups and permissions.

## User Roles

### 1. Admin Role
- **Odoo Groups**: `base.group_system`, `base.group_erp_manager`
- **Access Level**: Full system access
- **Dashboard**: `/admin/dashboard`
- **Features**:
  - View all employees and system statistics
  - Access to all administrative functions
  - System-wide reports and analytics
  - User management capabilities

### 2. Administrator Role
- **Odoo Groups**: `administrator.group_administrator_manager`, `administrator.group_administrator_user`
- **Access Level**: Administrator management access
- **Dashboard**: `/administrator/dashboard`
- **Features**:
  - Employee management
  - Leave request approval/rejection
  - Expense request approval/rejection
  - Administrator-specific reports
  - Can access admin features (inherited from admin role)

### 3. Employee Role
- **Odoo Groups**: `base.group_user`
- **Access Level**: Standard employee access
- **Dashboard**: `/employee/dashboard`
- **Features**:
  - Personal attendance tracking
  - Leave request submission
  - Expense submission
  - Profile management
  - Personal reports

## Implementation Details

### 1. Role Detection

The system detects user roles through the following process:

1. **Login Process**: When a user logs in, the system fetches their Odoo user groups
2. **Group Mapping**: Maps Odoo groups to application roles
3. **Primary Role**: Determines the highest privilege role for the user
4. **Storage**: Stores role information in localStorage for client-side access

```typescript
// Role mapping logic
const roles = groups.map((group: any) => {
  const xmlId = group.xml_id || '';
  let role = 'employee'; // default role
  
  if (xmlId.includes('base.group_system') || xmlId.includes('base.group_erp_manager')) {
    role = 'admin';
  } else if (xmlId.includes('hr.group_hr_manager') || xmlId.includes('hr.group_hr_user')) {
    role = 'hr';
  }
  
  return { id: group.id, name: group.name, xmlId: xmlId, role: role };
});
```

### 2. Automatic Redirects

The system automatically redirects users based on their role:

- **Admin users** → `/admin/dashboard`
- **HR users** → `/hr/dashboard`
- **Employee users** → `/employee/dashboard`

### 3. Route Protection

Protected routes use the `AdminAuthCheck` component with role-specific requirements:

```tsx
// Admin-only page
<AdminAuthCheck requiredRole="admin">
  <AdminDashboard />
</AdminAuthCheck>

// HR and Admin access
<AdminAuthCheck requiredRole="hr">
  <HRDashboard />
</AdminAuthCheck>

// Employee access (default)
<AdminAuthCheck requiredRole="employee">
  <EmployeeDashboard />
</AdminAuthCheck>
```

## API Endpoints

### Role Management
- `POST /api/odoo/auth/roles` - Fetch user roles from Odoo
- `POST /api/odoo/auth/login` - Login with role detection

### Admin APIs
- `POST /api/admin/stats` - Admin dashboard statistics
- `POST /api/admin/employees/recent` - Recent employee data
- `POST /api/admin/requests/pending` - Pending requests overview

### HR APIs
- `POST /api/hr/stats` - HR dashboard statistics
- `POST /api/hr/leave/pending` - Pending leave requests
- `POST /api/hr/expense/pending` - Pending expense requests

## Components

### 1. RoleBasedRedirect
Automatically redirects authenticated users to their appropriate dashboard.

### 2. AdminAuthCheck
Protects routes based on user roles with configurable access levels.

### 3. Dashboard Components
- `AdminDashboard` - Full administrative interface
- `HRDashboard` - HR management interface
- `EmployeeDashboard` - Employee self-service interface

## Configuration

### Odoo Group Mapping
The role mapping can be customized in the login API:

```typescript
// Customize group mappings
if (xmlId.includes('your.custom.group')) {
  role = 'custom_role';
}
```

### Role Hierarchy
The system implements a role hierarchy:
- **Admin** > **Administrator** > **Employee**

Higher-level roles inherit access to lower-level features.

## Security Features

1. **Server-side Validation**: All role checks are validated on the server
2. **Client-side Protection**: UI components check roles before rendering
3. **Automatic Redirects**: Users are automatically redirected to appropriate areas
4. **Session Management**: Role information is stored securely in localStorage
5. **Fallback Protection**: Job title fallback for backward compatibility

## Usage Examples

### Adding a New Role
1. Define the Odoo group mapping in the login API
2. Create the dashboard component
3. Add the API endpoints
4. Update the redirect logic
5. Add route protection

### Customizing Access Levels
```typescript
// In AdminAuthCheck component
switch (requiredRole) {
  case 'custom_role':
    hasAccess = primaryRole === 'custom_role' || primaryRole === 'admin';
    break;
}
```

## Troubleshooting

### Common Issues

1. **User not redirected correctly**
   - Check Odoo group assignments
   - Verify role mapping logic
   - Check localStorage for role data

2. **Access denied errors**
   - Verify user has correct Odoo groups
   - Check AdminAuthCheck component configuration
   - Ensure API endpoints are working

3. **Role not detected**
   - Check Odoo XML-RPC connection
   - Verify group XML IDs in Odoo
   - Check API error logs

### Debug Information
Enable debug logging to troubleshoot role detection:

```typescript
console.log('User groups:', groups);
console.log('Mapped roles:', roles);
console.log('Primary role:', primaryRole);
```

## Best Practices

1. **Always validate roles on the server side**
2. **Use the AdminAuthCheck component for route protection**
3. **Implement proper error handling for role detection**
4. **Keep role mappings consistent across the application**
5. **Test role-based access thoroughly**
6. **Document any custom role configurations**

## Future Enhancements

1. **Dynamic Role Management**: Allow admins to assign roles through the UI
2. **Permission Granularity**: More fine-grained permissions within roles
3. **Role Auditing**: Track role changes and access patterns
4. **Multi-tenant Support**: Role management for multiple organizations
5. **API Rate Limiting**: Role-based API access limits 