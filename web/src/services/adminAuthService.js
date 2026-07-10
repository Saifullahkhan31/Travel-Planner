import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
export const adminAuthService = {
    async login(email, password) {
        try {
            if (!isSupabaseConfigured)
                throw new Error('Missing Supabase credentials. Create web/.env.local from web/.env.local.example.');
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error)
                throw error;
            if (!data.user)
                throw new Error('Login failed');
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('full_name, role')
                .eq('id', data.user.id)
                .single();
            if (profileError)
                throw profileError;
            if (profile?.role !== 'admin')
                throw new Error('Admin access required');
            return {
                user: {
                    id: data.user.id,
                    email: data.user.email || '',
                    name: profile?.full_name || 'Admin',
                    role: profile?.role || 'commuter',
                },
                error: null,
            };
        }
        catch (err) {
            return { user: null, error: err.message };
        }
    },
    async logout() {
        try {
            if (!isSupabaseConfigured)
                return { error: null };
            const { error } = await supabase.auth.signOut();
            if (error)
                throw error;
            return { error: null };
        }
        catch (err) {
            return { error: err.message };
        }
    },
    async getSession() {
        try {
            if (!isSupabaseConfigured) {
                return {
                    user: null,
                    error: 'Missing Supabase credentials. Create web/.env.local from web/.env.local.example.',
                };
            }
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError)
                throw sessionError;
            if (!session?.user)
                return { user: null, error: null };
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('full_name, role')
                .eq('id', session.user.id)
                .single();
            if (profileError)
                throw profileError;
            if (profile?.role !== 'admin')
                throw new Error('Admin access required');
            return {
                user: {
                    id: session.user.id,
                    email: session.user.email || '',
                    name: profile?.full_name || 'Admin',
                    role: profile?.role || 'commuter',
                },
                error: null,
            };
        }
        catch (err) {
            return { user: null, error: err.message };
        }
    },
};
