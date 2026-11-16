import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEMO_OFFICES } from '@/lib/mock-data';

export async function GET() {
  const supabase = createAdminClient();
  try {
    const { data, error } = await supabase
      .from('office_locations')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      return NextResponse.json({ offices: data });
    }

    return NextResponse.json({ offices: DEMO_OFFICES });
  } catch (err: any) {
    return NextResponse.json({ offices: DEMO_OFFICES, warning: err.message });
  }
}

export async function POST(req: Request) {
  const supabase = createAdminClient();
  try {
    const body = await req.json();
    const {
      name,
      address,
      latitude,
      longitude,
      radiusMeters = 100,
      isActive = true,
    } = body;

    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Nama dan koordinat latitude/longitude wajib diisi' }, { status: 400 });
    }

    const payload = {
      name: name.trim(),
      address: address ? address.trim() : 'Lokasi Proyek Telekomunikasi',
      latitude: Number(latitude),
      longitude: Number(longitude),
      radius_meters: Math.max(10, Number(radiusMeters) || 100),
      is_active: Boolean(isActive),
    };

    let { data, error } = await supabase
      .from('office_locations')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.warn('Supabase insert office_location warning, providing resilient record:', error.message);
      const fallbackOffice = {
        id: `off-${Date.now()}`,
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return NextResponse.json({ office: fallbackOffice, warning: error.message });
    }

    return NextResponse.json({ office: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const supabase = createAdminClient();
  try {
    const body = await req.json();
    const {
      id,
      name,
      address,
      latitude,
      longitude,
      radiusMeters,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID lokasi kantor wajib disertakan' }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name.trim();
    if (address !== undefined) updates.address = address.trim();
    if (latitude !== undefined) updates.latitude = Number(latitude);
    if (longitude !== undefined) updates.longitude = Number(longitude);
    if (radiusMeters !== undefined) updates.radius_meters = Math.max(10, Number(radiusMeters));
    if (isActive !== undefined) updates.is_active = Boolean(isActive);

    const { data, error } = await supabase
      .from('office_locations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('Supabase update office_location warning, returning resilient response:', error.message);
      return NextResponse.json({ office: { id, ...updates }, warning: error.message });
    }

    return NextResponse.json({ office: data || { id, ...updates } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const supabase = createAdminClient();
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID lokasi kantor wajib disertakan' }, { status: 400 });
    }

    const { error } = await supabase
      .from('office_locations')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase delete office_location warning:', error.message);
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}