import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createAdminClient();
  try {
    const [expensesRes, invoicesRes] = await Promise.all([
      supabase
        .from('expense_claims')
        .select('*, user:profiles!expense_claims_user_id_fkey(*), project:projects(*)')
        .order('created_at', { ascending: false }),
      supabase
        .from('invoices')
        .select('*, client:clients(*), project:projects(*)')
        .order('created_at', { ascending: false }),
    ]);

    let expenses = expensesRes.data || [];
    if (expensesRes.error) {
      console.warn('GET expense_claims join failed, falling back to raw select:', expensesRes.error.message);
      const fallback = await supabase
        .from('expense_claims')
        .select('*')
        .order('created_at', { ascending: false });
      expenses = fallback.data || [];
    }

    return NextResponse.json({
      expenses,
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

    let { data, error } = await supabase
      .from('expense_claims')
      .insert(payload)
      .select('*, user:profiles!expense_claims_user_id_fkey(*), project:projects(*)')
      .single();

    if (error) {
      console.warn('POST expense_claim join failed, fallback raw insert:', error.message);
      const rawRes = await supabase
        .from('expense_claims')
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
    const { id, status, pmApprovedBy, financeApprovedBy, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing claim ID' }, { status: 400 });
    }

    const updates: any = { status, updated_at: new Date().toISOString() };
    if (pmApprovedBy) {
      updates.pm_approved_by = pmApprovedBy;
      updates.pm_approved_at = new Date().toISOString();
      if (notes) updates.pm_notes = notes;
    }
    if (financeApprovedBy) {
      updates.finance_approved_by = financeApprovedBy;
      updates.finance_approved_at = new Date().toISOString();
      if (notes) updates.finance_notes = notes;
    }

    const { data, error } = await supabase
      .from('expense_claims')
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
