import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabase';

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

  // Build a minimal User from a Supabase auth session (no profile row needed)
  function sessionUser(authUser: any): User {
    return {
      id    : authUser.id,
      email : authUser.email ?? '',
      name  : authUser.email?.split('@')[0] ?? 'Traveller',
      avatarUrl: '',
      phone : '',
      gender: '',
      genderPreference: 'no_preference',
      seatPreference  : 'window',
      busTypePreference: 'AC',
      frequentRoutes  : [],
      area       : '',
      occupation : 'student',
      role       : 'commuter',
      notifTrips     : true,
      notifCrowd     : true,
      notifBookings  : true,
      preferredDepartureTime: 'morning',
      travelPriority : 'comfort',
      budgetRange    : 'medium',
      createdAt      : authUser.created_at ?? new Date().toISOString(),
    };
  }

  useEffect(() => {
    let initialised = false;

    // onAuthStateChange fires INITIAL_SESSION immediately when the client
    // reads the persisted token from AsyncStorage. We use this as our single
    // source of truth so we never need a separate getSession() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setLoading(false);
          initialised = true;
          return;
        }

        // INITIAL_SESSION | SIGNED_IN | TOKEN_REFRESHED | USER_UPDATED
        if (session?.user) {
          try {
            const profile = await authService.getProfile(session.user.id);
            setUser(profile ?? sessionUser(session.user));
          } catch {
            // Network blip — keep user logged in with minimal info
            setUser(sessionUser(session.user));
          } finally {
            if (!initialised) {
              setLoading(false);
              initialised = true;
            }
          }
        }
      }
    );

    // Safety: if listener never fires (e.g. no network + no cached token)
    // clear loading after 3 seconds so the app doesn't hang on splash.
    const timeout = setTimeout(() => {
      if (!initialised) {
        setLoading(false);
        initialised = true;
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
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
