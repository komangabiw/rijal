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
  ShieldAlert,
  Radio,
  FileCheck2,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  allowedRoles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    title: 'Executive Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['super_admin', 'hr_admin', 'project_manager', 'finance', 'warehouse_logistics', 'field_technician'],
  },
  {
    title: 'Absensi (Field & Office)',
    href: '/dashboard/attendance',
    icon: CalendarCheck2,
    badge: 'GPS Active',
    allowedRoles: ['super_admin', 'hr_admin', 'project_manager', 'finance', 'warehouse_logistics', 'field_technician'],
  },
  {
    title: 'Implementasi Proyek',
    href: '/dashboard/projects',
    icon: FolderGit2,
    badge: '3 Active',
    allowedRoles: ['super_admin', 'project_manager', 'field_technician', 'finance'],
  },
  {
    title: 'Finance & Reimbursement',
    href: '/dashboard/finance',
    icon: ReceiptText,
    badge: '1 Pending',
    allowedRoles: ['super_admin', 'finance', 'project_manager', 'field_technician'],
  },
  {
    title: 'Warehouse & Inventory',
    href: '/dashboard/warehouse',
    icon: Boxes,
    badge: '2 Low',
    allowedRoles: ['super_admin', 'warehouse_logistics', 'project_manager'],
  },
  {
    title: 'Logistik & Surat Jalan',
    href: '/dashboard/logistics',
    icon: Truck,
    badge: '1 Transit',
    allowedRoles: ['super_admin', 'warehouse_logistics', 'project_manager', 'field_technician'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role, user } = useAuth();

  const filteredNav = NAV_ITEMS.filter((item) => item.allowedRoles.includes(role));

  return (
    <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-40 bg-slate-900 border-r border-slate-800 text-white">
      {/* Brand logo & status */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
          <Radio className="w-5 h-5 animate-pulse" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            PT TELEKOM
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            Operations & ERP Portal
          </div>
        </div>
      </div>

      {/* Role banner */}
      <div className="px-4 py-3 mx-4 my-3 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
            Active Persona
          </div>
          <div className="text-xs font-semibold text-blue-400 capitalize truncate">
            {role.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Navigation menu */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Core Modules
        </div>
        {filteredNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  )}
                />
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* User footer info */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt="Avatar"
            className="w-8 h-8 rounded-full object-cover border border-slate-700"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">{user?.full_name}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.division || 'Operasional'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
