'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bell,
  LogOut,
  Sparkles,
  MapPin,
  Shield,
  Briefcase,
  Users,
  Coins,
  Truck,
  HardHat,
} from 'lucide-react';

const ROLE_OPTIONS: { role: UserRole; label: string; icon: React.ReactNode }[] = [
  { role: 'super_admin', label: 'Super Admin', icon: <Shield className="w-3.5 h-3.5 text-purple-600" /> },
  { role: 'hr_admin', label: 'HR Admin', icon: <Users className="w-3.5 h-3.5 text-emerald-600" /> },
  { role: 'project_manager', label: 'Project Manager', icon: <Briefcase className="w-3.5 h-3.5 text-blue-600" /> },
  { role: 'finance', label: 'Finance', icon: <Coins className="w-3.5 h-3.5 text-amber-600" /> },
  { role: 'warehouse_logistics', label: 'Warehouse & Logistik', icon: <Truck className="w-3.5 h-3.5 text-cyan-600" /> },
  { role: 'field_technician', label: 'Field Technician', icon: <HardHat className="w-3.5 h-3.5 text-orange-600" /> },
];

export function Header() {
  const { user, role, switchRole, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      {/* Left info */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">
              PT Telekomunikasi Indonesia
            </span>
            <Badge variant="outline" className="text-[10px] bg-slate-50 border-slate-300">
              ERP v2026
            </Badge>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline flex items-center gap-1">
            <MapPin className="w-3 h-3 text-red-500 inline mr-0.5" />
            Central Jakarta Ops Center • Geofencing Ready
          </span>
        </div>
      </div>

      {/* Right controls: Role Quick Switcher + Notifications + Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dynamic Role Switcher Dropdown */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 pl-2 hidden md:inline flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 inline" />
            Role:
          </span>
          <select
            value={role}
            onChange={(e) => switchRole(e.target.value as UserRole)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-md py-1 px-2.5 text-slate-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.role} value={opt.role}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notifications badge */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900">
            <Bell className="w-4 h-4" />
          </Button>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </div>

        {/* User preview & Sign out */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hidden sm:inline-flex"
        >
          <LogOut className="w-3.5 h-3.5 mr-1" />
          Logout
        </Button>
      </div>
    </header>
  );
}
