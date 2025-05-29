import { NextResponse } from 'next/server';
import { loginToOdoo, getOdooClient } from '@/lib/odooXml';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    let loginValue = email;
    // If input does not contain '@', treat as username and try to find the email
    if (!email.includes('@')) {
      // Try to find user by login (username)
      const client = getOdooClient();
      const users = await client['execute'](
        'res.users',
        'search_read',
        [[['login', '=', email]]],
        { fields: ['login', 'email'], limit: 1 }
      );
      if (users && users.length > 0) {
        loginValue = users[0].login;
      }
    }
    const uid = await loginToOdoo(loginValue, password);
    return NextResponse.json({ uid });
  } catch (err: any) {
    // if it's our custom auth error, return 401; otherwise 500
    const status = err.name === 'AuthenticationError' ? 401 : 500;
    return NextResponse.json({ uid: null, error: err.message }, { status });
  }
}
