'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CalendarCheck2,
  FolderGit2,
  ReceiptText,
  Truck,
} from 'lucide-react';

const MOBILE_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Absen', href: '/dashboard/attendance', icon: CalendarCheck2 },
  { label: 'Proyek', href: '/dashboard/projects', icon: FolderGit2 },
  { label: 'Klaim', href: '/dashboard/finance', icon: ReceiptText },
  { label: 'Logistik', href: '/dashboard/logistics', icon: Truck },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {MOBILE_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-blue-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-0.5', isActive && 'text-blue-600')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
