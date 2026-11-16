'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { fetchStocks, submitInboundStock } from '@/lib/api-service';
import { DEMO_ITEMS, DEMO_WAREHOUSES } from '@/lib/mock-data';
import { WarehouseStock } from '@/types/database';
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  PackagePlus,
  Layers,
  Search,
  X,
  Warehouse as WarehouseIcon,
  RotateCw,
  ChevronDown,
} from 'lucide-react';

export default function WarehousePage() {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<WarehouseStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [showInboundModal, setShowInboundModal] = useState(false);

  // Inbound modal form state
  const [selectedItemId, setSelectedItemId] = useState(DEMO_ITEMS[0].id);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(DEMO_WAREHOUSES[0].id);
  const [inboundQty, setInboundQty] = useState('1000');
  const [inboundRef, setInboundRef] = useState('PO-2026-SUPP-044');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadStocks = async () => {
    setIsLoading(true);
    const data = await fetchStocks();
    setStocks(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadStocks();
  }, []);

  const filteredStocks = stocks.filter((s) => {
    const matchSearch =
      (s.item?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.item?.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchWarehouse = selectedWarehouse === 'all' || s.warehouse_id === selectedWarehouse;
    return matchSearch && matchWarehouse;
  });

  const lowStockCount = stocks.filter((s) => Number(s.quantity) <= Number(s.item?.min_stock_alert || 0)).length;

  const handleInboundStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const qtyNum = Number(inboundQty) || 0;

    try {
      const updatedStock = await submitInboundStock({
        itemId: selectedItemId,
        warehouseId: selectedWarehouseId,
        quantity: qtyNum,
        referenceNumber: inboundRef,
        receivedBy: user?.id || 'a0000000-0000-0000-0000-000000000005',
      });

      setStocks((prev) => {
        const index = prev.findIndex((s) => s.item_id === selectedItemId && s.warehouse_id === selectedWarehouseId);
        if (index >= 0) {
          const clone = [...prev];
          clone[index] = {
            ...clone[index],
            quantity: Number(clone[index].quantity) + qtyNum,
            updated_at: new Date().toISOString(),
          };
          return clone;
        } else {
          return [updatedStock, ...prev];
        }
      });

      setShowInboundModal(false);
      setInboundQty('500');
    } catch (err) {
      console.error('Inbound stock error:', err);
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
            <Boxes className="w-5 h-5 text-cyan-400" />
            Warehouse & Manajemen Inventori Material
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monitoring stok kabel fiber optik, perangkat aktif ODC/ODP, minimum alert, dan pencatatan barang masuk (Inbound).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={loadStocks}
            variant="outline"
            size="sm"
            className="text-xs bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            <RotateCw className="w-3.5 h-3.5 mr-1" />
            Segarkan
          </Button>
          <Button
            onClick={() => setShowInboundModal(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/30"
          >
            <PackagePlus className="w-4 h-4 mr-1.5" />
            Catat Barang Masuk (Inbound)
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Total Item Katalog
            </CardTitle>
            <Layers className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{DEMO_ITEMS.length} SKU</div>
            <p className="text-xs text-blue-400 font-medium mt-1">Material FO & Aksesoris Tiang</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Stok Kritis / Di Bawah Batas
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-400">{lowStockCount} Item</div>
            <p className="text-xs text-rose-400 font-medium mt-1">Perlu Restock Segera</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
              Gudang & Hub Operasional
            </CardTitle>
            <WarehouseIcon className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{DEMO_WAREHOUSES.length} Lokasi</div>
            <p className="text-xs text-emerald-400 font-medium mt-1">Central Cikarang & Rawamangun</p>
          </CardContent>
        </Card>
      </div>

      {/* Stocks Table with Search & Filter */}
      <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
        <CardHeader className="pb-3 border-b border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-white">
                Daftar Inventori Material Telekomunikasi
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Peringatan stok minimum diverifikasi otomatis oleh database
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari SKU atau nama item..."
                  className="pl-8 text-xs h-8 bg-zinc-800/90 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>

              <div className="relative">
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="appearance-none text-xs bg-zinc-800 border border-zinc-700 text-white rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none"
                >
                  <option value="all">Semua Gudang</option>
                  {DEMO_WAREHOUSES.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="overflow-x-auto rounded-xl border border-zinc-800 -mx-2 sm:mx-0">
            <table className="w-full text-left text-xs min-w-[680px]">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase font-semibold border-b border-zinc-800">
                <tr>
                  <th className="p-3">SKU & Nama Material</th>
                  <th className="p-3">Gudang</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3 text-right">Tersedia</th>
                  <th className="p-3 text-right">Min Alert</th>
                  <th className="p-3 text-center">Status Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 bg-zinc-900">
                {filteredStocks.map((stock) => {
                  const isLow = Number(stock.quantity) <= Number(stock.item?.min_stock_alert || 0);
                  return (
                    <tr key={stock.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-white">{stock.item?.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{stock.item?.sku}</div>
                      </td>
                      <td className="p-3 text-zinc-300 font-mono">{stock.warehouse?.code || 'WH-CKR'}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] capitalize bg-zinc-800 border-zinc-700 text-zinc-300">
                          {stock.item?.category.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-bold text-white">
                        {Number(stock.quantity).toLocaleString('id-ID')} {stock.item?.uom}
                      </td>
                      <td className="p-3 text-right text-zinc-400 font-mono">
                        {Number(stock.item?.min_stock_alert || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 text-center">
                        {isLow ? (
                          <Badge variant="outline" className="bg-rose-950/60 text-rose-400 border-rose-800/60 text-[10px]">
                            Stok Menipis
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-950/60 text-emerald-400 border-emerald-800/60 text-[10px]">
                            Aman
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Inbound Stock Modal */}
      {showInboundModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <Card className="w-full max-w-lg bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <CardHeader className="bg-zinc-950 border-b border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <PackagePlus className="w-4 h-4 text-cyan-400" />
                  Penerimaan Barang Masuk (Inbound)
                </CardTitle>
                <button
                  onClick={() => setShowInboundModal(false)}
                  className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CardDescription className="text-xs text-zinc-400">
                Pencatatan material FO/BTS dari supplier ke gudang penyimpanan
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <form onSubmit={handleInboundStock} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Pilih Material</label>
                  <div className="relative">
                    <select
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full appearance-none text-xs bg-zinc-800 border border-zinc-700 rounded-lg pl-3 pr-9 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      {DEMO_ITEMS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.sku} - {item.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Pilih Gudang Tujuan</label>
                  <div className="relative">
                    <select
                      value={selectedWarehouseId}
                      onChange={(e) => setSelectedWarehouseId(e.target.value)}
                      className="w-full appearance-none text-xs bg-zinc-800 border border-zinc-700 rounded-lg pl-3 pr-9 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      {DEMO_WAREHOUSES.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.code} - {w.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Jumlah Masuk</label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={inboundQty}
                      onChange={(e) => setInboundQty(e.target.value.replace(/\D/g, ''))}
                      required
                      placeholder="1000"
                      className="text-xs bg-zinc-800/90 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Nomor Referensi PO / DO</label>
                    <Input
                      value={inboundRef}
                      onChange={(e) => setInboundRef(e.target.value)}
                      required
                      placeholder="PO-2026-001"
                      className="text-xs bg-zinc-800/90 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInboundModal(false)}
                    className="text-xs bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="sm"
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Inbound'}
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
