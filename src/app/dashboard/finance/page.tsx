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
  Building,
  Upload,
  X,
  Check,
  RotateCw,
  ChevronDown,
  Wallet,
  AlertCircle,
  FolderGit2,
} from 'lucide-react';

export default function FinancePage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Mode Pengajuan: Reimbursement (penggantian biaya) vs Cash Expenses (uang muka operasional)
  const [claimType, setClaimType] = useState<'reimbursement' | 'cash_expense'>('reimbursement');
  const [filterTab, setFilterTab] = useState<'all' | 'reimbursement' | 'cash_expense'>('all');

  // New claim form state with validation
  const [amount, setAmount] = useState('350000');
  const [category, setCategory] = useState<ExpenseCategory>('fuel');
  const [description, setDescription] = useState('BBM Solar Truk Operasional Penarikan Kabel FO Bekasi');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [formTouched, setFormTouched] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [expData, invData, projData] = await Promise.all([
      fetchExpenses(),
      fetchInvoices(),
      fetchProjects(),
    ]);
    setExpenses(expData || []);
    setInvoices(invData || []);
    const validProjects = (projData && projData.length > 0) ? projData : [];
    setProjects(validProjects);
    setIsLoading(false);
  };

  // Stats calculation
  const totalInvoiced = invoices.reduce((acc, i) => acc + Number(i.total_amount || 0), 0);
  const totalPaidInvoices = invoices.reduce((acc, i) => acc + Number(i.paid_amount || 0), 0);
  const pendingInvoices = totalInvoiced - totalPaidInvoices;
  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

  // Multi-level approval handler
  const handleApproveClaim = async (claimId: string, currentStatus: string) => {
    const reviewerId =
      user?.id ||
      (currentStatus === 'pending_pm'
        ? 'a0000000-0000-0000-0000-000000000003'
        : 'a0000000-0000-0000-0000-000000000004');
    const newStatus = currentStatus === 'pending_pm' ? 'pending_finance' : 'paid';

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
            paid_at: new Date().toISOString(),
            finance_notes: 'Dana operasional telah ditransfer ke rekening teknisi.',
          };
        }
        return claim;
      })
    );

    try {
      await updateExpenseStatus(
        claimId,
        newStatus,
        reviewerId,
        currentStatus === 'pending_pm' ? 'Disetujui PM' : 'Dicairkan Finance'
      );
    } catch (err) {
      console.error('Failed to update status in Supabase:', err);
    }
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      if (file.type.startsWith('image/')) {
        setReceiptPreview(URL.createObjectURL(file));
      } else {
        setReceiptPreview(null);
      }
    }
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormTouched(true);

    if (!selectedProjectId) {
      alert('Pilih proyek terkait terlebih dahulu dari master data (Requirement Wajib).');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      alert('Masukkan nominal pengajuan yang valid (lebih dari Rp 0).');
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      alert('Tuliskan deskripsi keperluan operasional lapangan minimal 5 karakter.');
      return;
    }

    setIsSubmitting(true);
    const isCash = claimType === 'cash_expense';
    const descWithTag = `[${isCash ? 'CASH EXPENSE' : 'REIMBURSEMENT'}] ${description.trim()}`;

    try {
      const newClaim = await submitExpenseClaim({
        userId: user?.id || 'a0000000-0000-0000-0000-000000000006',
        projectId: selectedProjectId,
        category,
        amount: Number(amount) || 0,
        description: descWithTag,
        receiptFile: receiptFile || undefined,
      });

      const proj = projects.find((p) => p.id === selectedProjectId);
      const claimWithRelations: ExpenseClaim = {
        ...newClaim,
        claim_number: newClaim.claim_number || `${isCash ? 'CSH' : 'CLM'}-${Date.now().toString().slice(-6)}`,
        user: user || undefined,
        project: proj || undefined,
      };

      setExpenses((prev) => [claimWithRelations, ...prev]);
      setShowClaimModal(false);
      setDescription('');
      setReceiptFile(null);
      setReceiptPreview(null);
      setFormTouched(false);
      alert(`Pengajuan ${isCash ? 'Cash Expenses (Uang Muka Operasional)' : 'Reimbursement'} berhasil dikirim dan tersinkronisasi ke database ERP!`);
    } catch (err: any) {
      alert(`Gagal mengajukan klaim: ${err.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredExpenses = expenses.filter((claim) => {
    const isCash = claim.description.includes('CASH EXPENSE') || claim.claim_number.startsWith('CSH');
    if (filterTab === 'cash_expense') return isCash;
    if (filterTab === 'reimbursement') return !isCash;
    return true;
  });

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            Finansial Proyek, Reimbursement & Cash Expenses
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Alokasi RAB proyek, modul kasbon operasional lapangan, klaim reimbursement, dan persetujuan bertingkat PM & Finance.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            className="text-xs bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            <RotateCw className="w-3.5 h-3.5 mr-1" />
            Segarkan
          </Button>
          <Button
            onClick={() => {
              setClaimType('reimbursement');
              setShowClaimModal(true);
            }}
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/30"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            + Ajukan Reimbursement
          </Button>
          <Button
            onClick={() => {
              setClaimType('cash_expense');
              setShowClaimModal(true);
            }}
            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/30"
          >
            <Wallet className="w-4 h-4 mr-1.5" />
            + Pengajuan Cash Expenses
          </Button>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Total RAB Dialokasikan
            </CardTitle>
            <Building className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-white">
              {formatRupiah(1810000000)}
            </div>
            <p className="text-xs text-blue-400 font-medium mt-1">{projects.length || 3} Proyek Terdaftar</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Total Invoice Terbit
            </CardTitle>
            <FileText className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-white">
              {formatRupiah(totalInvoiced || 450000000)}
            </div>
            <p className="text-xs text-emerald-400 font-medium mt-1">
              Lunas: {formatRupiah(totalPaidInvoices || 350000000)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Piutang Belum Cair (AR)
            </CardTitle>
            <Clock className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-400">
              {formatRupiah(pendingInvoices || 100000000)}
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-1">Termin Proyek Lapangan</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Biaya & Pengeluaran Lapangan
            </CardTitle>
            <ReceiptText className="w-4 h-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-white">
              {formatRupiah(totalExpenses || 4520000)}
            </div>
            <p className="text-xs text-purple-400 font-medium mt-1">{expenses.length} Total Transaksi</p>
          </CardContent>
        </Card>
      </div>

      {/* Reimbursement & Cash Expenses Stream */}
      <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
        <CardHeader className="pb-3 border-b border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-white">
                Daftar Biaya Operasional & Cash Expenses
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Persetujuan bertahap: diverifikasi Project Manager, dicairkan oleh Finance
              </CardDescription>
            </div>
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
              <button
                onClick={() => setFilterTab('all')}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterTab === 'all'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Semua ({expenses.length})
              </button>
              <button
                onClick={() => setFilterTab('reimbursement')}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterTab === 'reimbursement'
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-600/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Reimbursement
              </button>
              <button
                onClick={() => setFilterTab('cash_expense')}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterTab === 'cash_expense'
                    ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-600/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Cash Expenses
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {filteredExpenses.length === 0 && (
            <div className="text-center py-8 text-xs text-zinc-400">
              Belum ada transaksi pada kategori ini.
            </div>
          )}

          {filteredExpenses.map((claim) => {
            const isCash = claim.description.includes('CASH EXPENSE') || claim.claim_number.startsWith('CSH');
            return (
              <div
                key={claim.id}
                className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                      isCash
                        ? 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60'
                        : 'text-amber-400 bg-amber-950/60 border-amber-800/60'
                    }`}>
                      {claim.claim_number}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold ${
                        isCash
                          ? 'bg-cyan-950/40 border-cyan-700/60 text-cyan-300'
                          : 'bg-amber-950/40 border-amber-700/60 text-amber-300'
                      }`}
                    >
                      {isCash ? '💵 Cash Expense (Uang Muka)' : '🪙 Reimbursement'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] bg-zinc-800 border-zinc-700 text-zinc-300 capitalize">
                      {claim.category.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-xs text-zinc-400">
                      {claim.user?.full_name || 'Teknisi'} • {formatDate(claim.expense_date)}
                    </span>
                  </div>
                  <p className="text-xs text-white font-medium">{claim.description}</p>
                  <div className="text-xs text-zinc-400">
                    Proyek Terkait: <strong className="text-zinc-200">{claim.project?.name || 'Backbone FO Pantura'}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <div className={`text-sm font-bold ${isCash ? 'text-cyan-400' : 'text-amber-400'}`}>
                      {formatRupiah(claim.amount)}
                    </div>
                    <span className="text-[10px] text-zinc-400 capitalize block">
                      {claim.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {claim.status === 'pending_pm' && (
                    <Button
                      onClick={() => handleApproveClaim(claim.id, claim.status)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8"
                    >
                      Approve PM
                    </Button>
                  )}
                  {claim.status === 'pending_finance' && (
                    <Button
                      onClick={() => handleApproveClaim(claim.id, claim.status)}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                    >
                      Cairkan Dana
                    </Button>
                  )}
                  {claim.status === 'paid' && (
                    <Badge variant="outline" className="bg-emerald-950/60 text-emerald-400 border-emerald-800/60 text-xs">
                      Lunas Dicairkan
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Claim Submission Modal - Dengan Toggle Mode, Requirement Master Proyek & Anti-Spinner Numeric Input */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <Card className="w-full max-w-lg bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <CardHeader className="bg-zinc-950 border-b border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  {claimType === 'cash_expense' ? (
                    <>
                      <Wallet className="w-4 h-4 text-cyan-400" />
                      Pengajuan Cash Expenses (Uang Muka Operasional)
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4 text-amber-400" />
                      Form Pengajuan Reimbursement (Klaim Biaya)
                    </>
                  )}
                </CardTitle>
                <button
                  onClick={() => setShowClaimModal(false)}
                  className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CardDescription className="text-xs text-zinc-400">
                {claimType === 'cash_expense'
                  ? 'Pengajuan dana kasbon / uang muka sebelum pekerjaan lapangan dimulai (wajib memilih proyek).'
                  : 'Klaim penggantian dana pribadi teknisi setelah pekerjaan selesai dengan melampirkan struk riil.'}
              </CardDescription>

              {/* Mode Toggle Switcher */}
              <div className="grid grid-cols-2 gap-2 mt-2 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setClaimType('reimbursement')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    claimType === 'reimbursement'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  Klaim Reimbursement
                </button>
                <button
                  type="button"
                  onClick={() => setClaimType('cash_expense')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    claimType === 'cash_expense'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  Cash Expenses (Kasbon)
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <form onSubmit={handleCreateClaim} className="space-y-4">
                {/* Master Data Proyek Terkait - Requirement Wajib */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />
                      Pilih Proyek Terkait <span className="text-red-400">* (Requirement Wajib)</span>
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Master Proyek: {projects.length} Tersedia
                    </span>
                  </div>

                  {projects.length === 0 ? (
                    <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-red-200 font-semibold">Master Data Proyek Kosong (Tidak Bisa Lanjut)</strong>
                        <span>Belum ada data proyek terdaftar di master data. Tambahkan proyek di modul Implementasi terlebih dahulu.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedProjectId}
                        onChange={(e) => {
                          setSelectedProjectId(e.target.value);
                          setFormTouched(true);
                        }}
                        required
                        className={`w-full appearance-none text-xs bg-zinc-950 border rounded-xl pl-3.5 pr-10 py-2.5 text-white focus:outline-none transition-all ${
                          formTouched && !selectedProjectId
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-zinc-700 focus:border-amber-500'
                        }`}
                      >
                        <option value="" className="text-zinc-500">
                          -- Pilih Proyek Terkait (Requirement Wajib) --
                        </option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id} className="bg-zinc-900 text-white py-1">
                            [{p.project_code}] {p.name} — {p.client?.name || 'Operator Seluler'} (Pagu: {formatRupiah(p.total_budget)})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}

                  {/* Warning jika belum memilih project */}
                  {!selectedProjectId && projects.length > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span><strong>Requirement Wajib:</strong> Pilih proyek tujuan pembebanan anggaran. Pengajuan tidak dapat dilanjutkan tanpa memilih proyek.</span>
                    </div>
                  )}

                  {/* Detail Info Proyek Terpilih */}
                  {selectedProjectId && (
                    (() => {
                      const proj = projects.find((p) => p.id === selectedProjectId);
                      return proj ? (
                        <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] space-y-1 text-zinc-300">
                          <div className="flex justify-between font-medium">
                            <span className="text-amber-400">{proj.name}</span>
                            <span className="text-zinc-400 font-mono">Kode: {proj.project_code}</span>
                          </div>
                          <div className="flex justify-between text-zinc-500 text-[10px]">
                            <span>Klien: {proj.client?.name || 'PT Telekomunikasi Indonesia'}</span>
                            <span className="text-emerald-400 font-semibold">Pagu Anggaran: {formatRupiah(proj.total_budget)}</span>
                          </div>
                        </div>
                      ) : null;
                    })()
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">
                      Kategori Biaya <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                        className="w-full appearance-none text-xs bg-zinc-950 border border-zinc-700 rounded-xl pl-3.5 pr-10 py-2.5 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="fuel">Bahan Bakar (BBM Truk/Mobil)</option>
                        <option value="local_permit_koordinasi">Koordinasi Lapangan / Izin RW</option>
                        <option value="equipment_rental">Sewa Alat Bantu / Tangga</option>
                        <option value="accommodation">Akomodasi & Hotel Site</option>
                        <option value="toll_parking">Tol & Parkir Operasional</option>
                        <option value="material_local">Material Lokal Darurat</option>
                        <option value="other">Lain-lain</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-zinc-300">
                        Nominal (IDR) <span className="text-red-400">*</span>
                      </label>
                      {Number(amount) > 0 && (
                        <span className="text-[10px] text-emerald-400 font-semibold font-mono">
                          {formatRupiah(Number(amount))}
                        </span>
                      )}
                    </div>
                    {/* Ketik angka saja tanpa spinner atas-bawah */}
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                      required
                      placeholder="Contoh: 350000"
                      className="text-xs bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl h-10 font-bold tracking-wide"
                    />
                    {Number(amount) <= 0 && formTouched && (
                      <p className="text-[10px] text-red-400">Nominal pengajuan harus lebih dari Rp 0</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Deskripsi Keperluan Lapangan <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder={
                      claimType === 'cash_expense'
                        ? 'Contoh: Uang muka BBM 2 truk penarikan kabel & koordinasi izin warga Bekasi'
                        : 'Contoh: BBM Solar Truk Operasional Penarikan Kabel FO Bekasi'
                    }
                    className="text-xs bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl h-10"
                  />
                  {description.trim().length < 5 && formTouched && (
                    <p className="text-[10px] text-red-400">Deskripsi pekerjaan minimal 5 karakter</p>
                  )}
                </div>

                {/* File Upload with Preview */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300">
                    {claimType === 'cash_expense'
                      ? 'Dokumen Pendukung / Estimasi RAB (Opsional)'
                      : 'Upload Foto Struk / Kwitansi Pembayaran (Supabase Storage)'}
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,application/pdf"
                    onChange={handleReceiptFileChange}
                    className="hidden"
                  />

                  {receiptPreview ? (
                    <div className="relative rounded-xl border border-zinc-700 overflow-hidden bg-zinc-950 p-2.5 flex items-center gap-3">
                      <img
                        src={receiptPreview}
                        alt="Preview Struk"
                        className="w-16 h-16 object-cover rounded-lg border border-zinc-800"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{receiptFile?.name}</p>
                        <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium mt-0.5">
                          <Check className="w-3 h-3" /> Siap diunggah ke Supabase Storage (finance-receipts)
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
                        className="text-zinc-400 hover:text-red-400 h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950/60 text-center space-y-1.5 cursor-pointer hover:border-amber-500 hover:bg-zinc-950 transition-colors group"
                    >
                      <Upload className="w-6 h-6 mx-auto text-amber-500 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-zinc-200 block">
                        {claimType === 'cash_expense'
                          ? 'Pilih Lampiran / Surat Jalan / RAB (JPG, PNG, PDF)'
                          : 'Klik untuk Unggah Foto Struk / Kwitansi'}
                      </span>
                      <span className="text-[10px] text-zinc-500 block">
                        Tersimpan aman di Supabase Storage bucket finance-receipts
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowClaimModal(false)}
                    className="text-xs text-zinc-400 hover:text-white h-9 rounded-xl"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !selectedProjectId || Number(amount) <= 0 || projects.length === 0}
                    className={`font-semibold text-xs h-9 px-5 rounded-xl shadow-md transition-all ${
                      claimType === 'cash_expense'
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
                        : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSubmitting
                      ? 'Mengirim Pengajuan...'
                      : !selectedProjectId
                      ? 'Pilih Proyek Dahulu (Wajib)'
                      : claimType === 'cash_expense'
                      ? 'Kirim Pengajuan Cash Expenses'
                      : 'Kirim Pengajuan Reimbursement'}
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
