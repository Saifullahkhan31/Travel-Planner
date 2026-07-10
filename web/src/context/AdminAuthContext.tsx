import React, { createContext, useContext, useEffect, useState } from 'react';
import { adminAuthService, AdminUser } from '../services/adminAuthService';

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { user: sessionUser, error: sessionError } = await adminAuthService.getSession();
      setUser(sessionUser);
      if (sessionError) setError(sessionError);
      setLoading(false);
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    const { user: loginUser, error: loginError } = await adminAuthService.login(email, password);
    if (loginError) {
      setError(loginError);
      setUser(null);
    } else {
      setUser(loginUser);
      setError(null);
    }
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    const { error: logoutError } = await adminAuthService.logout();
    if (logoutError) {
      setError(logoutError);
    } else {
      setUser(null);
      setError(null);
    }
    setLoading(false);
  };

  return (
    <AdminAuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
