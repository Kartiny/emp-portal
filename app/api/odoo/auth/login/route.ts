import { NextResponse } from 'next/server';
import { loginToOdoo, getOdooClient, getEmployeeByUserId } from '@/lib/odooXml';

// Helper function to get user roles with detailed group analysis
async function getUserRoles(uid: number, employeeType?: string) {
  const client = getOdooClient();
  
  console.log(`🔍 getUserRoles called with:`);
  console.log(`   - UID: ${uid}`);
  console.log(`   - employeeType parameter: "${employeeType}"`);
  console.log(`   - employeeType type: ${typeof employeeType}`);
  console.log(`   - employeeType === 'hr': ${employeeType === 'hr'}`);
  
  try {
    // Get user's groups from res.users
    console.log(`🔍 Fetching user groups for UID: ${uid}`);
    const userGroups = await (client as any).execute(
      'res.users',
      'read',
      [[uid], ['groups_id']]
    );

    console.log(`🔍 User groups response:`, userGroups);

    if (!userGroups || !userGroups[0]) {
      console.log(`❌ No user groups found for UID: ${uid}`);
      return { 
        roles: [], 
        primaryRole: 'employee', 
        permissions: [],
        availableFeatures: ['dashboard', 'profile']
      };
    }

    const groupIds = userGroups[0].groups_id || [];
    console.log(`🔍 Group IDs found:`, groupIds);
    
    if (groupIds.length === 0) {
      console.log(`⚠️ User has no groups assigned`);
    }

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

    // Get access rights for all groups in a single call
    let allAccessRights: any[] = [];
    if (groupIds.length > 0) {
      try {
        allAccessRights = await (client as any).execute(
          'ir.model.access',
          'search_read',
          [[['group_id', 'in', groupIds]], ['name', 'model_id', 'perm_read', 'perm_write', 'perm_create', 'perm_unlink', 'group_id']]
        );
      } catch (err) {
        console.warn('Could not fetch all access rights in one go:', err);
        // Fallback to individual fetches if batch fails, though this is less efficient
      }
    }

    // Map access rights to groups
    const accessRightsMap = new Map<number, any[]>();
    for (const ar of allAccessRights) {
      const groupId = ar.group_id[0];
      if (!accessRightsMap.has(groupId)) {
        accessRightsMap.set(groupId, []);
      }
      accessRightsMap.get(groupId)?.push(ar);
    }

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
          xmlId.includes('hr.group_hr_user') ||
          groupName.toLowerCase().includes('admin') || 
          groupName.toLowerCase().includes('hr') ||
          groupName.toLowerCase().includes('human resource')) {
        role = 'administrator';
        accessLevel = 'full';
        console.log(`   → Enhanced to ADMINISTRATOR role (group permissions: ${groupName})`);
      } 
      // Check for manager access
      else if (categoryName.toLowerCase().includes('employee manager') || 
               categoryName.toLowerCase().includes('manager') ||
               groupName.toLowerCase().includes('manager')) {
        if (baseRole === 'employee') {
          role = 'manager';
          accessLevel = 'department';
          console.log(`   → Enhanced to MANAGER role (group permissions: ${groupName})`);
        }
      } else {
        console.log(`   → Keeping role: ${role} (from employee type)`);
      }

      // Get access rights for this group from the pre-fetched map
      const groupAccessRights = accessRightsMap.get(group.id) || [];

      // Map model access to feature permissions
      const groupPermissions = groupAccessRights.map((access: any) => {
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
    }

    // Determine primary role (administrator > manager > employee)
    let primaryRole = baseRole; // Start with employee type role
    console.log(`🎭 Role determination - All detected roles:`, roles.map((r: any) => `${r.name} (${r.role})`));
    console.log(`🎭 Current primaryRole before special case check: ${primaryRole}`);
    console.log(`🎭 employeeType value for special case check: "${employeeType}"`);
    console.log(`🎭 employeeType type: ${typeof employeeType}`);
    console.log(`🎭 employeeType === 'hr': ${employeeType === 'hr'}`);
    console.log(`🎭 employeeType === 'administrator': ${employeeType === 'administrator'}`);
    console.log(`🎭 employeeType === 'admin': ${employeeType === 'admin'}`);
    
    // Special case: if employee_type is 'administrator' or 'admin', always assign administrator role
    if (employeeType === 'administrator' || employeeType === 'admin') {
      primaryRole = 'administrator';
      console.log(`🎯 Special case: employee_type is '${employeeType}', forcing ADMINISTRATOR role`);
    } else if (employeeType === 'hr') {
      // HR users should also be administrators since they have the same permissions
      primaryRole = 'administrator';
      console.log(`🎯 Special case: employee_type is 'hr', mapping to ADMINISTRATOR role`);
    } else {
      console.log(`❌ Special case NOT triggered - employeeType "${employeeType}" !== "administrator"/"admin"/"hr"`);
      // Check group-based roles only if not 'administrator' or 'hr'
      if (roles.some((r: any) => r.role === 'administrator')) {
        primaryRole = 'administrator';
        console.log(`✅ Primary role set to: ADMINISTRATOR (group-based)`);
      } else if (roles.some((r: any) => r.role === 'manager')) {
        primaryRole = 'manager';
        console.log(`✅ Primary role set to: MANAGER (group-based)`);
      } else {
        console.log(`✅ Primary role remains: ${primaryRole} (default)`);
      }
    }
    
    console.log(`🎭 Final primaryRole after all checks: ${primaryRole}`);

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
    console.error('Error fetching user roles:', error);
    
    // Special handling for HR users - they should always get administrator role
    let fallbackPrimaryRole = 'employee';
    if (employeeType === 'hr' || employeeType === 'administrator' || employeeType === 'admin') {
      fallbackPrimaryRole = 'administrator';
      console.log(`🔄 Fallback: Setting HR user to ADMINISTRATOR role despite error`);
    }
    
    return { 
      roles: [], 
      primaryRole: fallbackPrimaryRole, 
      permissions: [],
      availableFeatures: fallbackPrimaryRole === 'administrator' ? ['dashboard', 'profile', 'employee_management', 'leave_management', 'expense_management', 'attendance_management', 'reports', 'approvals'] : ['dashboard', 'profile'],
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
    const { email, password } = await req.json();
    let loginValue = email;
    
    console.log('🔐 Login attempt started');
    console.log('📧 Email/Username provided:', email);
    console.log('🔑 Password provided:', password ? '***' : 'NOT PROVIDED');
    
    // If input does not contain '@', treat as username and try to find the email
    if (!email.includes('@')) {
      try {
        console.log('🔍 Searching for user by login/username:', email);
        // Try to find user by login (username)
        const client = getOdooClient();
        const users = await client.searchUserByLogin(email);
        console.log('🔍 Search result:', users);
        if (users && users.length > 0) {
          loginValue = users[0].login;
          console.log('✅ Found user login:', loginValue);
        } else {
          console.log('⚠️ No user found with login:', email);
        }
      } catch (searchError) {
        console.warn('❌ Could not search for user by login:', searchError);
        // Continue with original email value
      }
    }
    
    console.log('🔐 Attempting Odoo login with:', loginValue);
    console.log('🌐 Odoo URL:', 'https://eglobalscm-ysdev.senangbot.com/');
    console.log('🗄️ Database:', 'v17c_demo_payroll1');
    
    const uid = await loginToOdoo(loginValue, password);
    console.log('✅ Login successful, UID:', uid);
    console.log('✅ UID type:', typeof uid);
    console.log('✅ UID is valid:', uid && uid > 0);
    
    // Ensure uid is a valid number
    if (!uid || typeof uid !== 'number' || uid <= 0) {
      console.error('❌ Invalid UID received:', uid);
      return NextResponse.json({ uid: null, error: 'Invalid user ID received from login' }, { status: 400 });
    }
    
    // Now get the employee information linked to this user
    console.log('🔍 Finding employee record for user UID:', uid);
    
    try {
      const employee = await getEmployeeByUserId(uid);
      console.log('🔍 Employee data retrieved:', employee);
      console.log('🔍 Employee type from employee record:', employee?.employee_type);
      console.log('🔍 Job title from employee record:', employee?.job_title);
      
      console.log('🔍 About to call getUserRoles with UID:', uid, 'and employeeType:', employee?.employee_type);
      const { roles, primaryRole, permissions, availableFeatures, employeeType } = await getUserRoles(uid, employee?.employee_type);
      console.log('✅ getUserRoles completed successfully');
      
      if (employee) {
        console.log('✅ Found employee record:', employee);
        console.log('✅ Employee type being used:', employee.employee_type);
        console.log('✅ Job title being used:', employee.job_title);
        console.log('✅ User roles:', { roles, primaryRole, availableFeatures });
        console.log('✅ Final employee type returned:', employeeType);
        console.log('🔍 Backend role detection summary:');
        console.log('  - Employee type from Odoo:', employee.employee_type);
        console.log('  - Job title from Odoo:', employee.job_title);
        console.log('  - Primary role determined:', primaryRole);
        console.log('  - Available features:', availableFeatures);
        
        // Fallback: If no employee_type but job title suggests admin/manager role
        let finalPrimaryRole = primaryRole;
        if (!employee.employee_type && employee.job_title) {
          const jobTitle = employee.job_title.toLowerCase();
          if (jobTitle.includes('admin') || jobTitle.includes('hr') || jobTitle.includes('director') || jobTitle.includes('ceo')) {
            finalPrimaryRole = 'administrator';
            console.log(`🔄 Fallback: Job title '${employee.job_title}' suggests ADMINISTRATOR role`);
          } else if (jobTitle.includes('manager') || jobTitle.includes('supervisor')) {
            finalPrimaryRole = 'manager';
            console.log(`🔄 Fallback: Job title '${employee.job_title}' suggests MANAGER role`);
          }
        }
        
        console.log('✅ Final primary role being sent to frontend:', finalPrimaryRole);
        
        return NextResponse.json({ 
          uid: uid,
          employeeId: employee.id,
          employeeName: employee.name,
          employeeEmail: employee.work_email,
          jobTitle: employee.job_title,
          employeeType: employee.employee_type || null,
          roles: roles,
          primaryRole: finalPrimaryRole,
          permissions: permissions,
          availableFeatures: availableFeatures
        });
      } else {
        console.log('⚠️ No employee record found for user UID:', uid);
        return NextResponse.json({ 
          uid: uid,
          employeeId: null,
          roles: roles,
          primaryRole: primaryRole,
          permissions: permissions,
          availableFeatures: availableFeatures,
          error: 'No employee record found for this user'
        });
      }
      
    } catch (employeeError: any) {
      console.error('❌ Error finding employee record:', employeeError);
      return NextResponse.json({ 
        uid: uid,
        employeeId: null,
        error: 'Could not retrieve employee information'
      });
    }
    
  } catch (err: any) {
    console.error('❌ Login error details:');
    console.error('   Error name:', err.name);
    console.error('   Error message:', err.message);
    console.error('   Error stack:', err.stack);
    console.error('   Full error object:', err);
    
    // if it's our custom auth error, return 401; otherwise 500
    const status = err.name === 'AuthenticationError' ? 401 : 500;
    return NextResponse.json({ uid: null, error: err.message }, { status });
  }
}
