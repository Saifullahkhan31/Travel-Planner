import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user     : User | null;
  loading  : boolean;
  signIn   : (email: string, password: string) => Promise<{ error: string | null }>;
  signUp   : (email: string, password: string, data: Partial<User>) => Promise<{ user: User | null; error: string | null }>;
  signOut  : () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const session = await authService.getSession();
        if (session) {
          const profile = await authService.getProfile(session.userId);
          setUser(profile);
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user: u, error } = await authService.signIn(email, password);
    if (u) setUser(u);
    return { error };
  };

  const signUp = async (email: string, password: string, data: Partial<User>) => {
    const result = await authService.signUp(email, password, data);
    if (result.user) setUser(result.user);
    return result;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const { data } = await authService.updateProfile(user.id, updates);
    if (data) setUser(data);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
