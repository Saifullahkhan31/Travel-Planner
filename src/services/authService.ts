import { supabase } from '../lib/supabase';
import { User, GenderPreference, SeatPosition, BusType, OccupationType, UserRole } from '../types';

// Map Supabase Profile to App User Type
function mapProfileToUser(authUser: any, profileMap: any): User {
  return {
    id: authUser.id,
    email: authUser.email || '',
    name: profileMap?.full_name || '',
    avatarUrl: profileMap?.avatar_url || '',
    phone: profileMap?.phone || '',
    gender: profileMap?.gender || '',
    genderPreference: (profileMap?.gender_preference || 'no_preference') as GenderPreference,
    seatPreference: (profileMap?.seat_preference || 'window') as SeatPosition,
    busTypePreference: (profileMap?.bus_type_preference || 'AC') as BusType,
    frequentRoutes: profileMap?.frequent_routes || [],
    area: profileMap?.area || '',
    occupation: (profileMap?.occupation || 'student') as OccupationType,
    role: (profileMap?.role || 'commuter') as UserRole,
    notifTrips: profileMap?.notif_trips ?? true,
    notifCrowd: profileMap?.notif_crowd ?? true,
    notifBookings: profileMap?.notif_bookings ?? true,
    createdAt: authUser.created_at,
  };
}

export const authService = {
  async signUp(email: string, password: string, userData: Partial<User>): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Signup failed.');

      // Insert profile details
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: userData.name,
        phone: userData.phone,
        gender: userData.gender,
        gender_preference: userData.genderPreference,
        occupation: userData.occupation || 'student',
      });

      if (profileError) console.error('Profile insertion error:', profileError);

      const profileRes = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      return { user: mapProfileToUser(data.user, profileRes.data), error: null };
    } catch (err: any) {
      return { user: null, error: err.message };
    }
  },

  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('Sign in failed.');

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      return { user: mapProfileToUser(data.user, profileData), error: null };
    } catch (err: any) {
      return { user: null, error: err.message };
    }
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  async getSession(): Promise<{ userId: string; email: string } | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return { userId: session.user.id, email: session.user.email || '' };
    }
    return null;
  },

  async getProfile(userId: string): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) return null;

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!profile) return null;

    return mapProfileToUser(user, profile);
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<{ data: User | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) throw new Error('Not authorized');

      const mappedUpdates = {
        full_name: updates.name,
        avatar_url: updates.avatarUrl,
        phone: updates.phone,
        gender: updates.gender,
        gender_preference: updates.genderPreference,
        seat_preference: updates.seatPreference,
        bus_type_preference: updates.busTypePreference,
        frequent_routes: updates.frequentRoutes,
        area: updates.area,
        occupation: updates.occupation,
        notif_trips: updates.notifTrips,
        notif_crowd: updates.notifCrowd,
        notif_bookings: updates.notifBookings,
      };

      // Clean undefined values
      Object.keys(mappedUpdates).forEach(k => {
        if ((mappedUpdates as any)[k] === undefined) delete (mappedUpdates as any)[k];
      });

      const { error } = await supabase.from('profiles').update(mappedUpdates).eq('id', userId);
      if (error) throw error;

      const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      return { data: mapProfileToUser(user, newProfile), error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async resetPassword(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error?.message || null };
  },
};
