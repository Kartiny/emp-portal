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
- **Odoo Groups**: `administrator.group_administrator_manager`, `administrator.group_administrator_user`, `hr.group_hr_manager`, `hr.group_hr_user`
- **Access Level**: Full administrative access
- **Dashboard**: `/administrator/dashboard`
- **Features**:
  - Employee management
  - Attendance management
  - Leave management
  - Expense management
  - Reports and analytics
  - Approval workflows
  - HR functions (consolidated with administrator role)

### 3. Manager Role
- **Odoo Groups**: `hr.group_hr_manager`, `hr.group_hr_user`
- **Access Level**: Department-level access
- **Dashboard**: `/manager/dashboard`
- **Features**:
  - Team attendance monitoring
  - Leave approval for team members
  - Expense approval for team members
  - Team reports

### 4. Employee Role
- **Odoo Groups**: `base.group_user`
- **Access Level**: Self-service access
- **Dashboard**: `/employee/dashboard`
- **Features**:
  - Personal attendance tracking
  - Leave requests
  - Expense submissions
  - Profile management

## Role Assignment Logic

### 1. Employee Type Mapping
The system first checks the employee's `employee_type` field:
- `administrator` → Administrator role
- `admin` → Administrator role
- `hr` → Administrator role (consolidated)
- `manager` → Manager role
- `employee` → Employee role

### 2. Automatic Redirects
The system automatically redirects users based on their role:

- **Admin users** → `/admin/dashboard`
- **Administrator users** → `/administrator/dashboard`
- **Manager users** → `/manager/dashboard`
- **Employee users** → `/employee/dashboard`

### 3. Route Protection
Protected routes use the `AdminAuthCheck` component with role-specific requirements:

```tsx
// Admin-only page
<AdminAuthCheck requiredRole="admin">
  <AdminDashboard />
</AdminAuthCheck>

// Administrator access
<AdminAuthCheck requiredRole="administrator">
  <AdministratorDashboard />
</AdminAuthCheck>

// Manager access
<AdminAuthCheck requiredRole="manager">
  <ManagerDashboard />
</AdminAuthCheck>

// Employee access (default)
<AdminAuthCheck requiredRole="employee">
  <EmployeeDashboard />
</AdminAuthCheck>
```

### 3. Dashboard Components
- `AdminDashboard` - Full administrative interface
- `AdministratorDashboard` - Administrator management interface (includes HR functions)
- `ManagerDashboard` - Manager interface
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
- **Admin** > **Administrator** > **Manager** > **Employee**

Higher-level roles inherit access to lower-level features. 