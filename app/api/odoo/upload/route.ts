import { NextRequest, NextResponse } from 'next/server';
import { uploadAttachmentToOdoo } from '@/lib/odooXml';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // Upload to Odoo as ir.attachment
    const attachmentId = await uploadAttachmentToOdoo({
      fileBuffer: buffer,
      filename: file.name,
      mimetype: file.type,
      // Optionally: relatedModel: 'hr.expense', relatedId: null
    });
    return NextResponse.json({ attachmentId });
  } catch (err) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
} 