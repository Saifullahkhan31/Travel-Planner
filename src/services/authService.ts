import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { MOCK_USER } from './mockData';

const USER_KEY    = 'mock_user';
const SESSION_KEY = 'mock_session';

// Mock registered users store
const REGISTERED_USERS: Record<string, { password: string; user: User }> = {
  'saifullah@iobm.edu.pk': { password: 'Password1', user: MOCK_USER },
  'demo@iobm.edu.pk'     : { password: 'Password1', user: { ...MOCK_USER, id: 'u2', name: 'Demo User', email: 'demo@iobm.edu.pk' } },
};

export const authService = {
  async signUp(email: string, password: string, userData: Partial<User>): Promise<{ user: User | null; error: string | null }> {
    await new Promise(r => setTimeout(r, 1000));
    if (REGISTERED_USERS[email]) {
      return { user: null, error: 'An account with this email already exists.' };
    }
    const newUser: User = {
      id: `u_${Date.now()}`, name: userData.name || '', email,
      phone: userData.phone || '', gender: userData.gender || '',
      genderPreference: userData.genderPreference || 'no_preference',
      seatPreference: 'window', busTypePreference: 'AC',
      frequentRoutes: [], area: '', occupation: 'student',
      role: 'commuter', notifTrips: true, notifCrowd: true,
      notifBookings: true, createdAt: new Date().toISOString(),
    };
    REGISTERED_USERS[email] = { password, user: newUser };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ userId: newUser.id, email }));
    return { user: newUser, error: null };
  },

  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    await new Promise(r => setTimeout(r, 800));
    const record = REGISTERED_USERS[email];
    if (!record || record.password !== password) {
      return { user: null, error: 'Invalid email or password.' };
    }
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(record.user));
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ userId: record.user.id, email }));
    return { user: record.user, error: null };
  },

  async signOut(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.removeItem(SESSION_KEY);
  },

  async getSession(): Promise<{ userId: string; email: string } | null> {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async getProfile(userId: string): Promise<User | null> {
    try {
      const raw = await AsyncStorage.getItem(USER_KEY);
      if (!raw) return null;
      const user: User = JSON.parse(raw);
      return user.id === userId ? user : MOCK_USER;
    } catch {
      return null;
    }
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<{ data: User | null; error: string | null }> {
    await new Promise(r => setTimeout(r, 500));
    try {
      const raw = await AsyncStorage.getItem(USER_KEY);
      const existing: User = raw ? JSON.parse(raw) : MOCK_USER;
      const updated = { ...existing, ...updates };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
      return { data: updated, error: null };
    } catch {
      return { data: null, error: 'Failed to update profile.' };
    }
  },

  async resetPassword(_email: string): Promise<{ error: string | null }> {
    await new Promise(r => setTimeout(r, 800));
    return { error: null };
  },
};
