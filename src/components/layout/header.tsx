'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
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
  SlidersHorizontal,
  Check,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
} from 'lucide-react';

const ROLE_OPTIONS: { role: UserRole; label: string; icon: React.ReactNode }[] = [
  { role: 'super_admin', label: 'Super Admin', icon: <Shield className="w-3.5 h-3.5 text-purple-400" /> },
  { role: 'hr_admin', label: 'HR Admin', icon: <Users className="w-3.5 h-3.5 text-emerald-400" /> },
  { role: 'project_manager', label: 'Project Manager', icon: <Briefcase className="w-3.5 h-3.5 text-blue-400" /> },
  { role: 'finance', label: 'Finance', icon: <Coins className="w-3.5 h-3.5 text-amber-400" /> },
  { role: 'warehouse_logistics', label: 'Warehouse & Logistik', icon: <Truck className="w-3.5 h-3.5 text-cyan-400" /> },
  { role: 'field_technician', label: 'Field Technician', icon: <HardHat className="w-3.5 h-3.5 text-orange-400" /> },
];

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'attendance' | 'project' | 'finance' | 'warehouse';
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Presensi Masuk Berhasil',
    message: 'Rian Firmansyah (Teknisi) terverifikasi geofencing GPS di Site Bekasi Timur.',
    time: '10 menit lalu',
    type: 'attendance',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Klaim Biaya Menunggu Approval',
    message: 'Pengajuan klaim transport penarikan FO Cluster Duren Jaya Rp 350.000 menunggu verifikasi.',
    time: '25 menit lalu',
    type: 'finance',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Alert Stok Minimum Gudang',
    message: 'Kabel Drop Core 1C tersisa 4 drum di Central Warehouse Bekasi (batas min. 10 drum).',
    time: '1 jam lalu',
    type: 'warehouse',
    read: false,
  },
  {
    id: 'notif-4',
    title: 'Surat Jalan Dispatched',
    message: 'Armada B-9821-KFO mengangkut 2.000m kabel ADSS menuju site penarikan Kranji.',
    time: '2 jam lalu',
    type: 'project',
    read: true,
  },
];

export function Header() {
  const { user, role, logout, sidebarCollapsed, toggleSidebar, toggleMobileMenu } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

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
      {/* Left section: Sidebar Toggle [ | ] + Greeting */}
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
            Selamat datang, {firstName}
          </h1>
        </div>
      </div>

      {/* Right section: Notifikasi + Role Badge + CMS Button (Super Admin) + User Info + Keluar */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
        {/* Interactive Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors relative"
            title="Notifikasi Operasional"
            aria-label="Notifikasi"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-[10px] font-semibold text-white flex items-center justify-center leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl z-50 p-4 text-zinc-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Notifikasi Operasional</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold border border-red-500/30">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                    >
                      <Check className="w-3 h-3 text-emerald-400" />
                      Tandai Dibaca
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 text-zinc-500 hover:text-zinc-300 rounded hover:bg-zinc-800"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Notification Items List */}
              <div className="mt-2 space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl border transition-colors ${
                      n.read
                        ? 'bg-zinc-950/40 border-zinc-800/60 text-zinc-400'
                        : 'bg-zinc-800/80 border-blue-500/40 text-zinc-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'attendance' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {n.type === 'finance' && <Coins className="w-4 h-4 text-amber-400" />}
                        {n.type === 'warehouse' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                        {n.type === 'project' && <Truck className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white truncate">{n.title}</span>
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {n.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{n.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Authenticated Role Badge */}
        <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-200 shadow-sm">
          {currentRoleOption.icon}
          <span className="hidden sm:inline">{currentRoleOption.label}</span>
          <span className="sm:hidden">{currentRoleOption.label.split(' ')[0]}</span>
        </div>

        {/* CMS Button Exclusively for Super Admin (taruh disamping role super admin) */}
        {role === 'super_admin' && (
          <Link
            href="/dashboard/cms"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 border border-blue-400/30"
            title="Kelola Portal via CMS Super Admin"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>CMS</span>
          </Link>
        )}

        {/* User Info (Name, Email & Avatar) */}
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

          {/* Desktop Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 py-1.5 px-2.5 text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors border border-transparent hover:border-zinc-800"
            title="Keluar dari Akun"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}