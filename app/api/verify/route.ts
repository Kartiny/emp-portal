import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/odooXml';

export async function POST(req: NextRequest) {
  try {
    const { uid, code } = await req.json();
    
    if (!uid || !code) {
      return NextResponse.json(
        { error: 'UID and verification code are required' },
        { status: 400 }
      );
    }

    // Get admin credentials for verification
    const adminUid = await authenticateAdmin();

    // Verify the code against Odoo
    const response = await fetch(process.env.ODOO_URL || "https://eglobalscm_kaldev.senangbot.com/jsonrpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        id: Date.now(),
        params: {
          service: "object",
          method: "execute_kw",
          args: [
            process.env.DB_NAME || "v17c_demo_payroll1",
            adminUid,
            process.env.ADMIN_PWD || "admin@202502",
            "res.users",
            "verify_2fa",
            [[uid], code]
          ],
        },
      }),
    });

    const result = await response.json();

    if (result.error) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('❌ Verification failed:', err.message);
    return NextResponse.json(
      { error: err.message || 'Verification failed' },
      { status: 500 }
    );
  }
} 