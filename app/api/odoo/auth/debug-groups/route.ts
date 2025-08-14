import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid, employeeType } = await req.json();
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('🔍 Debug: Fetching user groups for UID:', uid);
    console.log('👤 Debug: Employee type:', employeeType);
    
    const client = getOdooClient();
    
    // Get user's groups from res.users
    const userGroups = await (client as any).execute(
      'res.users',
      'read',
      [[uid], ['groups_id', 'name', 'login']]
    );

    if (!userGroups || !userGroups[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const groupIds = userGroups[0].groups_id || [];
    console.log('🔍 Debug: User groups IDs:', groupIds);
    
    // Get detailed group information
    const groups = await (client as any).execute(
      'res.groups',
      'read',
      [groupIds, ['id', 'name', 'xml_id', 'category_id', 'comment']]
    );

    console.log('🔍 Debug: Detailed groups:', groups);

    // Determine base role from employee type
    let baseRole = 'employee';
    if (employeeType) {
      if (employeeType === 'hr') {
        baseRole = 'administrator';
      } else if (employeeType === 'manager') {
        baseRole = 'manager';
      } else {
        baseRole = 'employee';
      }
    }

    // Analyze each group
    const analyzedGroups = groups.map((group: any) => {
      const categoryName = group.category_id ? group.category_id[1] : '';
      const groupName = group.name || '';
      const xmlId = group.xml_id || '';
      
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
      } 
      // Check for manager access
      else if (categoryName.toLowerCase().includes('employee manager') || 
               categoryName.toLowerCase().includes('manager') ||
               groupName.toLowerCase().includes('manager')) {
        if (baseRole === 'employee') {
          role = 'manager';
          accessLevel = 'department';
        }
      } 
      // Check group name for hints
      else if (groupName.toLowerCase().includes('admin') || 
               groupName.toLowerCase().includes('hr') ||
               groupName.toLowerCase().includes('human resource')) {
        role = 'administrator';
        accessLevel = 'full';
      } else if (groupName.toLowerCase().includes('manager')) {
        if (baseRole === 'employee') {
          role = 'manager';
          accessLevel = 'department';
        }
      }

      return {
        id: group.id,
        name: groupName,
        xmlId: xmlId,
        category: categoryName,
        assignedRole: role,
        accessLevel: accessLevel,
        comment: group.comment || ''
      };
    });

    // Determine primary role
    let primaryRole = baseRole;
    if (analyzedGroups.some((g: any) => g.assignedRole === 'administrator')) {
      primaryRole = 'administrator';
    } else if (analyzedGroups.some((g: any) => g.assignedRole === 'manager')) {
      primaryRole = 'manager';
    }

    return NextResponse.json({ 
      user: {
        id: uid,
        name: userGroups[0].name,
        login: userGroups[0].login
      },
      employeeType: employeeType,
      baseRole: baseRole,
      groups: analyzedGroups,
      primaryRole: primaryRole,
      totalGroups: groups.length,
      employeeTypeMapping: {
        'hr': 'Administrator',
        'manager': 'Manager', 
        'employee': 'Employee',
        'student': 'Employee',
        'trainee': 'Employee',
        'contractor': 'Employee',
        'freelance': 'Employee'
      }
    });
    
  } catch (err: any) {
    console.error('❌ Debug groups API error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch user groups' },
      { status: 500 }
    );
  }
} 