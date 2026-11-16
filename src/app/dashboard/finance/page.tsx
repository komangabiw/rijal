'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatRupiah, formatDate } from '@/lib/utils';
import {
  DEMO_EXPENSES,
  DEMO_INVOICES,
  DEMO_PROJECTS,
} from '@/lib/mock-data';
import { ExpenseClaim, ExpenseCategory, Invoice } from '@/types/database';
import {
  ReceiptText,
  Plus,
  Coins,
  CheckCircle2,
  Clock,
  FileText,
  DollarSign,
  TrendingDown,
  ArrowRight,
  Upload,
  X,
  CreditCard,
  Building,
} from 'lucide-react';

export default function FinancePage() {
  const { user, role } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseClaim[]>(DEMO_EXPENSES);
  const [invoices, setInvoices] = useState<Invoice[]>(DEMO_INVOICES);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // New claim form state
  const [amount, setAmount] = useState('350000');
  const [category, setCategory] = useState<ExpenseCategory>('fuel');
  const [description, setDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(DEMO_PROJECTS[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stats calculation
  const totalInvoiced = invoices.reduce((acc, i) => acc + Number(i.total_amount), 0);
  const totalPaidInvoices = invoices.reduce((acc, i) => acc + Number(i.paid_amount), 0);
  const pendingInvoices = totalInvoiced - totalPaidInvoices;
  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

  // Multi-level approval handler (PM -> Finance -> Paid)
  const handleApproveClaim = (claimId: string, currentStatus: string) => {
    setExpenses((prev) =>
      prev.map((claim) => {
        if (claim.id !== claimId) return claim;

        if (currentStatus === 'pending_pm') {
          return {
            ...claim,
            status: 'pending_finance',
            pm_approved_by: user?.id || 'usr-pm-03',
            pm_approved_at: new Date().toISOString(),
            pm_notes: 'Disetujui PM sesuai RAB pekerjaan lapangan.',
          };
        } else if (currentStatus === 'pending_finance') {
          return {
            ...claim,
            status: 'paid',
            finance_approved_by: user?.id || 'usr-fin-04',
            finance_approved_at: new Date().toISOString(),
            finance_notes: 'Pencairan dana disetujui via Corporate Bank Mandiri.',
            paid_at: new Date().toISOString(),
            payment_reference: `TRF-MDR-${Math.floor(100000 + Math.random() * 900000)}`,
          };
        }
        return claim;
      })
    );
  };

  const handleCreateClaim = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const project = DEMO_PROJECTS.find((p) => p.id === selectedProjectId);
    const newClaim: ExpenseClaim = {
      id: `exp-${Date.now()}`,
      claim_number: `EXP-2026-11-${Math.floor(100 + Math.random() * 900)}`,
      user_id: user?.id || 'usr-tech-06',
      project_id: selectedProjectId,
      category,
      amount: Number(amount) || 0,
      expense_date: '2026-11-16',
      description: description || 'Pengeluaran operasional lapangan',
      receipt_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500',
      status: 'pending_pm',
      pm_approved_by: null,
      pm_approved_at: null,
      pm_notes: null,
      finance_approved_by: null,
      finance_approved_at: null,
      finance_notes: null,
      paid_at: null,
      payment_reference: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: user || undefined,
      project: project || undefined,
    };

    setTimeout(() => {
      setExpenses([newClaim, ...expenses]);
      setIsSubmitting(false);
      setShowClaimModal(false);
      setDescription('');
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-600" />
            Finansial Proyek, Reimbursement & Invoice
          </h1>
          <p className="text-xs text-slate-500">
            Alokasi RAB proyek, approval klaim biaya operasional bertingkat (PM & Finance), serta status penagihan termin klien.
          </p>
        </div>

        <Button
          onClick={() => setShowClaimModal(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold self-start sm:self-auto shadow"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Ajukan Reimbursement / Expense Baru
        </Button>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase">
              Total RAB Dialokasikan
            </CardTitle>
            <Building className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">
              {formatRupiah(1810000000)}
            </div>
            <p className="text-xs text-blue-600 font-medium mt-1">3 Proyek Aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase">
              Total Invoice Terbit
            </CardTitle>
            <FileText className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">
              {formatRupiah(totalInvoiced)}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Lunas: {formatRupiah(totalPaidInvoices)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase">
              Piutang Belum Cair (AR)
            </CardTitle>
            <Clock className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-700">
              {formatRupiah(pendingInvoices)}
            </div>
            <p className="text-xs text-amber-600 font-medium mt-1">Termin 2 & Modernisasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase">
              Total Klaim Operasional
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-900">
              {formatRupiah(totalExpenses)}
            </div>
            <p className="text-xs text-purple-600 font-medium mt-1">BBM, Izin & Sewa Alat</p>
          </CardContent>
        </Card>
      </div>

      {/* Reimbursement Claims Workflow Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ReceiptText className="w-4 h-4 text-amber-600" />
                Pipeline Approval Pengajuan Klaim Operasional
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Alur approval otomatis: Teknisi Submit → PM Review → Finance Release & Transfer
              </CardDescription>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Role Saat Ini: <strong className="text-slate-800 uppercase">{role}</strong>
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs min-w-[720px]">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">No. Klaim</th>
                  <th className="p-3">Pengaju</th>
                  <th className="p-3">Proyek & Kategori</th>
                  <th className="p-3">Nominal</th>
                  <th className="p-3">Bukti Nota</th>
                  <th className="p-3">Status Approval</th>
                  <th className="p-3 text-right">Aksi Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {expenses.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900">{claim.claim_number}</td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-900">{claim.user?.full_name || 'Teknisi'}</p>
                      <p className="text-[10px] text-slate-400">{formatDate(claim.expense_date)}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-slate-800">{claim.project?.name.substring(0, 30)}...</p>
                      <span className="text-[10px] uppercase font-semibold text-blue-600">
                        {claim.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">{formatRupiah(Number(claim.amount))}</td>
                    <td className="p-3">
                      <a
                        href={claim.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Lihat Struk
                      </a>
                    </td>
                    <td className="p-3">
                      {claim.status === 'pending_pm' && (
                        <Badge variant="warning" className="text-[10px]">
                          Menunggu Review PM
                        </Badge>
                      )}
                      {claim.status === 'pending_finance' && (
                        <Badge variant="default" className="text-[10px] bg-blue-600">
                          Menunggu Pencairan Finance
                        </Badge>
                      )}
                      {claim.status === 'paid' && (
                        <div className="space-y-0.5">
                          <Badge variant="success" className="text-[10px]">
                            Lunas Ditransfer
                          </Badge>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {claim.payment_reference}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {/* PM Approval Button */}
                      {claim.status === 'pending_pm' && (role === 'project_manager' || role === 'super_admin') && (
                        <Button
                          size="sm"
                          onClick={() => handleApproveClaim(claim.id, claim.status)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] h-7"
                        >
                          Approve (PM)
                        </Button>
                      )}

                      {/* Finance Approval Button */}
                      {claim.status === 'pending_finance' && (role === 'finance' || role === 'super_admin') && (
                        <Button
                          size="sm"
                          onClick={() => handleApproveClaim(claim.id, claim.status)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7"
                        >
                          Cairkan Dana (Finance)
                        </Button>
                      )}

                      {claim.status === 'paid' && (
                        <span className="text-emerald-600 font-semibold text-[11px] flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Selesai
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invoicing & Billing Milestones Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span>Daftar Invoice Termin Penagihan Klien</span>
            <Badge variant="outline" className="text-xs">
              {invoices.length} Faktur Aktif
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Penagihan berkala ke Telkomsel, Indosat, dan XL Axiata sesuai pencapaian BAST
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs min-w-[720px]">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">No. Invoice</th>
                  <th className="p-3">Klien</th>
                  <th className="p-3">Deskripsi Termin</th>
                  <th className="p-3">Jatuh Tempo</th>
                  <th className="p-3">DPP + PPN 11%</th>
                  <th className="p-3 text-right">Status Penagihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="p-3 font-semibold text-slate-800">{inv.client?.name}</td>
                    <td className="p-3 text-slate-700">{inv.milestone_name}</td>
                    <td className="p-3 text-slate-600 font-mono">{formatDate(inv.due_date)}</td>
                    <td className="p-3 font-bold text-slate-900">{formatRupiah(Number(inv.total_amount))}</td>
                    <td className="p-3 text-right">
                      <Badge
                        variant={inv.status === 'paid' ? 'success' : 'warning'}
                        className="text-[10px] uppercase font-semibold"
                      >
                        {inv.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Reimbursement Claim Modal Form */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl rounded-2xl border-slate-300 overflow-hidden max-h-[92vh] flex flex-col">
            <CardHeader className="bg-slate-50 border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ReceiptText className="w-4 h-4 text-amber-600" />
                  Form Pengajuan Biaya / Reimbursement
                </CardTitle>
                <button
                  onClick={() => setShowClaimModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <form onSubmit={handleCreateClaim} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Pilih Proyek Terkait</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-md p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-600"
                  >
                    {DEMO_PROJECTS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.project_code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Kategori Biaya</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-md p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-600"
                    >
                      <option value="fuel">Bahan Bakar (BBM Truk/Mobil)</option>
                      <option value="local_permit_koordinasi">Koordinasi Lapangan / Izin RW</option>
                      <option value="equipment_rental">Sewa Alat Bantu / Tangga</option>
                      <option value="accommodation">Akomodasi & Hotel Site</option>
                      <option value="toll_parking">Tol & Parkir Operasional</option>
                      <option value="material_local">Material Lokal Darurat</option>
                      <option value="other">Lain-lain</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Nominal (IDR)</label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      placeholder="350000"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Deskripsi Keperluan Lapangan</label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="BBM Solar Truk Operasional Penarikan Kabel FO Bekasi"
                    className="text-xs"
                  />
                </div>

                <div className="p-3 rounded-lg border border-dashed border-amber-300 bg-amber-50/40 text-center space-y-1">
                  <Upload className="w-5 h-5 mx-auto text-amber-600" />
                  <span className="text-xs font-semibold text-amber-900 block">
                    Upload Foto Struk / Kwitansi Pembayaran
                  </span>
                  <span className="text-[10px] text-amber-700 block">
                    Format JPG, PNG, atau PDF (Disimpan di Supabase Private Storage)
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClaimModal(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                  >
                    {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan Klaim'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
