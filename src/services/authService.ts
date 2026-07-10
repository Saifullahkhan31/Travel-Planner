import { supabase } from '../lib/supabase';
import { User, GenderPreference, SeatPosition, BusType, OccupationType, UserRole } from '../types';

// ─── Supabase profile → App User mapper ──────────────────────────────────────
function mapProfileToUser(authUser: any, profile: any): User {
  return {
    id              : authUser.id,
    email           : authUser.email || '',
    name            : profile?.full_name || authUser.email?.split('@')[0] || 'Traveller',
    avatarUrl       : profile?.avatar_url || '',
    phone           : profile?.phone || '',
    gender          : profile?.gender || '',
    genderPreference: (profile?.gender_preference || 'no_preference') as GenderPreference,
    seatPreference  : (profile?.seat_preference   || 'window') as SeatPosition,
    busTypePreference:(profile?.bus_type_preference|| 'AC') as BusType,
    frequentRoutes  : profile?.frequent_routes || [],
    area            : profile?.area || '',
    occupation      : (profile?.occupation || 'student') as OccupationType,
    role            : (profile?.role       || 'commuter') as UserRole,
    notifTrips      : profile?.notif_trips              ?? true,
    notifCrowd      : profile?.notif_crowd              ?? true,
    notifBookings   : profile?.notif_bookings           ?? true,
    preferredDepartureTime: profile?.preferred_departure_time ?? 'morning',
    travelPriority  : profile?.travel_priority          ?? 'comfort',
    budgetRange     : profile?.budget_range             ?? 'medium',
    createdAt       : authUser.created_at,
  };
}

// ─── Upsert helper — creates profile if it doesn't exist, updates if it does ─
async function upsertProfile(userId: string, fields: Record<string, any>) {
  const { error } = await supabase.from('profiles').upsert(
    { id: userId, ...fields },
    { onConflict: 'id' }
  );
  if (error) console.warn('[authService] upsertProfile error:', error.message);
}

export const authService = {
  // ── Sign Up ────────────────────────────────────────────────────────────────
  async signUp(
    email: string,
    password: string,
    userData: Partial<User>
  ): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('Signup failed.');

      // Upsert so it never fails with a duplicate-key error either
      await upsertProfile(data.user.id, {
        full_name        : userData.name,
        phone            : userData.phone,
        gender           : userData.gender,
        gender_preference: userData.genderPreference || 'no_preference',
        occupation       : userData.occupation || 'student',
      });

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', data.user.id).single();

      return { user: mapProfileToUser(data.user, profile), error: null };
    } catch (err: any) {
      return { user: null, error: err.message };
    }
  },

  // ── Sign In ────────────────────────────────────────────────────────────────
  async signIn(
    email: string,
    password: string
  ): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('Sign in failed.');

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', data.user.id).single();

      // If for some reason the profile row is missing, upsert a minimal one
      if (!profile) {
        await upsertProfile(data.user.id, {
          full_name: data.user.email?.split('@')[0] || 'Traveller',
        });
        const { data: newProfile } = await supabase
          .from('profiles').select('*').eq('id', data.user.id).single();
        return { user: mapProfileToUser(data.user, newProfile), error: null };
      }

      return { user: mapProfileToUser(data.user, profile), error: null };
    } catch (err: any) {
      return { user: null, error: err.message };
    }
  },

  // ── Sign Out ───────────────────────────────────────────────────────────────
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  // ── Get Session ────────────────────────────────────────────────────────────
  async getSession(): Promise<{ userId: string; email: string } | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return { userId: session.user.id, email: session.user.email || '' };
    }
    return null;
  },

  // ── Get Profile ────────────────────────────────────────────────────────────
  // Returns null only if there is NO authenticated session at all.
  // If the profile row is missing, returns a minimal user derived from auth.
  async getProfile(userId: string): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) return null;

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', userId).single();

    // No profile row yet — return minimal object so the app doesn't log out
    return mapProfileToUser(user, profile ?? {});
  },

  // ── Update Profile ─────────────────────────────────────────────────────────
  async updateProfile(
    userId: string,
    updates: Partial<User>
  ): Promise<{ data: User | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) throw new Error('Not authorized');

      const payload: Record<string, any> = {
        full_name          : updates.name,
        avatar_url         : updates.avatarUrl,
        phone              : updates.phone,
        gender             : updates.gender,
        gender_preference  : updates.genderPreference,
        seat_preference    : updates.seatPreference,
        bus_type_preference: updates.busTypePreference,
        frequent_routes    : updates.frequentRoutes,
        area               : updates.area,
        occupation         : updates.occupation,
        notif_trips              : updates.notifTrips,
        notif_crowd              : updates.notifCrowd,
        notif_bookings           : updates.notifBookings,
        preferred_departure_time : updates.preferredDepartureTime,
        travel_priority          : updates.travelPriority,
        budget_range             : updates.budgetRange,
        updated_at               : new Date().toISOString(),
      };

      // Strip undefined values so we don't accidentally null out existing fields
      Object.keys(payload).forEach(k => {
        if (payload[k] === undefined) delete payload[k];
      });

      await upsertProfile(userId, payload);

      const { data: newProfile } = await supabase
        .from('profiles').select('*').eq('id', userId).single();

      return { data: mapProfileToUser(user, newProfile), error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  // ── Password Reset Flow ────────────────────────────────────────────────────
  async resetPassword(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error?.message || null };
  },

  async verifyResetOTP(email: string, token: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
    return { error: error?.message || null };
  },

  async updatePassword(password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message || null };
  },

  // ── Create Admin Account (Web Admin Panel Only) ─────────────────────────────
  async createAdminAccount(
    email: string,
    password: string,
    adminName: string
  ): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('Admin signup failed.');

      await upsertProfile(data.user.id, {
        full_name: adminName,
        role: 'admin',
      });

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', data.user.id).single();

      return { user: mapProfileToUser(data.user, profile), error: null };
    } catch (err: any) {
      return { user: null, error: err.message };
    }
  },

  // ── Promote User to Admin ──────────────────────────────────────────────────
  async promoteUserToAdmin(userId: string): Promise<{ error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: adminProfile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      if (adminProfile?.role !== 'admin') throw new Error('Only admins can promote users');

      await upsertProfile(userId, { role: 'admin' });
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  },

  // ── Demote Admin to User ───────────────────────────────────────────────────
  async demoteAdminToUser(userId: string): Promise<{ error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: adminProfile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      if (adminProfile?.role !== 'admin') throw new Error('Only admins can demote users');

      await upsertProfile(userId, { role: 'commuter' });
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  },
};
