import { NextResponse } from 'next/server';
import { loginToOdoo, getOdooClient, getEmployeeByUserId } from '@/lib/odooXml';

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
      
      if (employee) {
        console.log('✅ Found employee record:', employee);
        
        return NextResponse.json({ 
          uid: uid,
          employeeId: employee.id,
          employeeName: employee.name,
          employeeEmail: employee.work_email,
          jobTitle: employee.job_title
        });
      } else {
        console.log('⚠️ No employee record found for user UID:', uid);
        return NextResponse.json({ 
          uid: uid,
          employeeId: null,
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
