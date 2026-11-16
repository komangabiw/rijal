'use client';

import * as React from 'react';
import { UserRole } from '@/types/database';
import { DEMO_PROFILES } from '@/lib/mock-data';
import { createClient } from '@/lib/supabase/client';
import GamifiedLoginCard from '@/components/ui/gamified-login-card';
import {
  Radio,
  Wifi,
  Network,
  Boxes,
  MapPin,
  Truck,
  ShieldCheck,
} from 'lucide-react';

// Credential mapping for all roles: <role>@telekomunikasi.co.id with password <role>
const ROLE_CREDENTIALS: Record<string, { role: UserRole; pass: string[] }> = {
  'superadmin@telekomunikasi.co.id': {
    role: 'super_admin',
    pass: ['superadmin', 'admin'],
  },
  'admin@telekomunikasi.co.id': {
    role: 'super_admin',
    pass: ['superadmin', 'admin'],
  },
  'hradmin@telekomunikasi.co.id': {
    role: 'hr_admin',
    pass: ['hradmin', 'hr'],
  },
  'hr@telekomunikasi.co.id': {
    role: 'hr_admin',
    pass: ['hradmin', 'hr'],
  },
  'projectmanager@telekomunikasi.co.id': {
    role: 'project_manager',
    pass: ['projectmanager', 'pm'],
  },
  'pm@telekomunikasi.co.id': {
    role: 'project_manager',
    pass: ['projectmanager', 'pm'],
  },
  'finance@telekomunikasi.co.id': {
    role: 'finance',
    pass: ['finance'],
  },
  'warehouse@telekomunikasi.co.id': {
    role: 'warehouse_logistics',
    pass: ['warehouse'],
  },
  'technician@telekomunikasi.co.id': {
    role: 'field_technician',
    pass: ['technician'],
  },
};

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const applyLogin = (role: UserRole) => {
    document.cookie = `telecom_session=${role}; path=/; max-age=604800; SameSite=Lax`;
    localStorage.setItem('pt_telecom_role', role);
    window.location.href = '/dashboard';
  };

  const handleLoginSubmit = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setErrorMessage(null);

    const emailKey = data.email.trim().toLowerCase();
    const enteredPass = data.password.trim();

    try {
      // 1. Try Supabase Auth first
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailKey,
        password: enteredPass,
      });

      if (authData?.user && !authError) {
        const userRole = (authData.user.user_metadata?.role as UserRole) || 'super_admin';
        applyLogin(userRole);
        return;
      }
    } catch {
      // Continue to role credential verification
    }

    // 2. Verify with standard role credentials
    const cred = ROLE_CREDENTIALS[emailKey];
    if (cred && cred.pass.includes(enteredPass)) {
      applyLogin(cred.role);
      return;
    }

    // 3. Check fallback match against demo profiles
    const matchedProfile = DEMO_PROFILES.find((p) => p.email.toLowerCase() === emailKey);
    if (matchedProfile) {
      const expectedPass = matchedProfile.role.replace('_', '');
      if (
        enteredPass === expectedPass ||
        enteredPass === matchedProfile.role ||
        enteredPass === emailKey.split('@')[0]
      ) {
        applyLogin(matchedProfile.role);
        return;
      }
    }

    setIsLoading(false);
    setErrorMessage('Email atau kata sandi tidak valid. Gunakan format <role>@telekomunikasi.co.id dengan kata sandi <role>.');
  };

  return (
    <div className="relative flex h-screen w-full flex-col md:flex-row bg-[#080d19] text-zinc-100 overflow-hidden select-none">
      {/* Left Panel: Gamified Login Card matching requested design (1 screen, no scrollbar) */}
      <div className="flex w-full flex-col justify-center items-center px-6 sm:px-10 lg:px-12 py-4 md:w-1/2 lg:w-5/12 bg-[#0b1120] border-r border-slate-800/80 h-full overflow-hidden">
        <div className="w-full max-w-sm flex flex-col items-center">
          {/* Logo Header */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-white shadow-md">
              <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-wide block leading-none">
                PT TELEKOMUNIKASI
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider block mt-1">
                INTERNAL ERP & OPS PORTAL
              </span>
            </div>
          </div>

          {/* Gamified Login Card */}
          <GamifiedLoginCard
            onSubmit={handleLoginSubmit}
            isLoading={isLoading}
            error={errorMessage}
            containerClassName="min-h-0 w-full"
            className="w-full max-w-sm p-6 sm:p-7 shadow-2xl"
          />
        </div>
      </div>

      {/* Right Panel: Pure Telecommunications Technology Icons & Infrastructure Showcase */}
      <div className="relative hidden w-full md:flex md:w-1/2 lg:w-7/12 flex-col justify-between p-8 lg:p-12 overflow-hidden bg-[#090d18]">
        {/* Glowing cyber gradient grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.22),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#131b2e_1px,transparent_1px),linear-gradient(to_bottom,#131b2e_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-70" />

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Sistem Infrastruktur Telekomunikasi Terpadu</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            PT TELEKOMUNIKASI • EDGE v2026
          </div>
        </div>

        {/* Center: Interactive Telecom Hardware Architecture Grid */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-3 gap-3.5 my-auto max-w-xl mx-auto w-full">
          {/* Card 1: Menara BTS 5G */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/60 transition-all duration-300 group shadow-lg backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-700/50 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Wifi className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white mt-3 group-hover:text-blue-400 transition-colors">
              Menara BTS & Macro 5G
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Instalasi BBU/RRU, radio microwave & aktivasi site seluler.
            </p>
          </div>

          {/* Card 2: Backbone Fiber Optic */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/60 transition-all duration-300 group shadow-lg backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white mt-3 group-hover:text-emerald-400 transition-colors">
              Backbone Fiber Optic
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Kabel ADSS 24C/48C/96C jalur udara & duct bawah tanah.
            </p>
          </div>

          {/* Card 3: ODC & ODP Enclosures */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/60 transition-all duration-300 group shadow-lg backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Boxes className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white mt-3 group-hover:text-amber-400 transition-colors">
              ODC & ODP Enclosures
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Optical cabinet 144 core, closure dome & splitter solid 16P.
            </p>
          </div>

          {/* Card 4: GPS Geofencing Presensi */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/60 transition-all duration-300 group shadow-lg backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-700/50 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white mt-3 group-hover:text-cyan-400 transition-colors">
              GPS Geofencing Presensi
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Validasi jarak radius kerja kantor & bukti selfie kamera live.
            </p>
          </div>

          {/* Card 5: Logistik & Surat Jalan */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/60 transition-all duration-300 group shadow-lg backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-700/50 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white mt-3 group-hover:text-purple-400 transition-colors">
              Logistik & Surat Jalan
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Tracking armada, alokasi material gudang & konfirmasi POD.
            </p>
          </div>

          {/* Card 6: RLS & Data Security */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/60 transition-all duration-300 group shadow-lg backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-700/50 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white mt-3 group-hover:text-rose-400 transition-colors">
              RLS & Data Security
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Enkripsi database PostgreSQL, audit trail & role berbasis RLS.
            </p>
          </div>
        </div>

        {/* Bottom Status Info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300 font-mono text-[11px]">
              99.98% SLA Ketersediaan Jaringan
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Cloudflare Edge • Supabase PostgreSQL
          </div>
        </div>
      </div>
    </div>
  );
}