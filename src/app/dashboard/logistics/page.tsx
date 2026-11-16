'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatDate, formatDateTime } from '@/lib/utils';
import {
  fetchDeliveryOrders,
  submitProofOfDelivery,
  submitDeliveryOrder,
} from '@/lib/api-service';
import {
  DEMO_MATERIAL_REQUESTS,
  DEMO_PROJECTS,
  DEMO_WAREHOUSES,
  DEMO_ITEMS,
} from '@/lib/mock-data';
import { DeliveryOrder } from '@/types/database';
import { SignaturePad } from '@/components/ui/signature-pad';
import {
  Truck,
  Plus,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  Camera,
  PenTool,
  X,
  Upload,
  Check,
  RotateCw,
} from 'lucide-react';

export default function LogisticsPage() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [requests, setRequests] = useState(DEMO_MATERIAL_REQUESTS);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
  const [showPodModal, setShowPodModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  // POD Modal form state
  const [recipientName, setRecipientName] = useState('Rian Firmansyah (Teknisi Lapangan)');
  const [podNotes, setPodNotes] = useState('Barang diterima lengkap dan telah diverifikasi sebelum penarikan.');
  const [signatureBlob, setSignatureBlob] = useState<Blob | null>(null);
  const [podPhotoFile, setPodPhotoFile] = useState<File | null>(null);
  const [podPhotoPreview, setPodPhotoPreview] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // Dispatch modal state
  const [sourceWhId, setSourceWhId] = useState(DEMO_WAREHOUSES[0].id);
  const [destProjId, setDestProjId] = useState(DEMO_PROJECTS[0].id);
  const [driverName, setDriverName] = useState('Agus Waluyo');
  const [driverPhone, setDriverPhone] = useState('+6281299887766');
  const [vehicleNumber, setVehicleNumber] = useState('B 9231 TKL');
  const [isDispatching, setIsDispatching] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchDeliveryOrders();
    setDeliveries(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenPod = (delivery: DeliveryOrder) => {
    setSelectedDelivery(delivery);
    setSignatureBlob(null);
    setPodPhotoFile(null);
    setPodPhotoPreview(null);
    setShowPodModal(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPodPhotoFile(file);
      setPodPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleConfirmPod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    setIsSigning(true);

    try {
      await submitProofOfDelivery({
        deliveryOrderId: selectedDelivery.id,
        recipientName,
        notes: podNotes,
        signatureBlob: signatureBlob || undefined,
        podPhotoFile: podPhotoFile || undefined,
      });

      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === selectedDelivery.id
            ? {
                ...d,
                status: 'delivered',
                delivered_at: new Date().toISOString(),
                recipient_name: recipientName,
                pod_notes: podNotes,
              }
            : d
        )
      );

      setShowPodModal(false);
    } catch (err) {
      console.error('Failed to submit POD:', err);
    } finally {
      setIsSigning(false);
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatching(true);

    try {
      const newDo = await submitDeliveryOrder({
        sourceWarehouseId: sourceWhId,
        destinationProjectId: destProjId,
        driverName,
        driverPhone,
        vehicleNumber,
        createdBy: user?.id || 'a0000000-0000-0000-0000-000000000005',
      });

      const wh = DEMO_WAREHOUSES.find((w) => w.id === sourceWhId);
      const proj = DEMO_PROJECTS.find((p) => p.id === destProjId);
      const deliveryWithRel: DeliveryOrder = {
        ...newDo,
        warehouse: wh || undefined,
        project: proj || undefined,
      };

      setDeliveries((prev) => [deliveryWithRel, ...prev]);
      setShowDispatchModal(false);
    } catch (err) {
      console.error('Failed to dispatch:', err);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-400" />
            Logistik Distribusi, Surat Jalan & POD Digital
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Pengiriman material FO dari Central Warehouse, monitoring driver, dan konfirmasi serah terima Proof of Delivery (POD).
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
            onClick={() => setShowDispatchModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Terbitkan Surat Jalan Baru
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Surat Jalan Sedang Transit
            </CardTitle>
            <Truck className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">
              {deliveries.filter((d) => d.status === 'in_transit').length} Pengiriman
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-1">Dalam Perjalanan ke Site Lapangan</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Pengiriman Berhasil (Delivered)
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {deliveries.filter((d) => d.status === 'delivered').length} Selesai
            </div>
            <p className="text-xs text-emerald-400 font-medium mt-1">POD Tervalidasi & TTD Lengkap</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Permintaan Material Menunggu
            </CardTitle>
            <FileText className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{requests.length} Request</div>
            <p className="text-xs text-blue-400 font-medium mt-1">Disetujui PM untuk Dispatch</p>
          </CardContent>
        </Card>
      </div>

      {/* Material Requests Pending Dispatch */}
      <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
        <CardHeader className="pb-3 border-b border-zinc-800/80">
          <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
            <span>Permintaan Material Menunggu Pengiriman</span>
            <Badge variant="outline" className="text-xs bg-zinc-800 border-zinc-700 text-zinc-300">
              {requests.length} Permintaan Masuk
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Diajukan oleh teknisi lapangan dari modul Implementasi Proyek dan disetujui oleh Project Manager
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {requests.map((mr) => (
            <div
              key={mr.id}
              className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded">
                    {mr.request_number}
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-emerald-950/60 text-emerald-400 border-emerald-800/60">
                    PM Approved
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-white">
                  {mr.project?.name}
                </p>
                <p className="text-xs text-zinc-400">{mr.notes}</p>
                <div className="text-[11px] text-zinc-400 pt-1">
                  Dibutuhkan: <strong className="text-zinc-200">{formatDate(mr.needed_date)}</strong> • Pemohon: {mr.requester?.full_name}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setShowDispatchModal(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
                >
                  Kirim via Surat Jalan
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Delivery Orders Table */}
      <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
        <CardHeader className="pb-3 border-b border-zinc-800/80">
          <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
            <span>Daftar Surat Jalan Digital & Pelacakan Armada</span>
            <Badge variant="outline" className="text-xs bg-zinc-800 border-zinc-700 text-zinc-300">
              {deliveries.length} Pengiriman
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Monitoring armada pengiriman dari Central Warehouse hingga tanda tangan serah terima di lokasi site
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="overflow-x-auto rounded-xl border border-zinc-800 -mx-2 sm:mx-0">
            <table className="w-full text-left text-xs min-w-[720px]">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase font-semibold border-b border-zinc-800">
                <tr>
                  <th className="p-3">No. Surat Jalan</th>
                  <th className="p-3">Gudang Asal</th>
                  <th className="p-3">Destinasi Site & Proyek</th>
                  <th className="p-3">Armada / Driver</th>
                  <th className="p-3">Status Pengiriman</th>
                  <th className="p-3 text-right">Proof of Delivery (POD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 bg-zinc-900">
                {deliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="p-3">
                      <span className="font-mono font-bold text-white block">{del.delivery_number}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">{formatDateTime(del.dispatched_at)}</span>
                    </td>
                    <td className="p-3 font-medium text-zinc-300">
                      {del.warehouse?.name?.replace('Central Warehouse ', '') || 'Central Cikarang'}
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-white">
                        {del.project?.name ? del.project.name.substring(0, 32) + '...' : 'Proyek Fiber Optic'}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-red-400" />
                        {del.site?.name || 'Site Cluster Lapangan'}
                      </p>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-white">{del.driver_name}</p>
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1 py-0.5 rounded">
                        {del.vehicle_number}
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize ${
                          del.status === 'delivered'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                            : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                        }`}
                      >
                        {del.status?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {del.status === 'in_transit' ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenPod(del)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] h-7 shadow"
                        >
                          <PenTool className="w-3 h-3 mr-1" />
                          Konfirmasi & Tanda Tangan POD
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-emerald-950/60 text-emerald-400 border-emerald-800/60">
                          POD Selesai
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Proof of Delivery (POD) Modal */}
      {showPodModal && selectedDelivery && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <Card className="w-full max-w-lg bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <CardHeader className="bg-zinc-950 border-b border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-emerald-400" />
                  Konfirmasi Serah Terima Barang (POD)
                </CardTitle>
                <button
                  onClick={() => setShowPodModal(false)}
                  className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CardDescription className="text-xs text-zinc-400">
                Surat Jalan: {selectedDelivery.delivery_number} • Driver: {selectedDelivery.driver_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <form onSubmit={handleConfirmPod} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Nama Penerima Lapangan</label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    required
                    placeholder="Nama Lengkap Teknisi / Mandor"
                    className="text-xs bg-zinc-800/90 border-zinc-700 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Catatan Kondisi Barang</label>
                  <Input
                    value={podNotes}
                    onChange={(e) => setPodNotes(e.target.value)}
                    placeholder="Semua kabel FO dan closure diterima baik"
                    className="text-xs bg-zinc-800/90 border-zinc-700 text-white"
                  />
                </div>

                {/* Digital Signature Canvas */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Tanda Tangan Digital Penerima (Gunakan Touchscreen / Mouse)
                  </label>
                  <div className="rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950">
                    <SignaturePad onSave={(blob: Blob) => setSignatureBlob(blob)} />
                  </div>
                </div>

                {/* Photo Evidence */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300">Foto Bukti Barang di Lokasi</label>
                  <input
                    type="file"
                    ref={photoInputRef}
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />

                  {podPhotoPreview ? (
                    <div className="relative rounded-xl border border-zinc-700 overflow-hidden bg-zinc-950 p-2 flex items-center gap-3">
                      <img src={podPhotoPreview} alt="POD" className="w-16 h-16 object-cover rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-white block truncate">{podPhotoFile?.name}</span>
                        <span className="text-[10px] text-emerald-400">Foto siap diunggah ke logistics-pod</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPodPhotoFile(null);
                          setPodPhotoPreview(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => photoInputRef.current?.click()}
                      className="p-3.5 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                    >
                      <Camera className="w-5 h-5 mx-auto text-zinc-500 mb-1" />
                      <span className="text-xs text-zinc-300 block font-medium">Klik untuk upload foto barang di site</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPodModal(false)}
                    className="text-xs bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSigning}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                  >
                    {isSigning ? 'Menyimpan POD...' : 'Konfirmasi Penerimaan (POD Selesai)'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <Card className="w-full max-w-lg bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <CardHeader className="bg-zinc-950 border-b border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-indigo-400" />
                  Terbitkan Surat Jalan Baru
                </CardTitle>
                <button
                  onClick={() => setShowDispatchModal(false)}
                  className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <form onSubmit={handleDispatch} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Gudang Asal</label>
                  <select
                    value={sourceWhId}
                    onChange={(e) => setSourceWhId(e.target.value)}
                    className="w-full text-xs bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white"
                  >
                    {DEMO_WAREHOUSES.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.code} - {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Destinasi Proyek</label>
                  <select
                    value={destProjId}
                    onChange={(e) => setDestProjId(e.target.value)}
                    className="w-full text-xs bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white"
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
                    <label className="text-xs font-semibold text-zinc-300">Nama Driver</label>
                    <Input
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      required
                      className="text-xs bg-zinc-800/90 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Nomor Kendaraan</label>
                    <Input
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      required
                      className="text-xs bg-zinc-800/90 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDispatchModal(false)}
                    className="text-xs bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isDispatching}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
                  >
                    {isDispatching ? 'Menerbitkan...' : 'Terbitkan Surat Jalan'}
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
