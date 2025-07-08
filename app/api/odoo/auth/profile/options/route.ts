import { NextResponse } from 'next/server';
import { getOdooClient } from '@/lib/odooXml';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const model = searchParams.get('model');
    const field = searchParams.get('field');

    if (!model || !field) {
      return NextResponse.json({ 
        error: 'Model and field parameters are required' 
      }, { status: 400 });
    }

    console.log('🔍 Fetching options for model:', model, 'field:', field);
    
    const client = getOdooClient();
    
    // Support fetching options for residence_status (many2one)
    if (model === 'hr.employee' && field === 'residence_status') {
      // Fetch the selection options for the residence_status field from hr.employee
      const fields = await (client as any).execute(
        'hr.employee',
        'fields_get',
        [[field]],
        {}
      );
      const selection = fields?.[field]?.selection || [];
      const options = selection.map(([value, label]: [string, string]) => ({ value, label }));
      return NextResponse.json({ options });
    }

    // Get field information to determine the type
    const fieldInfo = await (client as any).execute(
      model,
      'fields_get',
      [[field]],
      {}
    );

    if (!fieldInfo || !fieldInfo[field]) {
      return NextResponse.json({ 
        error: `Field ${field} not found in model ${model}` 
      }, { status: 404 });
    }

    const fieldData = fieldInfo[field];
    let options = [];

    if (fieldData.type === 'selection') {
      // For selection fields, return the selection options
      options = fieldData.selection || [];
    } else if (fieldData.type === 'many2one') {
      // For many2one fields, fetch records from the related model
      const relatedModel = fieldData.relation;
      if (relatedModel) {
        const records = await (client as any).execute(
          relatedModel,
          'search_read',
          [[['active', '=', true]]], // Only active records
          {
            fields: ['id', 'name'],
            order: 'name'
          }
        );
        options = records.map((record: any) => ({
          value: record.id,
          label: record.name
        }));
      }
    } else if (fieldData.type === 'many2many') {
      // For many2many fields, fetch records from the related model
      const relatedModel = fieldData.relation;
      if (relatedModel) {
        const records = await (client as any).execute(
          relatedModel,
          'search_read',
          [[['active', '=', true]]], // Only active records
          {
            fields: ['id', 'name'],
            order: 'name'
          }
        );
        options = records.map((record: any) => ({
          value: record.id,
          label: record.name
        }));
      }
    }

    console.log('✅ Options fetched successfully');
    return NextResponse.json({ 
      options,
      fieldType: fieldData.type,
      fieldInfo: fieldData
    });
  } catch (err: any) {
    console.error('❌ Options API error:', err);
    
    const errorMessage = err.message || 'Unknown error occurred';
    const errorDetails = {
      error: errorMessage,
      details: err.toString(),
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
} 