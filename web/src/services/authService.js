import { supabase } from '../lib/supabaseClient';
export const authService = {
    async promoteUserToAdmin(userId) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user)
                throw new Error('Not authenticated');
            const { data: adminProfile } = await supabase
                .from('profiles').select('role').eq('id', user.id).single();
            if (adminProfile?.role !== 'admin')
                throw new Error('Only admins can promote users');
            const { error } = await supabase
                .from('profiles')
                .update({ role: 'admin' })
                .eq('id', userId);
            if (error)
                throw error;
            return { error: null };
        }
        catch (err) {
            return { error: err.message };
        }
    },
    async demoteAdminToUser(userId) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user)
                throw new Error('Not authenticated');
            const { data: adminProfile } = await supabase
                .from('profiles').select('role').eq('id', user.id).single();
            if (adminProfile?.role !== 'admin')
                throw new Error('Only admins can demote users');
            const { error } = await supabase
                .from('profiles')
                .update({ role: 'commuter' })
                .eq('id', userId);
            if (error)
                throw error;
            return { error: null };
        }
        catch (err) {
            return { error: err.message };
        }
    },
};
