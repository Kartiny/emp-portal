// app/api/odoo/auth/profile/update/route.ts
import { NextResponse } from 'next/server'
import { getFullUserProfile, getOdooClient } from '@/lib/odooXml'

export async function POST(req: Request) {
  try {
    const { uid, updates } = await req.json()

    if (typeof uid !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid uid' },
        { status: 400 }
      )
    }
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid updates payload' },
        { status: 400 }
      )
    }

    // 1️⃣ Get the Odoo XML-RPC client and find the employee record
    const client = getOdooClient()
    const profile = await getFullUserProfile(uid)
    const employeeId = profile.id
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee record not found for this user' },
        { status: 404 }
      )
    }

    // 2️⃣ Push the changes to hr.employee
    // Note: OdooClient.execute is marked private in TS, so we cast to any here
    // (you can expose a public updateUserProfile method if you prefer)
    // --- write the updates ---
    // @ts-ignore
    await (client as any).execute(
      'hr.employee',
      'write',
      [[employeeId], updates]
    )

    // 3️⃣ Read back the updated fields
    const fields = Object.keys(updates)
    // @ts-ignore
    const [updated] = await (client as any).execute(
      'hr.employee',
      'read',
      [[employeeId], fields]
    )

    // 4️⃣ Return the updated data
    return NextResponse.json({ data: updated })
  } catch (err: any) {
    console.error('❌ Profile update error:', err)
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: err.message === 'Invalid credentials' ? 401 : 500 }
    )
  }
}
