'use client';

import React from 'react';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { cn } from '@/lib/utils';

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex transition-colors duration-300">
      {/* Collapsible Persistent Desktop Sidebar & Mobile Slide-Over Drawer */}
      <Sidebar />

      {/* Main Content Area - shifts padding dynamically on sidebar toggle */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'lg:pl-0' : 'lg:pl-64'
        )}
      >
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 lg:pb-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
        {/* Mobile Bottom Navigation Bar */}
        <MobileNav />
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </AuthProvider>
  );
}
