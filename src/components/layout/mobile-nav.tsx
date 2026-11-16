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
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800 shadow-[0_-4px_16px_rgba(0,0,0,0.5)] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around px-1 pt-1.5">
        {MOBILE_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl text-[10px] font-medium transition-all active:scale-95',
                isActive
                  ? 'text-white font-bold bg-zinc-900 border border-zinc-800'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5 mb-0.5', isActive ? 'text-white stroke-[2.5]' : 'text-zinc-400')} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                )}
              </div>
              <span className="leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
