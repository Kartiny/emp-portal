import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('🔍 Fetching user roles for UID:', uid);
    
    const client = getOdooClient();
    
    // Get user's groups from res.users
    const userGroups = await (client as any).execute(
      'res.users',
      'read',
      [[uid], ['groups_id']]
    );

    if (!userGroups || !userGroups[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const groupIds = userGroups[0].groups_id || [];
    
    // Get group details
    const groups = await (client as any).execute(
      'res.groups',
      'read',
      [groupIds, ['id', 'name', 'xml_id']]
    );

    // Map groups to roles
    const roles = groups.map((group: any) => {
      const xmlId = group.xml_id || '';
      let role = 'employee'; // default role
      
      // Map Odoo groups to roles
      if (xmlId.includes('base.group_system') || xmlId.includes('base.group_erp_manager')) {
        role = 'admin';
      } else if (xmlId.includes('hr.group_hr_manager') || xmlId.includes('hr.group_hr_user')) {
        role = 'hr';
      } else if (xmlId.includes('base.group_user')) {
        role = 'employee';
      }
      
      return {
        id: group.id,
        name: group.name,
        xmlId: xmlId,
        role: role
      };
    });

    // Determine primary role (admin > hr > employee)
    let primaryRole = 'employee';
    if (roles.some((r: any) => r.role === 'admin')) {
      primaryRole = 'admin';
    } else if (roles.some((r: any) => r.role === 'hr')) {
      primaryRole = 'hr';
    }

    return NextResponse.json({ 
      roles,
      primaryRole,
      groups: roles
    });
    
  } catch (err: any) {
    console.error('❌ Roles API error:', err);
    return NextResponse.json({ 
      error: err.message || 'Failed to fetch user roles' 
    }, { status: 500 });
  }
} 