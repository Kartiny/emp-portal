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
      '|',
      ['leave_manager_id', '=', approverProfile.id],
      ['department_id.manager_id', '=', approverProfile.id]
    ];

    const pendingCount = await (client as any).execute_kw(
      'hr.leave',
      'search_count',
      [[...domain, ['state', '=', 'confirm']]]
    );

    const approvedCount = await (client as any).execute_kw(
      'hr.leave',
      'search_count',
      [[...domain, ['state', '=', 'validate']]]
    );

    const refusedCount = await (client as any).execute_kw(
      'hr.leave',
      'search_count',
      [[...domain, ['state', '=', 'refuse']]]
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
    console.error('❌ Error fetching leave counts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch leave counts' 
      },
      { status: 500 }
    );
  }
}