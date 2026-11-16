import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  try {
    const { data, error } = await supabase
      .from('delivery_orders')
      .select('*, warehouse:warehouses(*), project:projects(*), site:sites(*)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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

    const { data, error } = await supabase
      .from('delivery_orders')
      .insert(payload)
      .select('*, warehouse:warehouses(*), project:projects(*), site:sites(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const supabase = createAdminClient();
  try {
    const body = await req.json();
    const { deliveryOrderId, recipientName, notes, signatureUrl, podPhotoUrl } = body;

    const payload = {
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      recipient_name: recipientName,
      recipient_signature_url: signatureUrl || null,
      pod_photo_url: podPhotoUrl || null,
      pod_notes: notes || null,
    };

    const { data, error } = await supabase
      .from('delivery_orders')
      .update(payload)
      .eq('id', deliveryOrderId)
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
