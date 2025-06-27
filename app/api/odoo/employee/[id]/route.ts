import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

interface Params {
  params: { id: string };
}

export async function GET({ params }: Params) {
  const employeeId = parseInt(params.id, 10);
  const odoo = getOdooClient();

  try {
    const employee = await odoo.getUserProfile(employeeId);
    return NextResponse.json({ employee });
  } catch (error: any) {
    console.error('Employee detail fetch error:', error);
    return NextResponse.json(
      { employee: null, error: error.message },
      { status: 500 }
    );
  }
}