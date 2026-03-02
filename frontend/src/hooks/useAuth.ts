import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/auth';

/**
 * useAuth Hook
 * 
 * Centralized authentication and profile management for the Labour Code application.
 * This hook ensures that security status (is_approved, role) is always up-to-date.
 */
export function useAuth() {
    const [session, setSession] = useState<any>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Initial Session Check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // 2. Listen for Auth Changes (Sign In, Sign Out, Token Refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (session) {
                await fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    /**
     * Fetch user's security profile from the 'profiles' table.
     * This determines if they are an admin or if they are approved to use the hub.
     */
    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setProfile(data as Profile);
        } catch (err) {
            console.error("Error fetching security profile:", err);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Refresh profile data manually (e.g., after an admin approval).
     */
    const refreshProfile = () => {
        if (session?.user?.id) {
            return fetchProfile(session.user.id);
        }
    };

    return {
        session,
        profile,
        loading,
        refreshProfile,
        signOut: () => supabase.auth.signOut(),
    };
}
