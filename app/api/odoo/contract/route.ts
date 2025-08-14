import { NextRequest, NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getOdooClient();
    // Check if the request is for creating a contract (has employee_id, name, etc.)
    if (body.employee_id && body.name) {
      const newContractId = await client.createContract(body);
      return NextResponse.json({ id: newContractId });
    } else if (body.filters) {
      // Existing logic for fetching contracts with filters
      const contracts = await client.getAllContracts(body.filters);
      return NextResponse.json({ contracts });
    } else {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('❌ Error in contract API:', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to process contract request' },
      { status: 500 }
    );
  }
}