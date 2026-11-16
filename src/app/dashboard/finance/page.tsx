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
} from 'lucide-react';

export default function FinancePage() {
  const { user } = useAuth();
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
    setProjects(projData || []);
    if (projData && projData.length > 0) {
      setSelectedProjectId(projData[0].id);
    }
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
    setIsSubmitting(true);

    try {
      const newClaim = await submitExpenseClaim({
        userId: user?.id || 'a0000000-0000-0000-0000-000000000006',
        projectId: selectedProjectId || undefined,
        category,
        amount: Number(amount) || 0,
        description,
        receiptFile: receiptFile || undefined,
      });

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
    <div className="space-y-6 text-zinc-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            Finansial Proyek, Reimbursement & Invoice
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Alokasi RAB proyek, approval klaim biaya operasional bertingkat (PM & Finance), serta status penagihan termin klien.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            className="text-xs bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            <RotateCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowClaimModal(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/30"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Ajukan Reimbursement Baru
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
              Klaim Operasional Lapangan
            </CardTitle>
            <ReceiptText className="w-4 h-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-white">
              {formatRupiah(totalExpenses || 4520000)}
            </div>
            <p className="text-xs text-purple-400 font-medium mt-1">{expenses.length} Pengajuan</p>
          </CardContent>
        </Card>
      </div>

      {/* Reimbursement Claims Stream */}
      <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
        <CardHeader className="pb-3 border-b border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-bold text-white">
                Daftar Klaim Reimbursement Operasional
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Persetujuan bertahap oleh Project Manager lalu dicairkan oleh Finance
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs bg-zinc-800 border-zinc-700 text-zinc-300 w-fit">
              Total {expenses.length} Klaim
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {expenses.length === 0 && (
            <div className="text-center py-8 text-xs text-zinc-400">
              Belum ada klaim reimbursement tersimpan.
            </div>
          )}

          {expenses.map((claim) => (
            <div
              key={claim.id}
              className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                    {claim.claim_number}
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-zinc-800 border-zinc-700 text-zinc-300 capitalize">
                    {claim.category.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-xs text-zinc-400">
                    {claim.user?.full_name || 'Teknisi'} • {formatDate(claim.expense_date)}
                  </span>
                </div>
                <p className="text-xs text-white font-medium">{claim.description}</p>
                <div className="text-xs text-zinc-400">
                  Proyek: <strong className="text-zinc-200">{claim.project?.name || 'Backbone FO Pantura'}</strong>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <div className="text-right">
                  <div className="text-sm font-bold text-amber-400">
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
                    Lunas
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Claim Submission Modal - Clean Dark UI */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <Card className="w-full max-w-lg bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <CardHeader className="bg-zinc-950 border-b border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Ajukan Reimbursement Operasional
                </CardTitle>
                <button
                  onClick={() => setShowClaimModal(false)}
                  className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CardDescription className="text-xs text-zinc-400">
                Klaim BBM, koordinasi lapangan, hotel, sewa alat bantu & material darurat
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <form onSubmit={handleCreateClaim} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Pilih Proyek Terkait</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full text-xs bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                    <label className="text-xs font-semibold text-zinc-300">Kategori Biaya</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                      className="w-full text-xs bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                    <label className="text-xs font-semibold text-zinc-300">Nominal (IDR)</label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      placeholder="350000"
                      className="text-xs bg-zinc-800/90 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Deskripsi Keperluan Lapangan</label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="BBM Solar Truk Operasional Penarikan Kabel FO Bekasi"
                    className="text-xs bg-zinc-800/90 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                </div>

                {/* File Upload with Preview */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300">Upload Foto Struk / Kwitansi (Supabase Storage)</label>
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
                        className="text-zinc-400 hover:text-red-400 h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 text-center space-y-1 cursor-pointer hover:border-amber-500 transition-colors group"
                    >
                      <Upload className="w-6 h-6 mx-auto text-zinc-500 group-hover:text-amber-400" />
                      <span className="text-xs font-semibold text-zinc-300 block">
                        Klik untuk Pilih Foto Struk / Kwitansi
                      </span>
                      <span className="text-[10px] text-zinc-500 block">
                        Format JPG, PNG, atau PDF (Disimpan ke Supabase Storage finance-receipts)
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClaimModal(false)}
                    className="text-xs bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs"
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
