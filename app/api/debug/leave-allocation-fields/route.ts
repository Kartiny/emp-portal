// app/api/debug/leave-allocation-fields/route.ts

import { NextResponse } from 'next/server';
import xmlrpc from 'xmlrpc';
import { ODOO_CONFIG } from '@/lib/config';

async function xmlRpcCall(client: any, method: string, params: any[]) {
  return new Promise<any>((resolve, reject) =>
    client.methodCall(method, params, (err: any, val: any) =>
      err ? reject(err) : resolve(val)
    )
  );
}

export async function GET() {
  try {
    // 1) log in as admin
    const commonClient = xmlrpc.createSecureClient({
      url: `${ODOO_CONFIG.BASE_URL}/xmlrpc/2/common`
    });
    const adminUid: number = await xmlRpcCall(commonClient, 'login', [
      ODOO_CONFIG.DB_NAME,
      ODOO_CONFIG.ADMIN_USER,
      ODOO_CONFIG.ADMIN_PWD,
    ]);

    // 2) fetch fields metadata for hr.leave.allocation
    const objectClient = xmlrpc.createSecureClient({
      url: `${ODOO_CONFIG.BASE_URL}/xmlrpc/2/object`
    });
    const fields = await xmlRpcCall(objectClient, 'execute_kw', [
      ODOO_CONFIG.DB_NAME,
      adminUid,
      ODOO_CONFIG.ADMIN_PWD,
      'hr.leave.allocation',
      'fields_get',
      [ /* no specific fields = all */ [] ],
      { attributes: ['string', 'type', 'help', 'relation', 'selection'] },
    ]);

    // 3) return as JSON
    return NextResponse.json(fields);
  } catch (err: any) {
    console.error('❌ Debug API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
