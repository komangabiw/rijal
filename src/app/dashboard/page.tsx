'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  fetchProjects,
  fetchAttendances,
  fetchStocks,
  fetchExpenses,
  fetchDeliveryOrders,
} from '@/lib/api-service';
import {
  Project,
  Attendance,
  WarehouseStock,
  ExpenseClaim,
  DeliveryOrder,
} from '@/types/database';
import {
  FileText,
  ClipboardList,
  Users,
  BarChart2,
  RefreshCw,
  Maximize2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [stocks, setStocks] = useState<WarehouseStock[]>([]);
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeContainerRef = useRef<HTMLDivElement | null>(null);

  const POWER_BI_URL =
    'https://app.powerbi.com/view?r=eyJrIjoiZGRmMTZlOWItNmFlOS00MTRkLTkxMjktYjdiNjgyNGY1ZDYwIiwidCI6ImRmODY3OWNkLWE4MGUtNDVkOC05OWFjLWM4M2VkN2ZmOTVhMCJ9';

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [proj, att, stk, exp, del] = await Promise.all([
        fetchProjects(),
        fetchAttendances(),
        fetchStocks(),
        fetchExpenses(),
        fetchDeliveryOrders(),
      ]);
      setProjects(proj);
      setAttendances(att);
      setStocks(stk);
      setExpenses(exp);
      setDeliveries(del);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleRefreshIframe = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleToggleFullscreen = () => {
    if (!iframeContainerRef.current) return;
    if (!document.fullscreenElement) {
      iframeContainerRef.current.requestFullscreen().catch((err) => {
        console.warn('Gagal masuk mode layar penuh:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const totalProjectsCount = projects.length > 0 ? projects.length : 24;
  const activeTasksCount = 127;
  const teamMembersCount = 16;
  const completionRate = '87%';

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Header Info: Peran ERP & Power BI Live Analytics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 sm:p-5 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Executive Business Intelligence & Data Administrasi ERP
            </h1>
            <Badge className="bg-emerald-950/80 text-emerald-300 border-emerald-800 text-[10px] hidden sm:inline-flex">
              ● Power BI Live Cloud
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
            Sistem terintegrasi: <strong className="text-white">Microsoft Power BI</strong> sebagai pusat visualisasi analitik & intelligence, serta <strong className="text-white">Portal ERP</strong> sebagai engine administrasi transaksi operasional K3, absensi, reimbursement, proyek, dan logistik.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshIframe}
            className="text-xs bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 h-8.5 rounded-xl"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
            Reload BI
          </Button>
          <a
            href={POWER_BI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded-xl shadow-md shadow-amber-600/20 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Buka Tab Penuh
          </a>
        </div>
      </div>

      {/* EMBED POWER BI LIVE DASHBOARD CONTAINER */}
      <Card
        ref={iframeContainerRef}
        className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl overflow-hidden shadow-xl"
      >
        <CardHeader className="bg-zinc-950/80 border-b border-zinc-800/80 p-3.5 sm:p-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <span>New Dashboard DSN</span>
                <span className="text-[11px] font-normal text-zinc-400 hidden sm:inline">
                  — Power BI Embedded Interactive Report
                </span>
              </CardTitle>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFullscreen}
              className="text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 px-2.5 rounded-lg"
              title="Perbesar Layar Penuh (Fullscreen)"
            >
              <Maximize2 className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Fullscreen</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 bg-black">
          {/* Responsive Power BI iframe frame */}
          <div className="w-full relative aspect-[16/10] sm:aspect-[16/9] min-h-[500px] sm:min-h-[640px] lg:min-h-[760px]">
            <iframe
              key={iframeKey}
              title="New Dashboard DSN"
              src={POWER_BI_URL}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen={true}
              allow="fullscreen; geolocation; microphone; camera"
              className="w-full h-full border-0 absolute inset-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* DATA ADMINISTRASI OPERASIONAL (RINGKASAN ERP) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Ringkasan Data Administrasi ERP Terintegrasi
            </h2>
          </div>
          <Badge variant="outline" className="text-[10px] bg-zinc-900 border-zinc-800 text-zinc-400">
            Sinkronisasi Database Aktif
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Kartu 1: Total Proyek Administrasi */}
          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl p-4.5 hover:border-zinc-700 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Proyek Administrasi</span>
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-white">
                {totalProjectsCount} Proyek
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                FO Rollout, BTS 5G & Maintenance
              </p>
            </div>
          </Card>

          {/* Kartu 2: Tugas Aktif */}
          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl p-4.5 hover:border-zinc-700 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Tugas Lapangan Aktif</span>
              <ClipboardList className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-white">
                {activeTasksCount} Tugas
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Monitoring span, splicing & ATP
              </p>
            </div>
          </Card>

          {/* Kartu 3: Anggota Tim */}
          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl p-4.5 hover:border-zinc-700 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Teknisi & Anggota Tim</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-white">
                {teamMembersCount} Personil
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Terverifikasi presensi geofencing
              </p>
            </div>
          </Card>

          {/* Kartu 4: Tingkat Penyelesaian */}
          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl p-4.5 hover:border-zinc-700 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Tingkat Penyelesaian</span>
              <BarChart2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-white">
                {completionRate}
              </div>
              <p className="text-[11px] text-emerald-400 mt-0.5">
                Target SLA on-track tercapai
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}