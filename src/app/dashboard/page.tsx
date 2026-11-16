'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/lib/utils';
import {
  DEMO_PROJECTS,
  DEMO_ATTENDANCES,
  DEMO_STOCKS,
  DEMO_EXPENSES,
  DEMO_DELIVERY_ORDERS,
} from '@/lib/mock-data';
import {
  CalendarCheck2,
  FolderGit2,
  ReceiptText,
  Boxes,
  Truck,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export default function DashboardOverviewPage() {
  const { user, role } = useAuth();

  // Calculate summaries
  const lowStockCount = DEMO_STOCKS.filter((s) => (s.quantity <= (s.item?.min_stock_alert || 0))).length;
  const transitDeliveries = DEMO_DELIVERY_ORDERS.filter((d) => d.status === 'in_transit').length;
  const pendingClaims = DEMO_EXPENSES.filter((e) => e.status.startsWith('pending')).length;
  const totalRAB = DEMO_PROJECTS.reduce((acc, p) => acc + Number(p.total_budget), 0);

  // Chart data
  const chartData = DEMO_PROJECTS.map((p) => ({
    name: p.project_code,
    target: Number(p.target_volume),
    actual: Number(p.actual_volume),
    unit: p.target_unit,
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold backdrop-blur-sm border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Operational Console • PT Telekomunikasi Indonesia</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {user?.full_name}
          </h1>
          <p className="text-blue-100 text-sm max-w-2xl">
            Sistem operasional terpadu memantau infrastruktur fiber optik, menara telekomunikasi, logistik material, dan klaim biaya operasional secara real-time.
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            <Link href="/dashboard/attendance">
              <Button size="sm" className="bg-white text-blue-900 hover:bg-blue-50 font-semibold shadow">
                <CalendarCheck2 className="w-4 h-4 mr-1.5" />
                Absen Geofencing Sekarang
              </Button>
            </Link>
            <Link href="/dashboard/projects">
              <Button size="sm" variant="outline" className="border-blue-300/40 text-white hover:bg-blue-800/60">
                <FolderGit2 className="w-4 h-4 mr-1.5" />
                Input Progres Harian
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase">
              Kehadiran Hari Ini
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {DEMO_ATTENDANCES.length} / 6
            </div>
            <p className="text-xs text-emerald-600 font-medium flex items-center mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              100% Terverifikasi GPS Site
            </p>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase">
              Proyek Berjalan
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {DEMO_PROJECTS.length} Proyek
            </div>
            <p className="text-xs text-blue-600 font-medium flex items-center mt-1">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              Avg 73.2% Target Tercapai
            </p>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase">
              Klaim & Pengeluaran
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <ReceiptText className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {pendingClaims} Pending
            </div>
            <p className="text-xs text-amber-600 font-medium flex items-center mt-1">
              <Clock className="w-3.5 h-3.5 mr-1" />
              Menunggu Review PM & Finance
            </p>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase">
              Logistik & Stok
            </CardTitle>
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
              <Truck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {transitDeliveries} Dalam Perjalanan
            </div>
            <p className="text-xs text-red-600 font-medium flex items-center mt-1">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              {lowStockCount} Item di Bawah Batas Minimum
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Target vs Actual Analytics Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Target vs. Realisasi Fisik Proyek
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Perbandingan volume target yang direncanakan terhadap penarikan kabel (meter) & aktivasi site
                  </CardDescription>
                </div>
                <Link href="/dashboard/projects">
                  <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
                    Detail Proyek
                    <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val) => [Number(val).toLocaleString('id-ID'), 'Volume']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="target" name="Rencana Target" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" name="Realisasi Fisik" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Operational Status Widget */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Surat Jalan & Pengiriman</span>
                <Badge variant="outline" className="text-[10px]">
                  Real-time
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEMO_DELIVERY_ORDERS.map((d) => (
                <div key={d.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">{d.delivery_number}</span>
                    <Badge
                      variant={d.status === 'delivered' ? 'success' : 'default'}
                      className="text-[10px] capitalize"
                    >
                      {d.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <p className="font-medium text-slate-800">{d.driver_name}</p>
                    <p className="text-slate-500 font-mono">{d.vehicle_number}</p>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200">
                    <span>Tujuan: {d.project?.name.substring(0, 24)}...</span>
                  </div>
                </div>
              ))}

              <Link href="/dashboard/logistics" className="block pt-1">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Buka Modul Logistik
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
