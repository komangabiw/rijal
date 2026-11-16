'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '@/types/database';
import { DEMO_PROFILES } from '@/lib/mock-data';

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  switchRole: (role: UserRole) => void;
  setUser: (profile: Profile) => void;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Default to Super Admin so all initial views can be inspected immediately
  const [currentUser, setCurrentUser] = useState<Profile>(DEMO_PROFILES[0]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem('pt_telecom_role') as UserRole | null;
    if (savedRole) {
      const found = DEMO_PROFILES.find((p) => p.role === savedRole);
      if (found) setCurrentUser(found);
    }
  }, []);

  const switchRole = (newRole: UserRole) => {
    const targetProfile = DEMO_PROFILES.find((p) => p.role === newRole) || DEMO_PROFILES[0];
    setCurrentUser(targetProfile);
    localStorage.setItem('pt_telecom_role', newRole);
  };

  const logout = () => {
    // Return to default technician or login
    window.location.href = '/login';
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
