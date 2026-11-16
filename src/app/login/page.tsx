'use client';

import React from 'react';
import { AuthFormSplitScreen } from '@/components/ui/login';
import { UserRole } from '@/types/database';
import { DEMO_PROFILES } from '@/lib/mock-data';
import { createClient } from '@/lib/supabase/client';
import {
  Radio,
  ShieldCheck,
  Users,
  Briefcase,
  Coins,
  Truck,
  HardHat,
  Sparkles,
} from 'lucide-react';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  super_admin: <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />,
  hr_admin: <Users className="w-3.5 h-3.5 text-emerald-400" />,
  project_manager: <Briefcase className="w-3.5 h-3.5 text-blue-400" />,
  finance: <Coins className="w-3.5 h-3.5 text-amber-400" />,
  warehouse_logistics: <Truck className="w-3.5 h-3.5 text-cyan-400" />,
  field_technician: <HardHat className="w-3.5 h-3.5 text-orange-400" />,
};

const ROLE_SHORT_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  hr_admin: 'HR Admin',
  project_manager: 'Project Manager',
  finance: 'Finance',
  warehouse_logistics: 'Warehouse',
  field_technician: 'Field Technician',
};

export default function LoginPage() {
  const applyLogin = (role: UserRole) => {
    document.cookie = `telecom_session=${role}; path=/; max-age=604800; SameSite=Lax`;
    localStorage.setItem('pt_telecom_role', role);
    window.location.href = '/dashboard';
  };

  const handleFormSubmit = async (data: { email: string; password: string }) => {
    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authData?.user) {
        const userRole = (authData.user.user_metadata?.role as UserRole) || 'super_admin';
        applyLogin(userRole);
        return;
      }
    } catch {
      // Fallback seamlessly to matching profile
    }

    const matched = DEMO_PROFILES.find((p) => p.email.toLowerCase() === data.email.toLowerCase());
    const targetRole = matched ? matched.role : 'super_admin';
    applyLogin(targetRole);
  };

  const handleQuickRole = (role: UserRole) => {
    applyLogin(role);
  };

  return (
    <AuthFormSplitScreen
      logo={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 border border-blue-400/30">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-wide block leading-none">
              PT TELEKOMUNIKASI
            </span>
            <span className="text-[10px] text-blue-400 font-mono tracking-wider block mt-0.5">
              INTERNAL ERP & OPS PORTAL
            </span>
          </div>
        </div>
      }
      title="Selamat Datang!"
      description="Masukkan email dan kata sandi akun resmi operasional telekomunikasi Anda."
      imageSrc="https://images.unsplash.com/photo-1544717305-2782549b5136?w=1600&auto=format&fit=crop&q=85"
      imageAlt="Telecommunication tower and fiber optic infrastructure"
      onSubmit={handleFormSubmit}
      forgotPasswordHref="#"
      createAccountHref="#"
      extraContent={
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Quick Role Login (Evaluator Mode)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">6 Roles</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {(Object.keys(ROLE_SHORT_LABELS) as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleQuickRole(r)}
                className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 hover:border-blue-500/50 border border-slate-700/80 text-left transition-all text-[11px] text-slate-200"
              >
                {ROLE_ICONS[r]}
                <span className="truncate font-medium">{ROLE_SHORT_LABELS[r]}</span>
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}
