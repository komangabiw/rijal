'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

// Data poin untuk grafik aktivitas 8 minggu
const THROUGHPUT_DATA = [
  { week: 'Mgg 1', selesai: 25, dibuka: 36 },
  { week: 'Mgg 2', selesai: 28, dibuka: 42 },
  { week: 'Mgg 3', selesai: 33, dibuka: 30 },
  { week: 'Mgg 4', selesai: 38, dibuka: 48 },
  { week: 'Mgg 5', selesai: 42, dibuka: 38 },
  { week: 'Mgg 6', selesai: 46, dibuka: 54 },
  { week: 'Mgg 7', selesai: 50, dibuka: 49 },
  { week: 'Mgg 8', selesai: 55, dibuka: 52 },
];

export default function DashboardOverviewPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [stocks, setStocks] = useState<WarehouseStock[]>([]);
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const totalProjectsCount = projects.length > 0 ? projects.length : 24;
  const activeTasksCount = 127;
  const teamMembersCount = 16;
  const completionRate = '87%';

  return (
    <div className="space-y-6">
      {/* 4 Kartu KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {/* Kartu 1: Total Proyek */}
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl p-5 hover:border-zinc-700 transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Total Proyek</span>
            <FileText className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-white">
              {totalProjectsCount}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              +2 dari bulan lalu
            </p>
          </div>
        </Card>

        {/* Kartu 2: Tugas Aktif */}
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl p-5 hover:border-zinc-700 transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Tugas Aktif</span>
            <ClipboardList className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-white">
              {activeTasksCount}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              +12 dari kemarin
            </p>
          </div>
        </Card>

        {/* Kartu 3: Anggota Tim */}
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl p-5 hover:border-zinc-700 transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Anggota Tim</span>
            <Users className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-white">
              {teamMembersCount}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              +1 anggota baru
            </p>
          </div>
        </Card>

        {/* Kartu 4: Tingkat Penyelesaian */}
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl p-5 hover:border-zinc-700 transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Tingkat Penyelesaian</span>
            <BarChart2 className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-white">
              {completionRate}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              +5% dari minggu lalu
            </p>
          </div>
        </Card>
      </div>

      {/* Kartu Grafik Utama: Task Throughput */}
      <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl p-6 hover:border-zinc-700 transition-colors shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Aktivitas Penyelesaian Tugas</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Perbandingan tugas dibuka vs diselesaikan selama 8 minggu terakhir
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadAllData}
            disabled={isLoading}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Segarkan
          </Button>
        </div>

        {/* Grafik Area Lengkung */}
        <div className="h-64 sm:h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={THROUGHPUT_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="week"
                stroke="#52525b"
                tick={{ fill: '#71717a', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[15, 60]}
                ticks={[15, 30, 45, 60]}
                stroke="#52525b"
                tick={{ fill: '#71717a', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#27272a',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#ffffff',
                }}
              />
              {/* Garis tugas diselesaikan dengan gradient fill */}
              <Area
                type="monotone"
                dataKey="selesai"
                name="Tugas Selesai"
                stroke="#ffffff"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#curveFill)"
              />
              {/* Garis tugas dibuka dengan titik-titik */}
              <Line
                type="monotone"
                dataKey="dibuka"
                name="Tugas Dibuka"
                stroke="#a1a1aa"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}