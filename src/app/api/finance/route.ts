import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  try {
    const [expensesRes, invoicesRes] = await Promise.all([
      supabase
        .from('expense_claims')
        .select('*, user:profiles(*), project:projects(*)')
        .order('created_at', { ascending: false }),
      supabase
        .from('invoices')
        .select('*, client:clients(*), project:projects(*)')
        .order('created_at', { ascending: false }),
    ]);

    return NextResponse.json({
      expenses: expensesRes.data || [],
      invoices: invoicesRes.data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const supabase = createAdminClient();
  try {
    const body = await req.json();
    const { userId, projectId, category, amount, description, receiptUrl } = body;

    const payload = {
      claim_number: `EXP-2026-11-${Math.floor(100 + Math.random() * 900)}`,
      user_id:
        userId && userId.length === 36
          ? userId
          : 'a0000000-0000-0000-0000-000000000006',
      project_id: projectId || null,
      category: category || 'other',
      amount: amount || 0,
      expense_date: new Date().toISOString().slice(0, 10),
      description: description || 'Operasional lapangan',
      receipt_url: receiptUrl || null,
      status: 'pending_pm',
    };

    const { data, error } = await supabase
      .from('expense_claims')
      .insert(payload)
      .select('*, user:profiles(*), project:projects(*)')
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
    const { claimId, status, reviewerId, notes } = body;

    const updatePayload: any = { status };
    if (status === 'pending_finance') {
      updatePayload.pm_approved_by =
        reviewerId && reviewerId.length === 36
          ? reviewerId
          : 'a0000000-0000-0000-0000-000000000003';
      updatePayload.pm_approved_at = new Date().toISOString();
      updatePayload.pm_notes = notes || 'Disetujui PM';
    } else if (status === 'paid') {
      updatePayload.finance_approved_by =
        reviewerId && reviewerId.length === 36
          ? reviewerId
          : 'a0000000-0000-0000-0000-000000000004';
      updatePayload.finance_approved_at = new Date().toISOString();
      updatePayload.finance_notes = notes || 'Pencairan dana lunas';
      updatePayload.paid_at = new Date().toISOString();
      updatePayload.payment_reference = `TRF-CORP-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    const { data, error } = await supabase
      .from('expense_claims')
      .update(updatePayload)
      .eq('id', claimId)
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
