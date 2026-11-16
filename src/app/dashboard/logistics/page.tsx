'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatDate, formatDateTime } from '@/lib/utils';
import {
  DEMO_DELIVERY_ORDERS,
  DEMO_MATERIAL_REQUESTS,
  DEMO_PROJECTS,
  DEMO_WAREHOUSES,
  DEMO_ITEMS,
} from '@/lib/mock-data';
import { DeliveryOrder, DeliveryStatus } from '@/types/database';
import {
  Truck,
  Plus,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  Camera,
  PenTool,
  Navigation,
  X,
  Sparkles,
} from 'lucide-react';

export default function LogisticsPage() {
  const { user, role } = useAuth();
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>(DEMO_DELIVERY_ORDERS);
  const [requests, setRequests] = useState(DEMO_MATERIAL_REQUESTS);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
  const [showPodModal, setShowPodModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  // POD Modal form state
  const [recipientName, setRecipientName] = useState('Rian Firmansyah (Teknisi)');
  const [podNotes, setPodNotes] = useState('Barang diterima lengkap dan telah diuji sebelum penarikan.');
  const [isSigning, setIsSigning] = useState(false);

  // Dispatch modal state
  const [driverName, setDriverName] = useState('Agus Waluyo');
  const [vehicleNumber, setVehicleNumber] = useState('B 9231 TKL');

  const handleOpenPod = (delivery: DeliveryOrder) => {
    setSelectedDelivery(delivery);
    setShowPodModal(true);
  };

  const handleConfirmPod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    setIsSigning(true);

    setTimeout(() => {
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === selectedDelivery.id
            ? {
                ...d,
                status: 'delivered',
                delivered_at: new Date().toISOString(),
                recipient_name: recipientName,
                recipient_signature_url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300',
                pod_photo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400',
                pod_notes: podNotes,
              }
            : d
        )
      );
      setIsSigning(false);
      setShowPodModal(false);
    }, 500);
  };

  const handleCreateSuratJalan = (e: React.FormEvent) => {
    e.preventDefault();
    const newSJ: DeliveryOrder = {
      id: `do-${Date.now()}`,
      delivery_number: `SJ-2026-11-${Math.floor(100 + Math.random() * 900)}`,
      material_request_id: requests[0].id,
      source_warehouse_id: DEMO_WAREHOUSES[0].id,
      destination_project_id: DEMO_PROJECTS[0].id,
      destination_site_id: 'site-02',
      driver_name: driverName,
      driver_phone: '+6281299887766',
      vehicle_number: vehicleNumber,
      status: 'in_transit',
      dispatched_at: new Date().toISOString(),
      delivered_at: null,
      recipient_name: null,
      recipient_phone: null,
      recipient_signature_url: null,
      pod_photo_url: null,
      pod_notes: null,
      created_by: user?.id || 'usr-wh-05',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      warehouse: DEMO_WAREHOUSES[0],
      project: DEMO_PROJECTS[0],
      items: [
        {
          id: `doi-${Date.now()}`,
          delivery_order_id: `do-${Date.now()}`,
          item_id: DEMO_ITEMS[0].id,
          quantity: 1500,
          item: DEMO_ITEMS[0],
        },
      ],
    };

    setDeliveries([newSJ, ...deliveries]);
    setShowDispatchModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            Logistik Pengiriman, Surat Jalan & POD
          </h1>
          <p className="text-xs text-slate-500">
            Distribusi armada pengantar kabel optik ke site proyek, pelacakan status Surat Jalan, dan Proof of Delivery digital.
          </p>
        </div>

        <Button
          onClick={() => setShowDispatchModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold self-start sm:self-auto shadow"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Terbitkan Surat Jalan Baru
        </Button>
      </div>

      {/* Material Requests Linking Cards */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Permintaan Material Proyek (Material Request / MR)</span>
            <Badge variant="outline" className="text-xs">
              {requests.length} Permintaan Masuk
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Diajukan oleh teknisi lapangan dari modul Implementasi Proyek dan disetujui oleh Project Manager
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requests.map((mr) => (
              <div
                key={mr.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-900 bg-white border px-2 py-0.5 rounded">
                      {mr.request_number}
                    </span>
                    <Badge variant="success" className="text-[10px]">
                      PM Approved
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">
                    {mr.project?.name}
                  </p>
                  <p className="text-xs text-slate-500">{mr.notes}</p>
                  <div className="text-[11px] text-blue-700 font-semibold pt-1">
                    Dibutuhkan: {formatDate(mr.needed_date)} • Pemohon: {mr.requester?.full_name}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setShowDispatchModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                  >
                    Kirim via Surat Jalan
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Orders (Surat Jalan) Active Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span>Daftar Surat Jalan Digital & Pelacakan Armada</span>
            <Badge variant="secondary" className="text-xs">
              {deliveries.length} Pengiriman
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Monitoring armada pengiriman dari Central Warehouse hingga tanda tangan serah terima di lokasi site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">No. Surat Jalan</th>
                  <th className="p-3">Gudang Asal</th>
                  <th className="p-3">Destinasi Site & Proyek</th>
                  <th className="p-3">Armada / Driver</th>
                  <th className="p-3">Status Pengiriman</th>
                  <th className="p-3 text-right">Proof of Delivery (POD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {deliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <span className="font-mono font-bold text-slate-900 block">{del.delivery_number}</span>
                      <span className="text-[10px] text-slate-400">{formatDateTime(del.dispatched_at)}</span>
                    </td>
                    <td className="p-3 font-medium text-slate-700">
                      {del.warehouse?.name.replace('Central Warehouse ', '')}
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-900">{del.project?.name.substring(0, 32)}...</p>
                      <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-red-500" />
                        {del.site?.name || 'Site Cluster Duren Jaya'}
                      </p>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-900">{del.driver_name}</p>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 py-0.5 rounded">
                        {del.vehicle_number}
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={del.status === 'delivered' ? 'success' : 'default'}
                        className="text-[10px] capitalize"
                      >
                        {del.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {del.status === 'in_transit' ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenPod(del)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 shadow"
                        >
                          <PenTool className="w-3 h-3 mr-1" />
                          Konfirmasi & Tanda Tangan POD
                        </Button>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300">
                            POD Lengkap
                          </Badge>
                          <a
                            href={del.recipient_signature_url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 hover:underline font-semibold"
                          >
                            Lihat TTD
                          </a>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Proof of Delivery (POD) Signature & Photo Modal */}
      {showPodModal && selectedDelivery && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl rounded-2xl border-slate-300 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-200 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-emerald-600" />
                  Konfirmasi Serah Terima Material (POD)
                </CardTitle>
                <button
                  onClick={() => setShowPodModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Surat Jalan: {selectedDelivery.delivery_number} • Driver: {selectedDelivery.driver_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <form onSubmit={handleConfirmPod} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Nama Penerima Lapangan</label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Catatan Kondisi Barang</label>
                  <Input
                    value={podNotes}
                    onChange={(e) => setPodNotes(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>

                {/* Digital Signature Pad Preview */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Tanda Tangan Digital Penerima (Digital Signature)
                  </label>
                  <div className="h-28 border border-slate-300 rounded-xl bg-slate-50 relative flex items-center justify-center overflow-hidden">
                    <div className="text-center space-y-1">
                      <PenTool className="w-6 h-6 mx-auto text-slate-400" />
                      <p className="text-[11px] text-slate-500">
                        Area Tanda Tangan Layar Sentuh / Mouse
                      </p>
                      <span className="text-[10px] text-emerald-600 font-mono font-semibold">
                        [ Terotentikasi via Mobile Field Technician ]
                      </span>
                    </div>
                  </div>
                </div>

                {/* Photo Evidence on Site */}
                <div className="p-3 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/30 text-center space-y-1">
                  <Camera className="w-5 h-5 mx-auto text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-900 block">
                    Foto Bukti Bongkar Muat di Site
                  </span>
                  <span className="text-[10px] text-emerald-700 block">
                    Disimpan otomatis di Supabase Storage bucket <code>logistics_pod</code>
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPodModal(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSigning}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    {isSigning ? 'Menyimpan TTD...' : 'Simpan & Selesaikan Pengiriman'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dispatch Modal Form */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl rounded-2xl border-slate-300 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-200 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  Penerbitan Surat Jalan (Delivery Order)
                </CardTitle>
                <button
                  onClick={() => setShowDispatchModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <form onSubmit={handleCreateSuratJalan} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Gudang Asal</label>
                  <select className="w-full text-xs bg-white border border-slate-300 rounded-md p-2 text-slate-800">
                    {DEMO_WAREHOUSES.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Destinasi Proyek</label>
                  <select className="w-full text-xs bg-white border border-slate-300 rounded-md p-2 text-slate-800">
                    {DEMO_PROJECTS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.project_code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Nama Driver / Ekspedisi</label>
                    <Input
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      required
                      placeholder="Agus Waluyo"
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Plat Nomor Kendaraan</label>
                    <Input
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      required
                      placeholder="B 9231 TKL"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                  <p className="font-semibold">Otomatisasi Stok Gudang</p>
                  <p className="text-[11px] text-blue-700">
                    Saat Surat Jalan diberangkatkan (In Transit), trigger PostgreSQL akan memotong stok di <code>warehouse_stocks</code> secara otomatis.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDispatchModal(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    Berangkatkan Armada (In Transit)
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
