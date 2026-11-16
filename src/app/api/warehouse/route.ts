import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  try {
    let { data, error } = await supabase
      .from('warehouse_stocks')
      .select('*, item:items(*), warehouse:warehouses(*)')
      .order('quantity', { ascending: true });

    if (error) {
      const fallback = await supabase.from('warehouse_stocks').select('*');
      data = fallback.data;
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const supabase = createAdminClient();
  try {
    const body = await req.json();
    const { itemId, warehouseId, quantity, referenceNumber, notes, receivedBy } = body;

    const validUserId =
      receivedBy && receivedBy.length === 36
        ? receivedBy
        : 'a0000000-0000-0000-0000-000000000005';

    // 1. Log stock movement
    await supabase.from('stock_movements').insert({
      movement_type: 'in_purchase',
      item_id: itemId,
      warehouse_id: warehouseId,
      quantity: quantity || 0,
      reference_number: referenceNumber || 'PO-SUPP',
      notes: notes || 'Penerimaan barang dari supplier',
      created_by: validUserId,
    });

    // 2. Upsert stock
    const { data: existing } = await supabase
      .from('warehouse_stocks')
      .select('*')
      .eq('item_id', itemId)
      .eq('warehouse_id', warehouseId)
      .single();

    let stockRes;
    if (existing) {
      stockRes = await supabase
        .from('warehouse_stocks')
        .update({
          quantity: Number(existing.quantity || 0) + Number(quantity || 0),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('*, item:items(*), warehouse:warehouses(*)')
        .single();
    } else {
      stockRes = await supabase
        .from('warehouse_stocks')
        .insert({
          item_id: itemId,
          warehouse_id: warehouseId,
          quantity: quantity || 0,
          reserved_quantity: 0,
          updated_at: new Date().toISOString(),
        })
        .select('*, item:items(*), warehouse:warehouses(*)')
        .single();
    }

    if (stockRes.error) {
      return NextResponse.json({ error: stockRes.error.message }, { status: 400 });
    }

    return NextResponse.json({ data: stockRes.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
