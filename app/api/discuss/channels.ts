import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // TODO: Integrate with Odoo XML-RPC to fetch real channels
  const channels = [
    { id: 1, name: 'General', unread: 2, type: 'public' },
    { id: 2, name: 'HR', unread: 0, type: 'private' },
    { id: 3, name: 'Direct: John Doe', unread: 5, type: 'direct' },
  ];
  return NextResponse.json({ channels });
} 