'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DEMO_PROFILES } from '@/lib/mock-data';
import { UserRole } from '@/types/database';
import { 
  Radio, 
  ShieldCheck, 
  HardHat, 
  Users, 
  Briefcase, 
  Coins, 
  Truck, 
  ArrowRight,
  Sparkles,
  Server
} from 'lucide-react';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  super_admin: <ShieldCheck className="w-4 h-4 text-purple-600" />,
  hr_admin: <Users className="w-4 h-4 text-emerald-600" />,
  project_manager: <Briefcase className="w-4 h-4 text-blue-600" />,
  finance: <Coins className="w-4 h-4 text-amber-600" />,
  warehouse_logistics: <Truck className="w-4 h-4 text-cyan-600" />,
  field_technician: <HardHat className="w-4 h-4 text-orange-600" />,
};

const ROLE_LABELS: Record<UserRole, { label: string; desc: string }> = {
  super_admin: { label: 'Super Admin', desc: 'Akses penuh seluruh modul & kontrol sistem' },
  hr_admin: { label: 'HR Admin', desc: 'Rekap absensi, validasi geofencing & master karyawan' },
  project_manager: { label: 'Project Manager', desc: 'Approval RAB, target vs aktual & log proyek' },
  finance: { label: 'Finance', desc: 'Pencairan reimbursement, invoice termin & cashflow' },
  warehouse_logistics: { label: 'Warehouse & Logistik', desc: 'Stok FO, terbitkan Surat Jalan & inventaris' },
  field_technician: { label: 'Field Technician', desc: 'Absen selfie, update site, lapor progres & klaim' },
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@telekomunikasi.co.id');
  const [password, setPassword] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickLogin = (role: UserRole) => {
    localStorage.setItem('pt_telecom_role', role);
    router.push('/dashboard');
  };

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Find matching demo profile or fallback
    const matched = DEMO_PROFILES.find((p) => p.email === email) || DEMO_PROFILES[0];
    localStorage.setItem('pt_telecom_role', matched.role);
    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/dashboard');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      {/* Background telecom grid effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

      <div className="w-full max-w-5xl z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-semibold backdrop-blur-md">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>PT TELEKOMUNIKASI INDONESIA - INTERNAL ERP</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-emerald-400 font-normal">Edge Cloudflare v2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Integrated Operations & ERP Portal
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Sistem manajemen terintegrasi: Absensi Geofencing, Implementasi FO/BTS, Finansial Proyek, Warehouse Material & Logistik Surat Jalan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Login Manual */}
          <div className="lg:col-span-5">
            <Card className="border-slate-700/60 bg-slate-900/80 backdrop-blur-xl shadow-2xl text-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-white flex items-center justify-between">
                  <span>Sign In Akun</span>
                  <Badge variant="outline" className="border-slate-700 text-slate-300">
                    Supabase Auth
                  </Badge>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Gunakan kredensial resmi PT Telekomunikasi Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleStandardLogin} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Email Perusahaan</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@telekomunikasi.co.id"
                      required
                      className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Kata Sandi</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 mt-2"
                  >
                    {isSubmitting ? 'Memverifikasi...' : 'Masuk ke Dashboard'}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </form>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Server className="w-3 h-3 text-emerald-400" />
                    Supabase PostgreSQL + RLS
                  </span>
                  <span>Cloudflare Pages Edge</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Persona Switcher for Evaluation */}
          <div className="lg:col-span-7">
            <Card className="border-slate-700/60 bg-slate-900/80 backdrop-blur-xl shadow-2xl text-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Quick Role Login (Evaluator Mode)</span>
                  </CardTitle>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium border border-blue-400/30">
                    6 User Roles
                  </span>
                </div>
                <CardDescription className="text-slate-400 text-xs">
                  Klik persona di bawah untuk langsung mencoba dashboard dan hak akses spesifik masing-masing departemen:
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEMO_PROFILES.map((profile) => (
                  <button
                    key={profile.role}
                    onClick={() => handleQuickLogin(profile.role)}
                    className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-blue-500/50 text-left transition-all group"
                  >
                    <div className="p-2 rounded-md bg-slate-800 border border-slate-700 group-hover:border-blue-500/40 transition-colors">
                      {ROLE_ICONS[profile.role]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white group-hover:text-blue-400 transition-colors">
                          {ROLE_LABELS[profile.role].label}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {ROLE_LABELS[profile.role].desc}
                      </p>
                      <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                        {profile.email}
                      </span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
