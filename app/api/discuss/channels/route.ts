import { NextRequest, NextResponse } from 'next/server';
import { getDiscussChannels } from '@/lib/odooXml';

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();
    if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    const channels = await getDiscussChannels(uid);
    // Map Odoo channel_type to our frontend types
    const mapped = channels.map((ch: any) => ({
      id: ch.id,
      name: ch.name,
      unread: ch.unread_counter || 0,
      type:
        ch.channel_type === 'channel' ? 'public' :
        ch.channel_type === 'private' ? 'private' :
        ch.channel_type === 'chat' ? 'direct' : 'other',
    }));
    return NextResponse.json({ channels: mapped });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch channels' }, { status: 500 });
  }
} 