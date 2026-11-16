import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  try {
    const { data, error } = await supabase
      .from('attendances')
      .select('*, profile:profiles(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('API GET attendances error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    console.error('API GET attendances exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const supabase = createAdminClient();
  try {
    const body = await req.json();
    const {
      userId,
      status = 'present',
      latitude,
      longitude,
      officeId,
      address,
      notes,
      photoUrl,
    } = body;

    // Fallback to valid technician UUID if userId is empty or legacy format
    const validUserId =
      userId && userId.length === 36
        ? userId
        : 'a0000000-0000-0000-0000-000000000006';

    const validOfficeId =
      officeId && officeId.length === 36 ? officeId : null;

    const payload = {
      user_id: validUserId,
      date: new Date().toISOString().slice(0, 10),
      status: status,
      clock_in_time: new Date().toISOString(),
      clock_in_latitude: latitude || -6.239308,
      clock_in_longitude: longitude || 106.82711,
      clock_in_address: address || 'Site Lapangan FO',
      clock_in_photo_url: photoUrl || null,
      clock_in_office_id: validOfficeId,
      clock_in_distance_meters: 15,
      notes: notes || null,
      verification_status: 'approved',
    };

    const { data, error } = await supabase
      .from('attendances')
      .upsert(payload, { onConflict: 'user_id, date' })
      .select('*, profile:profiles(*)')
      .single();

    if (error) {
      console.error('API POST attendance error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('API POST attendance exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
