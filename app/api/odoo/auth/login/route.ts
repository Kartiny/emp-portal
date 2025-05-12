import { NextResponse } from 'next/server';
import { loginToOdoo } from '@/lib/odooXml';    // ← make sure this matches your tsconfig paths

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const uid = await loginToOdoo(email, password);
    return NextResponse.json({ uid });
  } catch (err: any) {
    // if it’s our custom auth error, return 401; otherwise 500
    const status = err.name === 'AuthenticationError' ? 401 : 500;
    return NextResponse.json({ uid: null, error: err.message }, { status });
  }
}
