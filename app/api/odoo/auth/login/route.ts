import { NextResponse } from 'next/server';
import { loginToOdoo, getOdooClient, getEmployeeByUserId } from '@/lib/odooXml';

// Helper function to get user roles
async function getUserRoles(uid: number) {
  const client = getOdooClient();
  
  try {
    // Get user's groups from res.users
    const userGroups = await (client as any).execute(
      'res.users',
      'read',
      [[uid], ['groups_id']]
    );

    if (!userGroups || !userGroups[0]) {
      return { roles: [], primaryRole: 'employee' };
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

    return { roles, primaryRole };
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return { roles: [], primaryRole: 'employee' };
  }
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    let loginValue = email;
    
    // If input does not contain '@', treat as username and try to find the email
    if (!email.includes('@')) {
      try {
        // Try to find user by login (username)
        const client = getOdooClient();
        const users = await client.searchUserByLogin(email);
        if (users && users.length > 0) {
          loginValue = users[0].login;
        }
      } catch (searchError) {
        console.warn('Could not search for user by login:', searchError);
        // Continue with original email value
      }
    }
    
    console.log('🔐 Attempting login with:', loginValue);
    const uid = await loginToOdoo(loginValue, password);
    console.log('✅ Login successful, UID:', uid);
    
    // Now get the employee information linked to this user
    console.log('🔍 Finding employee record for user UID:', uid);
    
    try {
      const employee = await getEmployeeByUserId(uid);
      const { roles, primaryRole } = await getUserRoles(uid);
      
      if (employee) {
        console.log('✅ Found employee record:', employee);
        console.log('✅ User roles:', { roles, primaryRole });
        
        return NextResponse.json({ 
          uid: uid,
          employeeId: employee.id,
          employeeName: employee.name,
          employeeEmail: employee.work_email,
          jobTitle: employee.job_title,
          employeeType: employee.employee_type || null,
          roles: roles,
          primaryRole: primaryRole
        });
      } else {
        console.log('⚠️ No employee record found for user UID:', uid);
        return NextResponse.json({ 
          uid: uid,
          employeeId: null,
          roles: roles,
          primaryRole: primaryRole,
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
    console.error('❌ Login error:', err);
    
    // if it's our custom auth error, return 401; otherwise 500
    const status = err.name === 'AuthenticationError' ? 401 : 500;
    return NextResponse.json({ uid: null, error: err.message }, { status });
  }
}
