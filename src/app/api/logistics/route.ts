import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  try {
    let { data, error } = await supabase
      .from('delivery_orders')
      .select('*, warehouse:warehouses(*), project:projects(*), site:sites(*)')
      .order('created_at', { ascending: false });

    if (error) {
      const fallback = await supabase.from('delivery_orders').select('*').order('created_at', { ascending: false });
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
    const {
      materialRequestId,
      sourceWarehouseId,
      destinationProjectId,
      destinationSiteId,
      driverName,
      driverPhone,
      vehicleNumber,
      createdBy,
    } = body;

    const deliveryNumber = `SJ-2026-11-${Math.floor(100 + Math.random() * 900)}`;
    const payload = {
      delivery_number: deliveryNumber,
      material_request_id: materialRequestId || null,
      source_warehouse_id: sourceWarehouseId,
      destination_project_id: destinationProjectId,
      destination_site_id: destinationSiteId || null,
      driver_name: driverName,
      driver_phone: driverPhone || '+6281299887766',
      vehicle_number: vehicleNumber,
      status: 'in_transit' as const,
      dispatched_at: new Date().toISOString(),
      created_by:
        createdBy && createdBy.length === 36
          ? createdBy
          : 'a0000000-0000-0000-0000-000000000005',
    };

    let { data, error } = await supabase
      .from('delivery_orders')
      .insert(payload)
      .select('*, warehouse:warehouses(*), project:projects(*), site:sites(*)')
      .single();

    if (error) {
      console.warn('POST delivery order join failed, fallback raw insert:', error.message);
      const rawRes = await supabase
        .from('delivery_orders')
        .insert(payload)
        .select('*')
        .single();
      data = rawRes.data;
      error = rawRes.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const supabase = createAdminClient();
  try {
    const body = await req.json();
    const { id, status, recipientName, recipientPhone, recipientSignatureUrl, podPhotoUrl, podNotes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing delivery order ID' }, { status: 400 });
    }

    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status === 'delivered') {
      updates.delivered_at = new Date().toISOString();
      if (recipientName) updates.recipient_name = recipientName;
      if (recipientPhone) updates.recipient_phone = recipientPhone;
      if (recipientSignatureUrl) updates.recipient_signature_url = recipientSignatureUrl;
      if (podPhotoUrl) updates.pod_photo_url = podPhotoUrl;
      if (podNotes) updates.pod_notes = podNotes;
    }

    const { data, error } = await supabase
      .from('delivery_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
