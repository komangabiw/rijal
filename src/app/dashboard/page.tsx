'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  CalendarCheck2,
  FolderGit2,
  ReceiptText,
  Boxes,
  Truck,
  ArrowUpRight,
  Sparkles,
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

// Data points for the 8-week task throughput curve matching 21st.dev layout
const THROUGHPUT_DATA = [
  { week: 'W1', completed: 25, opened: 36 },
  { week: 'W2', completed: 28, opened: 42 },
  { week: 'W3', completed: 33, opened: 30 },
  { week: 'W4', completed: 38, opened: 48 },
  { week: 'W5', completed: 42, opened: 38 },
  { week: 'W6', completed: 46, opened: 54 },
  { week: 'W7', completed: 50, opened: 49 },
  { week: 'W8', completed: 55, opened: 52 },
];

export default function DashboardOverviewPage() {
  const { user } = useAuth();
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
      {/* 4 KPI Cards Grid matching 21st.dev UI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {/* Card 1: Total projects */}
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Total projects</span>
            <FileText className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-white">
              {totalProjectsCount}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              +2 from last month
            </p>
          </div>
        </Card>

        {/* Card 2: Active tasks */}
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Active tasks</span>
            <ClipboardList className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-white">
              {activeTasksCount}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              +12 from yesterday
            </p>
          </div>
        </Card>

        {/* Card 3: Team members */}
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Team members</span>
            <Users className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-white">
              {teamMembersCount}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              +1 new member
            </p>
          </div>
        </Card>

        {/* Card 4: Completion rate */}
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Completion rate</span>
            <BarChart2 className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-white">
              {completionRate}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              +5% from last week
            </p>
          </div>
        </Card>
      </div>

      {/* Main Chart Card: Task Throughput matching 21st.dev layout */}
      <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Task throughput</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tasks opened against tasks completed over the last eight weeks
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
            Refresh
          </Button>
        </div>

        {/* Curved Area Chart */}
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
              {/* Completed line with gradient fill */}
              <Area
                type="monotone"
                dataKey="completed"
                name="Tasks Completed"
                stroke="#ffffff"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#curveFill)"
              />
              {/* Opened line with dotted stroke */}
              <Line
                type="monotone"
                dataKey="opened"
                name="Tasks Opened"
                stroke="#a1a1aa"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Core Telecom Modules Quick Navigation Grid */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-300">
            PT Telekomunikasi Core Operations
          </h3>
          <span className="text-xs text-zinc-500">Live Supabase Database</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Absensi */}
          <Link href="/dashboard/attendance" className="group">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <CalendarCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    Absensi Geofencing & Selfie
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {attendances.length} presensi tersimpan
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </div>
          </Link>

          {/* Implementasi Proyek */}
          <Link href="/dashboard/projects" className="group">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                    Implementasi FO / BTS
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {projects.length} proyek aktif
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </div>
          </Link>

          {/* Finance */}
          <Link href="/dashboard/finance" className="group">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <ReceiptText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors">
                    Finance & Reimbursement
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {expenses.length} pengajuan klaim
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </div>
          </Link>

          {/* Warehouse */}
          <Link href="/dashboard/warehouse" className="group">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-colors">
                    Warehouse & Material FO
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {stocks.length} item material
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </div>
          </Link>

          {/* Logistics */}
          <Link href="/dashboard/logistics" className="group">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-indigo-400 transition-colors">
                    Logistik & Surat Jalan
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {deliveries.length} surat jalan terbit
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
