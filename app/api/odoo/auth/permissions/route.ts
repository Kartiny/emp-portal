import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

// Helper function to get user permissions with detailed group analysis
async function getUserPermissions(uid: number, employeeType?: string) {
  const client = getOdooClient();
  
  try {
    // Get user's groups from res.users
    const userGroups = await (client as any).execute(
      'res.users',
      'read',
      [[uid], ['groups_id']]
    );

    if (!userGroups || !userGroups[0]) {
      return { 
        roles: [], 
        primaryRole: 'employee', 
        permissions: [],
        availableFeatures: ['dashboard', 'profile']
      };
    }

    const groupIds = userGroups[0].groups_id || [];
    
    // Get detailed group information including category_id and access rights
    const groups = await (client as any).execute(
      'res.groups',
      'read',
      [groupIds, ['id', 'name', 'xml_id', 'category_id', 'comment']]
    );

    // Get access rights for each group
    const permissions = [];
    const roles = [];

    // First, determine base role from employee type
    let baseRole = 'employee';
    if (employeeType) {
      console.log(`👤 Employee type detected: ${employeeType}`);
      // Map based on exact Odoo employee type values
      if (employeeType === 'hr' || employeeType === 'administrator' || employeeType === 'admin') {
        baseRole = 'administrator';
        console.log(`   → Mapped '${employeeType}' employee type to ADMINISTRATOR role`);
      } else if (employeeType === 'manager') {
        baseRole = 'manager';
        console.log(`   → Mapped '${employeeType}' employee type to MANAGER role`);
      } else {
        // All other types (employee, student, trainee, contractor, freelance) get basic access
        baseRole = 'employee';
        console.log(`   → Mapped '${employeeType}' employee type to EMPLOYEE role`);
      }
    } else {
      console.log(`⚠️ No employee type found, defaulting to EMPLOYEE role`);
    }
    console.log(`🎭 Base role from employee type: ${baseRole}`);

    for (const group of groups) {
      const categoryName = group.category_id ? group.category_id[1] : '';
      const groupName = group.name || '';
      const xmlId = group.xml_id || '';
      
      console.log(`🔍 Analyzing group: ${groupName} (ID: ${group.id})`);
      console.log(`   Category: "${categoryName}"`);
      console.log(`   XML ID: "${xmlId}"`);
      
      // Determine role based on employee type first, then enhance with group permissions
      let role = baseRole; // Start with employee type role
      let accessLevel = 'basic';
      
      // Enhance role based on group permissions
      if (categoryName.toLowerCase().includes('administrator') || 
          categoryName.toLowerCase().includes('admin') ||
          categoryName.toLowerCase().includes('hr') || 
          categoryName.toLowerCase().includes('human resources') ||
          xmlId.includes('base.group_system') || 
          xmlId.includes('base.group_erp_manager') ||
          xmlId.includes('hr.group_hr_manager') || 
          xmlId.includes('hr.group_hr_user')) {
        role = 'administrator';
        accessLevel = 'full';
        console.log(`   → Enhanced to ADMINISTRATOR role (group permissions)`);
      } 
      // Check for manager access
      else if (categoryName.toLowerCase().includes('employee manager') || 
               categoryName.toLowerCase().includes('manager') ||
               groupName.toLowerCase().includes('manager')) {
        if (baseRole === 'employee') {
          role = 'manager';
          accessLevel = 'department';
          console.log(`   → Enhanced to MANAGER role (group permissions)`);
        }
      } 
      // Check group name for hints
      else if (groupName.toLowerCase().includes('admin') || 
               groupName.toLowerCase().includes('hr') ||
               groupName.toLowerCase().includes('human resource')) {
        role = 'administrator';
        accessLevel = 'full';
        console.log(`   → Enhanced to ADMINISTRATOR role (group name)`);
      } else if (groupName.toLowerCase().includes('manager')) {
        if (baseRole === 'employee') {
          role = 'manager';
          accessLevel = 'department';
          console.log(`   → Enhanced to MANAGER role (group name)`);
        }
      } else {
        console.log(`   → Keeping role: ${role} (from employee type)`);
      }

      // Get access rights for this group
      try {
        const accessRights = await (client as any).execute(
          'ir.model.access',
          'search_read',
          [[['group_id', '=', group.id]], ['name', 'model_id', 'perm_read', 'perm_write', 'perm_create', 'perm_unlink']]
        );

        // Map model access to feature permissions
        const groupPermissions = accessRights.map((access: any) => {
          const modelName = access.model_id ? access.model_id[1] : '';
          return {
            model: modelName,
            read: access.perm_read,
            write: access.perm_write,
            create: access.perm_create,
            delete: access.perm_unlink
          };
        });

        permissions.push({
          groupId: group.id,
          groupName: groupName,
          category: categoryName,
          role: role,
          accessLevel: accessLevel,
          permissions: groupPermissions
        });

        roles.push({
          id: group.id,
          name: groupName,
          xmlId: xmlId,
          category: categoryName,
          role: role,
          accessLevel: accessLevel
        });

      } catch (accessError) {
        console.warn(`Could not fetch access rights for group ${group.id}:`, accessError);
        // Still add the group with basic info
        permissions.push({
          groupId: group.id,
          groupName: groupName,
          category: categoryName,
          role: role,
          accessLevel: accessLevel,
          permissions: []
        });

        roles.push({
          id: group.id,
          name: groupName,
          xmlId: xmlId,
          category: categoryName,
          role: role,
          accessLevel: accessLevel
        });
      }
    }

    // Determine primary role (administrator > manager > employee)
    let primaryRole = baseRole; // Start with employee type role
    console.log(`🎭 Role determination - All detected roles:`, roles.map((r: any) => `${r.name} (${r.role})`));
    console.log(`🎭 Current primaryRole before special case check: ${primaryRole}`);
    console.log(`🎭 employeeType value for special case check: "${employeeType}"`);
    
    // Special case: if employee_type is 'hr', always assign administrator role
    if (employeeType === 'hr') {
      primaryRole = 'administrator';
      console.log(`🎯 Special case: employee_type is 'hr', forcing ADMINISTRATOR role`);
    } else {
      console.log(`❌ Special case NOT triggered - employeeType "${employeeType}" !== "hr"`);
      // Check group-based roles only if not 'hr'
      if (roles.some((r: any) => r.role === 'administrator')) {
        primaryRole = 'administrator';
        console.log(`✅ Primary role set to: ADMINISTRATOR (from groups)`);
      } else if (roles.some((r: any) => r.role === 'manager')) {
        primaryRole = 'manager';
        console.log(`✅ Primary role set to: MANAGER (from groups)`);
      } else {
        console.log(`✅ Primary role set to: ${baseRole.toUpperCase()} (from employee type)`);
      }
    }

    // Determine available features based on permissions
    const availableFeatures = determineAvailableFeatures(permissions, primaryRole);

    return { 
      roles, 
      primaryRole, 
      permissions,
      availableFeatures,
      employeeType: employeeType
    };
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return { 
      roles: [], 
      primaryRole: 'employee', 
      permissions: [],
      availableFeatures: ['dashboard', 'profile'],
      employeeType: employeeType
    };
  }
}

