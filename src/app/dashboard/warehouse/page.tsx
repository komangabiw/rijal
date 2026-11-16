'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DEMO_ITEMS,
  DEMO_STOCKS,
  DEMO_WAREHOUSES,
} from '@/lib/mock-data';
import { WarehouseStock, Item } from '@/types/database';
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  PackagePlus,
  ArrowDownRight,
  ArrowUpRight,
  Layers,
  Search,
  Filter,
  Plus,
  X,
  Warehouse as WarehouseIcon,
} from 'lucide-react';

export default function WarehousePage() {
  const { role } = useAuth();
  const [stocks, setStocks] = useState<WarehouseStock[]>(DEMO_STOCKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [showInboundModal, setShowInboundModal] = useState(false);

  // Inbound modal form state
  const [selectedItemId, setSelectedItemId] = useState(DEMO_ITEMS[0].id);
  const [inboundQty, setInboundQty] = useState('1000');
  const [inboundRef, setInboundRef] = useState('PO-2026-SUPP-044');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter stocks
  const filteredStocks = stocks.filter((s) => {
    const matchSearch =
      s.item?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.item?.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchWarehouse = selectedWarehouse === 'all' || s.warehouse_id === selectedWarehouse;
    return matchSearch && matchWarehouse;
  });

  const lowStockCount = stocks.filter((s) => s.quantity <= (s.item?.min_stock_alert || 0)).length;

  const handleInboundStock = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const qtyNum = Number(inboundQty) || 0;

    setTimeout(() => {
      setStocks((prev) =>
        prev.map((s) => {
          if (s.item_id === selectedItemId) {
            return {
              ...s,
              quantity: Number(s.quantity) + qtyNum,
              updated_at: new Date().toISOString(),
            };
          }
          return s;
        })
      );
      setIsSubmitting(false);
      setShowInboundModal(false);
    }, 400);
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

        <Button
          onClick={() => setShowInboundModal(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold self-start sm:self-auto shadow"
        >
          <PackagePlus className="w-4 h-4 mr-1.5" />
          Penerimaan Barang Masuk (PO / Supplier)
        </Button>
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
            <div className="text-2xl font-bold text-slate-900">{DEMO_ITEMS.length} Katalog</div>
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
            <p className="text-xs text-blue-600 font-medium mt-1">Central Cikarang & Rawamangun</p>
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
            <p className="text-xs text-red-700 font-medium mt-1">Perlu reorder ODC 144C & Fusion Splicer</p>
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
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
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
                          {stock.item?.sku}
                        </span>
                        <span className="block text-[10px] uppercase text-cyan-700 mt-1 font-semibold">
                          {stock.item?.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-900">{stock.item?.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Satuan: {stock.item?.uom}
                        </p>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">
                        {stock.warehouse?.name.replace('Central Warehouse ', '')}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900 text-sm">
                        {Number(stock.quantity).toLocaleString('id-ID')} {stock.item?.uom}
                      </td>
                      <td className="p-3 font-mono text-slate-500">
                        {Number(stock.reserved_quantity).toLocaleString('id-ID')} {stock.item?.uom}
                      </td>
                      <td className="p-3 font-mono text-slate-400">
                        {Number(stock.item?.min_stock_alert).toLocaleString('id-ID')}
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
        </CardContent>
      </Card>

      {/* Inbound Stock Modal */}
      {showInboundModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl rounded-2xl border-slate-300 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-200 pb-3">
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
            <CardContent className="p-5 space-y-4">
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
                  <p className="font-semibold">Lokasi Penyimpanan: Central Warehouse Cikarang MM2100</p>
                  <p className="text-[11px] text-cyan-700">
                    Sistem akan secara otomatis mencatat mutasi stok di tabel PostgreSQL <code>stock_movements</code>.
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
