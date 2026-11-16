'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/types/database';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CalendarCheck2,
  FolderGit2,
  ReceiptText,
  Boxes,
  Truck,
  Radio,
  X,
} from 'lucide-react';
import { DEMO_PROFILES } from '@/lib/mock-data';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  allowedRoles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['super_admin', 'hr_admin', 'project_manager', 'finance', 'warehouse_logistics', 'field_technician'],
  },
  {
    title: 'Absensi (Field & GPS)',
    href: '/dashboard/attendance',
    icon: CalendarCheck2,
    allowedRoles: ['super_admin', 'hr_admin', 'project_manager', 'finance', 'warehouse_logistics', 'field_technician'],
  },
  {
    title: 'Implementasi Proyek',
    href: '/dashboard/projects',
    icon: FolderGit2,
    badge: '3',
    allowedRoles: ['super_admin', 'project_manager', 'field_technician', 'finance'],
  },
  {
    title: 'Finance & Reimbursement',
    href: '/dashboard/finance',
    icon: ReceiptText,
    badge: '1',
    allowedRoles: ['super_admin', 'finance', 'project_manager', 'field_technician'],
  },
  {
    title: 'Warehouse & Inventory',
    href: '/dashboard/warehouse',
    icon: Boxes,
    badge: '2',
    allowedRoles: ['super_admin', 'warehouse_logistics', 'project_manager'],
  },
  {
    title: 'Logistik & Surat Jalan',
    href: '/dashboard/logistics',
    icon: Truck,
    badge: '1',
    allowedRoles: ['super_admin', 'warehouse_logistics', 'project_manager', 'field_technician'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role, mobileMenuOpen, setMobileMenuOpen, sidebarCollapsed } = useAuth();

  const filteredNav = NAV_ITEMS.filter((item) => item.allowedRoles.includes(role));

  const content = (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100 select-none">
      {/* Brand logo & header - Clean single logo, no duplicate collapse button */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-800/80">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-white shadow-sm group-hover:border-zinc-500 transition-colors shrink-0">
            <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
              PT Telekomunikasi
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-[10px] text-zinc-400 font-normal truncate">
              Operations & ERP
            </div>
          </div>
        </Link>

        {/* Mobile close button only */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="Tutup menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation menu */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="px-2.5 pb-2 text-[11px] font-medium text-zinc-500 tracking-wide">
          Menu
        </div>
        {filteredNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150',
                isActive
                  ? 'bg-zinc-900 text-white shadow-sm border border-zinc-800'
                  : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-zinc-400'
                  )}
                />
                <span className="truncate">{item.title}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    'min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-[10px] font-semibold shrink-0 ml-1.5 transition-colors',
                    isActive
                      ? 'bg-zinc-800 text-zinc-200 border border-zinc-700/80 shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Your team section matching 21st.dev ShadcnStore layout */}
        <div className="pt-6 pb-4">
          <div className="px-2.5 pb-2 text-[11px] font-medium text-zinc-500 tracking-wide flex items-center justify-between">
            <span>Your team</span>
            <span className="text-[10px] bg-zinc-900 px-1.5 py-0.2 rounded border border-zinc-800 text-zinc-400">
              {DEMO_PROFILES.length}
            </span>
          </div>
          <div className="space-y-1">
            {DEMO_PROFILES.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-zinc-900/40 text-xs text-zinc-300 transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={member.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={member.full_name}
                    className="w-6 h-6 rounded-full object-cover border border-zinc-800 shrink-0"
                  />
                  <span className="truncate text-[11px] text-zinc-300 group-hover:text-white">
                    {member.full_name}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 truncate max-w-[80px] text-right font-normal">
                  {(member.division || 'Operations').split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent / Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed inset-y-0 z-40 bg-zinc-950 border-r border-zinc-800 transition-all duration-300 ease-in-out select-none',
          sidebarCollapsed
            ? 'w-0 -translate-x-full opacity-0 pointer-events-none overflow-hidden border-r-0'
            : 'w-64 translate-x-0 opacity-100 overflow-visible'
        )}
      >
        <div className="w-64 h-full flex flex-col">
          {content}
        </div>
      </aside>

      {/* Mobile Slide-Over Drawer with Animated Backdrop */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 transition-transform animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
