import { NextRequest, NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function GET(req: NextRequest, { params }: { params: { channelId: string } }) {
  try {
    const channelId = Number(params.channelId);
    if (!channelId) {
      return NextResponse.json({ error: 'Missing or invalid channelId' }, { status: 400 });
    }
    const client = getOdooClient();

    // Fetch the discuss.channel record for debugging
    const channel = await client['execute'](
      'discuss.channel',
      'read',
      [[channelId], [
        'id', 'name', 'channel_type', 'channel_partner_ids', 'message_ids', 'description', 'create_uid', 'write_uid', 'create_date', 'write_date'
      ]]
    );

    // Fetch messages for this channel (mail.message model, res_id = channelId, model = 'discuss.channel')
    const messages = await client['execute'](
      'mail.message',
      'search_read',
      [
        [['model', '=', 'discuss.channel'], ['res_id', '=', channelId]],
        ['id', 'author_id', 'body', 'date', 'message_type']
      ],
      { order: 'date asc', limit: 50 }
    );
    // Map messages to frontend format
    const mapped = (messages || []).map((msg: any) => ({
      id: msg.id,
      author: Array.isArray(msg.author_id) ? msg.author_id[1] : 'Unknown',
      body: msg.body,
      date: msg.date,
      type: msg.message_type,
    }));
    return NextResponse.json({ channel, messages: mapped });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch messages' }, { status: 500 });
  }
} 