import { NextResponse } from 'next/server';
import { loginToOdoo, getOdooClient } from '@/lib/odooXml';

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
    
    return NextResponse.json({ uid });
  } catch (err: any) {
    console.error('❌ Login error:', err);
    
    // if it's our custom auth error, return 401; otherwise 500
    const status = err.name === 'AuthenticationError' ? 401 : 500;
    return NextResponse.json({ uid: null, error: err.message }, { status });
  }
}
