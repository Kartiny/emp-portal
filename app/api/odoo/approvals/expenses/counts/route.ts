import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = Number(searchParams.get('uid'));
    
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const client = getOdooClient();
    const approverProfile = await client.getFullUserProfile(uid);

    const domain = [
      // Assuming expenses also have a manager or department manager for approval
      '|',
      ['employee_id.parent_id.user_id', '=', uid], // Direct manager
      ['department_id.manager_id.user_id', '=', uid] // Department manager
    ];

    const pendingCount = await (client as any).execute_kw(
      'hr.expense',
      'search_count',
      [[...domain, ['state', 'in', ['draft', 'reported', 'submitted']]]] // Adjust states as per Odoo expense workflow
    );

    const approvedCount = await (client as any).execute_kw(
      'hr.expense',
      'search_count',
      [[...domain, ['state', '=', 'approved']]]
    );

    const refusedCount = await (client as any).execute_kw(
      'hr.expense',
      'search_count',
      [[...domain, ['state', '=', 'refused']]]
    );

    return NextResponse.json({
      success: true,
      data: {
        pending: pendingCount,
        approved: approvedCount,
        refused: refusedCount,
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching expense counts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch expense counts' 
      },
      { status: 500 }
    );
  }
}