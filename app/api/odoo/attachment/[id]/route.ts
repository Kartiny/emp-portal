import { NextRequest, NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!id) return new NextResponse('Invalid attachment id', { status: 400 });
    const client = getOdooClient();
    const att = await client.getAttachmentById(id);
    if (!att || !att.datas) return new NextResponse('Attachment not found', { status: 404 });
    const buffer = Buffer.from(att.datas, 'base64');
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': att.mimetype || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(att.name || 'file')}"`,
      },
    });
  } catch (err) {
    return new NextResponse('Failed to fetch attachment', { status: 500 });
  }
} 