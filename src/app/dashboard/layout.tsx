'use client';

import React from 'react';
import { AuthProvider } from '@/context/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50 flex">
        {/* Persistent Desktop Sidebar & Mobile Slide-Over Drawer */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header />
          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-28 lg:pb-10 max-w-7xl w-full mx-auto">
            {children}
          </main>
          {/* Mobile Bottom Navigation Bar */}
          <MobileNav />
        </div>
      </div>
    </AuthProvider>
  );
}