// Helper function to determine available features based on permissions
function determineAvailableFeatures(permissions: any[], baseRole: string) {
  const features = new Set(['dashboard', 'profile']); // Basic features everyone has

  // First, add features based on employee type (base role)
  console.log(`🎯 Adding features based on employee type: ${baseRole}`);
  switch (baseRole) {
    case 'administrator':
      features.add('employee_management');
      features.add('leave_management');
      features.add('expense_management');
      features.add('attendance_management');
      features.add('reports');
      features.add('approvals');
      features.add('contracts');
      features.add('system_settings');
      console.log(`   → Added administrator features from employee type`);
      break;
    case 'manager':
      features.add('team_attendance');
      features.add('approve_leaves');
      features.add('approve_expenses');
      features.add('team_reports');
      console.log(`   → Added manager features from employee type`);
      break;
    case 'employee':
      features.add('attendance');
      features.add('leave_requests');
      features.add('expense_requests');
      features.add('discuss');
      console.log(`   → Added employee features from employee type`);
      break;
  }

  // Then, enhance with features based on group permissions
  for (const permission of permissions) {
    const { role, accessLevel, permissions: groupPermissions } = permission;

    // Add features based on role (this can enhance the base role)
    switch (role) {
      case 'administrator':
        features.add('employee_management');
        features.add('leave_management');
        features.add('expense_management');
        features.add('attendance_management');
        features.add('reports');
        features.add('approvals');
        features.add('contracts');
        features.add('system_settings');
        console.log(`   → Enhanced with administrator features from group: ${permission.groupName}`);
        break;
      case 'manager':
        features.add('team_attendance');
        features.add('approve_leaves');
        features.add('approve_expenses');
        features.add('team_reports');
        console.log(`   → Enhanced with manager features from group: ${permission.groupName}`);
        break;
      case 'employee':
        features.add('attendance');
        features.add('leave_requests');
        features.add('expense_requests');
        features.add('discuss');
        console.log(`   → Enhanced with employee features from group: ${permission.groupName}`);
        break;
    }

    // Add features based on specific model permissions
    for (const perm of groupPermissions) {
      const model = perm.model.toLowerCase();
      
      if (model.includes('hr.employee') && perm.read) {
        features.add('view_employees');
      }
      if (model.includes('hr.leave') && perm.read) {
        features.add('view_leaves');
      }
      if (model.includes('hr.leave') && perm.write) {
        features.add('approve_leaves');
      }
      if (model.includes('hr.expense') && perm.read) {
        features.add('view_expenses');
      }
      if (model.includes('hr.expense') && perm.write) {
        features.add('approve_expenses');
      }
      if (model.includes('hr.attendance') && perm.read) {
        features.add('view_attendance');
      }
      if (model.includes('hr.attendance') && perm.write) {
        features.add('manage_attendance');
      }
    }
  }

  const finalFeatures = Array.from(features);
  console.log(`🎯 Final available features:`, finalFeatures);
  return finalFeatures;
}

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('🔍 Fetching user permissions for UID:', uid);
    
    // Get employee profile to get employeeType
    const client = getOdooClient();
    let employeeType = null;
    
    try {
      const employee = await client.getFullUserProfile(uid);
      employeeType = employee.employee_type;
      console.log('🔍 Employee type from profile:', employeeType);
    } catch (profileError) {
      console.warn('Could not fetch employee profile:', profileError);
    }
    
    const { roles, primaryRole, permissions, availableFeatures, employeeType: fetchedEmployeeType } = await getUserPermissions(uid, employeeType);

    return NextResponse.json({ 
      roles,
      primaryRole,
      permissions,
      availableFeatures,
      employeeType: fetchedEmployeeType
    });
    
  } catch (err: any) {
    console.error('❌ Permissions API error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch user permissions' },
      { status: 500 }
    );
  }
} 