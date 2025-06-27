import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();
    // TODO: Replace with actual Odoo RPC call to fetch products from product.product
    // Fetch the 'name' field for display, and 'id' for value.
    // If you want to fetch the category, you can also fetch 'categ_id' (category id and name).
    // Example Odoo RPC call:
    // const products = await odoo.searchRead('product.product', [], ['id', 'name', 'categ_id']);
    // For now, this is a placeholder:
    const products = [
      { id: 1, name: 'Travel' },
      { id: 2, name: 'Meals' },
      { id: 3, name: 'Accommodation' },
    ];
    return NextResponse.json({ products });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
} 