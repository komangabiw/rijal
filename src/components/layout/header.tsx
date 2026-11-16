'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/types/database';
import {
  Bell,
  PanelLeft,
  PanelLeftClose,
  LogOut,
  Shield,
  Briefcase,
  Users,
  Coins,
  Truck,
  HardHat,
} from 'lucide-react';

const ROLE_OPTIONS: { role: UserRole; label: string; icon: React.ReactNode }[] = [
  { role: 'super_admin', label: 'Super Admin', icon: <Shield className="w-3.5 h-3.5 text-purple-400" /> },
  { role: 'hr_admin', label: 'HR Admin', icon: <Users className="w-3.5 h-3.5 text-emerald-400" /> },
  { role: 'project_manager', label: 'Project Manager', icon: <Briefcase className="w-3.5 h-3.5 text-blue-400" /> },
  { role: 'finance', label: 'Finance', icon: <Coins className="w-3.5 h-3.5 text-amber-400" /> },
  { role: 'warehouse_logistics', label: 'Warehouse & Logistik', icon: <Truck className="w-3.5 h-3.5 text-cyan-400" /> },
  { role: 'field_technician', label: 'Field Technician', icon: <HardHat className="w-3.5 h-3.5 text-orange-400" /> },
];

export function Header() {
  const { user, role, logout, sidebarCollapsed, toggleSidebar, toggleMobileMenu } = useAuth();

  // Smart toggle handler: on desktop toggles sidebarCollapsed, on mobile opens slide-over drawer
  const handleToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileMenu();
    }
  };

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Admin';
  const currentRoleOption = ROLE_OPTIONS.find((opt) => opt.role === role) || ROLE_OPTIONS[0];

  return (
    <header className="sticky top-0 z-30 h-16 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors">
      {/* Left section: Sidebar Toggle [ | ] + Welcome Back Greeting */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={handleToggle}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors focus:outline-none border border-transparent hover:border-zinc-800"
          title={sidebarCollapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
          aria-label="Toggle Sidebar"
        >
          {sidebarCollapsed ? (
            <PanelLeft className="w-5 h-5 text-zinc-300" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-zinc-300" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-white truncate">
            Welcome back, {firstName}
          </h1>
        </div>
      </div>

      {/* Right section: Notifications + Role Badge + User Info (Name, Email, Avatar) + Logout */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* Notifications button with red badge */}
        <div className="relative">
          <button
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-zinc-950"></span>
        </div>

        {/* Authenticated Role Badge (Read-only, no switcher) */}
        <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-200">
          {currentRoleOption.icon}
          <span className="hidden sm:inline">{currentRoleOption.label}</span>
          <span className="sm:hidden">{currentRoleOption.label.split(' ')[0]}</span>
        </div>

        {/* User Info (Name, Email & Avatar) - In top right */}
        <div className="flex items-center gap-2.5 pl-1 border-l border-zinc-800/80">
          <div className="hidden md:flex flex-col text-right min-w-0">
            <span className="text-xs font-semibold text-white truncate max-w-[160px]">
              {user?.full_name || 'Bambang Sudibyo'}
            </span>
            <span className="text-[10px] text-zinc-400 truncate max-w-[160px]">
              {user?.email || 'superadmin@telekomunikasi.co.id'}
            </span>
          </div>

          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
            alt={user?.full_name || 'User Avatar'}
            className="w-8 h-8 rounded-full object-cover border border-zinc-700/80 shrink-0"
          />

          {/* Desktop Logout Button in top right */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 py-1.5 px-2 text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors border border-transparent hover:border-zinc-800"
            title="Keluar Akun"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
