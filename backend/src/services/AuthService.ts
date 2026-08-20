import { supabase } from '../config/database';

export class AuthService {
    /**
     * Creates a new staff user in Supabase Auth and linking it to staff_profiles.
     * Requires SUPABASE_KEY to be a service_role key.
     */
    async createStaff(payload: { email: string; password: string; full_name: string; role: 'owner' | 'staff' }) {
        // 1. Create user in GoTrue (Supabase Auth)
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: payload.email,
            password: payload.password,
            email_confirm: true // Auto confirm so they can login immediately
        });

        if (authError || !authData.user) {
            throw new Error(`Failed to create auth user: ${authError?.message}`);
        }

        // 2. Insert into staff_profiles
        const { data: profileData, error: profileError } = await supabase
            .from('staff_profiles')
            .insert({
                id: authData.user.id,
                full_name: payload.full_name,
                role: payload.role
            })
            .select('*')
            .single();

        if (profileError) {
            // Rollback if profile creation fails (delete auth user)
            await supabase.auth.admin.deleteUser(authData.user.id);
            throw new Error(`Failed to create staff profile: ${profileError.message}`);
        }

        return profileData;
    }

    async getStaffList() {
        const { data, error } = await supabase
            .from('staff_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    }

    async toggleStaffStatus(id: string, is_active: boolean) {
        const { data, error } = await supabase
            .from('staff_profiles')
            .update({ is_active })
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw new Error(error.message);
        return data;
    }
}
