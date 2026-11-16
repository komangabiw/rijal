'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // If session cookie and role are present, go to dashboard, otherwise login
    const hasCookie = document.cookie.split(';').some((item) => item.trim().startsWith('telecom_session=') && item.split('=')[1]);
    const saved = localStorage.getItem('pt_telecom_role');
    if (saved && hasCookie) {
      router.push('/dashboard');
    } else {
      localStorage.removeItem('pt_telecom_role');
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-400">
          Memuat PT Telekomunikasi Operations ERP...
        </p>
      </div>
    </div>
  );
}
