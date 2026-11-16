'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatRupiah, formatDate } from '@/lib/utils';
import {
  fetchExpenses,
  fetchInvoices,
  fetchProjects,
  submitExpenseClaim,
  updateExpenseStatus,
} from '@/lib/api-service';
import { ExpenseClaim, ExpenseCategory, Invoice, Project } from '@/types/database';
import {
  ReceiptText,
  Plus,
  Coins,
  CheckCircle2,
  Clock,
  FileText,
  DollarSign,
  TrendingDown,
  Upload,
  X,
  Building,
  Image as ImageIcon,
  Check,
  RefreshCw,
} from 'lucide-react';

export default function FinancePage() {
  const { user, role } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // New claim form state
  const [amount, setAmount] = useState('350000');
  const [category, setCategory] = useState<ExpenseCategory>('fuel');
  const [description, setDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load initial data from Supabase
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [expData, invData, projData] = await Promise.all([
        fetchExpenses(),
        fetchInvoices(),
        fetchProjects(),
      ]);
      setExpenses(expData);
      setInvoices(invData);
      setProjects(projData);
      if (projData.length > 0) {
        setSelectedProjectId(projData[0].id);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Stats calculation
  const totalInvoiced = invoices.reduce((acc, i) => acc + Number(i.total_amount || 0), 0);
  const totalPaidInvoices = invoices.reduce((acc, i) => acc + Number(i.paid_amount || 0), 0);
  const pendingInvoices = totalInvoiced - totalPaidInvoices;
  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

  // Multi-level approval handler (PM -> Finance -> Paid)
  const handleApproveClaim = async (claimId: string, currentStatus: string) => {
    const reviewerId = user?.id || (currentStatus === 'pending_pm' ? 'usr-pm-03' : 'usr-fin-04');
    const newStatus = currentStatus === 'pending_pm' ? 'pending_finance' : 'paid';

    // Optimistic UI update
    setExpenses((prev) =>
      prev.map((claim) => {
        if (claim.id !== claimId) return claim;
        if (currentStatus === 'pending_pm') {
          return {
            ...claim,
            status: 'pending_finance',
            pm_approved_by: reviewerId,
            pm_approved_at: new Date().toISOString(),
            pm_notes: 'Disetujui PM sesuai RAB pekerjaan lapangan.',
          };
        } else if (currentStatus === 'pending_finance') {
          return {
            ...claim,
            status: 'paid',
            finance_approved_by: reviewerId,
            finance_approved_at: new Date().toISOString(),
            finance_notes: 'Pencairan dana disetujui via Corporate Bank.',
            paid_at: new Date().toISOString(),
            payment_reference: `TRF-CORP-${Math.floor(100000 + Math.random() * 900000)}`,
          };
        }
        return claim;
      })
    );

    // Persist to Supabase
    await updateExpenseStatus(
      claimId,
      newStatus,
      reviewerId,
      currentStatus === 'pending_pm'
        ? 'Disetujui PM sesuai RAB pekerjaan lapangan.'
        : 'Pencairan dana disetujui via Corporate Bank.'
    );
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        setReceiptPreview(previewUrl);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newClaim = await submitExpenseClaim({
        userId: user?.id || 'usr-tech-06',
        projectId: selectedProjectId || undefined,
        category,
        amount: Number(amount) || 0,
        description: description || 'Pengeluaran operasional lapangan',
        receiptFile: receiptFile || undefined,
      });

      // Attach local relations for immediate display
      const proj = projects.find((p) => p.id === selectedProjectId);
      const claimWithRelations: ExpenseClaim = {
        ...newClaim,
        user: user || undefined,
        project: proj || undefined,
      };

      setExpenses((prev) => [claimWithRelations, ...prev]);
      setShowClaimModal(false);
      setDescription('');
      setReceiptFile(null);
      setReceiptPreview(null);
    } catch (err) {
      console.error('Failed to submit claim:', err);
    } finally {
      setIsSubmitting(false);
    }
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

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Supabase DB & Storage Aktif
          </Badge>
          <Button
            onClick={() => setShowClaimModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Ajukan Reimbursement Baru
          </Button>
        </div>
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
            <p className="text-xs text-blue-600 font-medium mt-1">{projects.length || 3} Proyek Terdaftar</p>
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
            <p className="text-xs text-amber-600 font-medium mt-1">Termin Proyek Lapangan</p>
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
            <span className="text-xs text-slate-500 font-mono">
              Role: <strong className="text-slate-800 uppercase">{role}</strong>
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
              Memuat data reimbursement...
            </div>
          ) : (
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
                        <p className="font-medium text-slate-800">
                          {claim.project?.name ? claim.project.name.substring(0, 30) + '...' : 'Proyek Lapangan'}
                        </p>
                        <span className="text-[10px] uppercase font-semibold text-blue-600">
                          {claim.category?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">{formatRupiah(Number(claim.amount))}</td>
                      <td className="p-3">
                        {claim.receipt_url ? (
                          <a
                            href={claim.receipt_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-medium"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Lihat Struk
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Tanpa lampiran</span>
                        )}
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
                            {claim.payment_reference && (
                              <span className="block text-[10px] text-slate-400 font-mono">
                                {claim.payment_reference}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {claim.status === 'pending_pm' && (role === 'project_manager' || role === 'super_admin') && (
                          <Button
                            size="sm"
                            onClick={() => handleApproveClaim(claim.id, claim.status)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] h-7"
                          >
                            Approve (PM)
                          </Button>
                        )}

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
          )}
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
                    <td className="p-3 font-semibold text-slate-800">{inv.client?.name || 'Klien Telekomunikasi'}</td>
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
                    {projects.map((p) => (
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

                {/* Real File Upload with Preview */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Upload Foto Struk / Kwitansi (Supabase Storage)</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,application/pdf"
                    onChange={handleReceiptFileChange}
                    className="hidden"
                  />

                  {receiptPreview ? (
                    <div className="relative rounded-lg border border-amber-300 overflow-hidden bg-amber-50 p-2 flex items-center gap-3">
                      <img
                        src={receiptPreview}
                        alt="Preview Struk"
                        className="w-16 h-16 object-cover rounded border border-amber-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{receiptFile?.name}</p>
                        <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium mt-0.5">
                          <Check className="w-3 h-3" /> Siap diunggah ke finance-receipts
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReceiptFile(null);
                          setReceiptPreview(null);
                        }}
                        className="text-slate-400 hover:text-red-600 h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : receiptFile ? (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-amber-600" />
                        <span className="text-xs font-medium text-slate-800">{receiptFile.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setReceiptFile(null)}
                        className="text-slate-400 hover:text-red-600 h-7 w-7 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 rounded-lg border border-dashed border-amber-300 bg-amber-50/40 text-center space-y-1 cursor-pointer hover:bg-amber-50 transition-colors"
                    >
                      <Upload className="w-6 h-6 mx-auto text-amber-600" />
                      <span className="text-xs font-semibold text-amber-900 block">
                        Klik untuk Pilih Foto Struk / Kwitansi
                      </span>
                      <span className="text-[10px] text-amber-700 block">
                        Format JPG, PNG, atau PDF (Disimpan ke Supabase Storage <code>finance-receipts</code>)
                      </span>
                    </div>
                  )}
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
                    {isSubmitting ? 'Mengunggah & Menyimpan...' : 'Kirim Pengajuan Klaim'}
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
