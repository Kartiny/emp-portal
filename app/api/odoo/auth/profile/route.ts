import { NextResponse } from 'next/server';
import { getFullUserProfile } from '@/lib/odooXml';

export async function POST(req: Request) {
  const { uid } = await req.json();
  try {
    const user = await getFullUserProfile(uid);
    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
