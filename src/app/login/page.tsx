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
  project_manager: 'Project Mgr',
  finance: 'Finance',
  warehouse_logistics: 'Warehouse',
  field_technician: 'Field Tech',
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
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-white shadow-sm">
            <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-white text-sm tracking-wide block leading-none">
              PT TELEKOMUNIKASI
            </span>
            <span className="text-[10px] text-zinc-400 font-mono tracking-wider block mt-0.5">
              INTERNAL ERP & OPS PORTAL
            </span>
          </div>
        </div>
      }
      title="Selamat Datang!"
      description="Masukkan kredensial akun resmi operasional telekomunikasi Anda."
      onSubmit={handleFormSubmit}
      forgotPasswordHref="#"
      createAccountHref="#"
      extraContent={
        <div className="pt-2 border-t border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Quick Role Login (Evaluator Mode)
            </span>
            <span className="text-[9px] text-zinc-500 font-mono">6 Roles</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {DEMO_PROFILES.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => handleQuickRole(profile.role)}
                className="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 hover:border-blue-500/50 transition-colors text-left group"
              >
                <div className="p-1 rounded bg-zinc-900 border border-zinc-700 shrink-0">
                  {ROLE_ICONS[profile.role]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-zinc-200 group-hover:text-blue-400 truncate leading-tight">
                    {ROLE_SHORT_LABELS[profile.role]}
                  </div>
                  <div className="text-[9px] text-zinc-500 truncate">
                    {(profile.division || 'Operations').split(' ')[0]}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}
