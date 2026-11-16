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
  RefreshCw,
} from 'lucide-react';

export default function WarehousePage() {
  const { user, role } = useAuth();
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

  useEffect(() => {
    async function loadStocks() {
      setIsLoading(true);
      const data = await fetchStocks();
      setStocks(data);
      setIsLoading(false);
    }
    loadStocks();
  }, []);

  // Filter stocks
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
        receivedBy: user?.id || 'usr-wh-05',
      });

      // Update local state
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
    <div className="space-y-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-cyan-600" />
            Warehouse & Material Management
          </h1>
          <p className="text-xs text-slate-500">
            Katalog material telekomunikasi, stok multi-gudang (Bekasi & Jakarta), dan peringatan dini stok menipis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Supabase DB Terhubung
          </Badge>
          <Button
            onClick={() => setShowInboundModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow"
          >
            <PackagePlus className="w-4 h-4 mr-1.5" />
            Penerimaan Barang Masuk (PO / Supplier)
          </Button>
        </div>
      </div>

      {/* KPI Warehouse Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase">
              Total SKU Material
            </CardTitle>
            <Layers className="w-4 h-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stocks.length || DEMO_ITEMS.length} Katalog</div>
            <p className="text-xs text-slate-500 mt-1">Kabel FO, ODP, ODC, SFP+, Fusion Splicer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase">
              Gudang & Hub Aktif
            </CardTitle>
            <WarehouseIcon className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{DEMO_WAREHOUSES.length} Lokasi</div>
            <p className="text-xs text-blue-600 font-medium mt-1">Central Cikarang MM2100 & Rawamangun Hub</p>
          </CardContent>
        </Card>

        <Card className={lowStockCount > 0 ? 'border-red-300 bg-red-50/20' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase">
              Peringatan Stok Minimum
            </CardTitle>
            <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-red-600' : 'text-slate-400'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockCount} Item Menipis</div>
            <p className="text-xs text-red-700 font-medium mt-1">Perlu reorder sebelum menghambat implementasi</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Warehouse Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari SKU atau nama material (misal: CAB-FO, ODP, SFP)..."
            className="pl-9 text-xs"
          />
        </div>
        <select
          value={selectedWarehouse}
          onChange={(e) => setSelectedWarehouse(e.target.value)}
          className="w-full sm:w-auto text-xs bg-white border border-slate-300 rounded-md p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-600"
        >
          <option value="all">Semua Gudang</option>
          {DEMO_WAREHOUSES.map((wh) => (
            <option key={wh.id} value={wh.id}>
              {wh.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stock Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span>Status Ketersediaan Material Real-Time</span>
            <Badge variant="outline" className="text-xs">
              {filteredStocks.length} Record
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Jumlah fisik gudang, alokasi reservasi proyek, dan status ambang batas peringatan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-600" />
              Memuat data stok gudang...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">SKU & Kategori</th>
                    <th className="p-3">Nama Material</th>
                    <th className="p-3">Gudang</th>
                    <th className="p-3">Stok Fisik</th>
                    <th className="p-3">Reservasi Proyek</th>
                    <th className="p-3">Min Alert</th>
                    <th className="p-3 text-right">Status Ketersediaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredStocks.map((stock) => {
                    const isLow = Number(stock.quantity) <= Number(stock.item?.min_stock_alert || 0);
                    return (
                      <tr key={stock.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {stock.item?.sku || 'SKU-ITEM'}
                          </span>
                          <span className="block text-[10px] uppercase text-cyan-700 mt-1 font-semibold">
                            {stock.item?.category?.replace(/_/g, ' ') || 'MATERIAL'}
                          </span>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-900">{stock.item?.name || 'Item Material'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Satuan: {stock.item?.uom || 'Unit'}
                          </p>
                        </td>
                        <td className="p-3 text-slate-700 font-medium">
                          {stock.warehouse?.name?.replace('Central Warehouse ', '') || 'Central Cikarang'}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900 text-sm">
                          {Number(stock.quantity).toLocaleString('id-ID')} {stock.item?.uom || ''}
                        </td>
                        <td className="p-3 font-mono text-slate-500">
                          {Number(stock.reserved_quantity || 0).toLocaleString('id-ID')} {stock.item?.uom || ''}
                        </td>
                        <td className="p-3 font-mono text-slate-400">
                          {Number(stock.item?.min_stock_alert || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 text-right">
                          {isLow ? (
                            <Badge variant="destructive" className="text-[10px] inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Stok Menipis (Low)
                            </Badge>
                          ) : (
                            <Badge variant="success" className="text-[10px]">
                              Aman (Normal)
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inbound Stock Modal */}
      {showInboundModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl rounded-2xl border-slate-300 overflow-hidden max-h-[92vh] flex flex-col">
            <CardHeader className="bg-slate-50 border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PackagePlus className="w-4 h-4 text-cyan-600" />
                  Penerimaan Barang Masuk (Inbound Goods Receipt)
                </CardTitle>
                <button
                  onClick={() => setShowInboundModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <form onSubmit={handleInboundStock} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Pilih Material</label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-md p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-600"
                  >
                    {DEMO_ITEMS.map((itm) => (
                      <option key={itm.id} value={itm.id}>
                        {itm.sku} - {itm.name} ({itm.uom})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Gudang Tujuan</label>
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-md p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-600"
                  >
                    {DEMO_WAREHOUSES.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Jumlah Masuk</label>
                    <Input
                      type="number"
                      value={inboundQty}
                      onChange={(e) => setInboundQty(e.target.value)}
                      required
                      placeholder="1000"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">No. Purchase Order (PO)</label>
                    <Input
                      value={inboundRef}
                      onChange={(e) => setInboundRef(e.target.value)}
                      required
                      placeholder="PO-2026-SUPP-044"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-200 text-xs text-cyan-900 space-y-1">
                  <p className="font-semibold">Pencatatan Otomatis Supabase</p>
                  <p className="text-[11px] text-cyan-700">
                    Sistem langsung mencatat log mutasi stok ke tabel <code>stock_movements</code> dan menambah saldo fisik di <code>warehouse_stocks</code>.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInboundModal(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="sm"
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Penerimaan Barang'}
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
