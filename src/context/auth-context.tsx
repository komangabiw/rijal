'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '@/types/database';
import { DEMO_PROFILES } from '@/lib/mock-data';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  switchRole: (role: UserRole) => void;
  setUser: (profile: Profile) => void;
  isLoading: boolean;
  logout: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Profile>(DEMO_PROFILES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem('pt_telecom_role') as UserRole | null;
    if (savedRole) {
      const found = DEMO_PROFILES.find((p) => p.role === savedRole);
      if (found) setCurrentUser(found);
    }
    const savedSidebar = localStorage.getItem('pt_telecom_sidebar_collapsed');
    if (savedSidebar === 'true') {
      setSidebarCollapsed(true);
    }
  }, []);

  const switchRole = (newRole: UserRole) => {
    const targetProfile = DEMO_PROFILES.find((p) => p.role === newRole) || DEMO_PROFILES[0];
    setCurrentUser(targetProfile);
    localStorage.setItem('pt_telecom_role', newRole);
    document.cookie = `telecom_session=${newRole}; path=/; max-age=604800; SameSite=Lax`;
  };

  const logout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore signOut errors
    }

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors
    }

    // Bersihkan semua cookie sesi
    document.cookie = 'telecom_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'telecom_session=; path=/; max-age=0;';

    // Bersihkan local storage
    localStorage.removeItem('pt_telecom_role');
    localStorage.removeItem('pt_telecom_user');

    // Alihkan langsung ke halaman login dengan query pembersih sesi
    window.location.replace('/login?loggedOut=1');
  };

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('pt_telecom_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        role: currentUser.role,
        switchRole,
        setUser: setCurrentUser,
        isLoading,
        logout,
        mobileMenuOpen,
        setMobileMenuOpen,
        toggleMobileMenu,
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
