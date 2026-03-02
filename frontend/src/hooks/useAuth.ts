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
        // 1. Check for cached session first (instant load)
        const cachedSession = localStorage.getItem('sb_session');
        if (cachedSession) {
            try {
                setSession(JSON.parse(cachedSession));
            } catch (e) {
                localStorage.removeItem('sb_session');
            }
        }

        // 2. Initial Session Check with timeout (5 seconds max)
        const timeout = setTimeout(() => {
            setLoading(false); // Don't wait forever
        }, 5000);

        supabase.auth.getSession().then(({ data: { session } }) => {
            clearTimeout(timeout);
            setSession(session);
            if (session) {
                localStorage.setItem('sb_session', JSON.stringify(session));
                fetchProfile(session.user.id);
            } else {
                localStorage.removeItem('sb_session');
                setLoading(false);
            }
        }).catch(() => {
            clearTimeout(timeout);
            setLoading(false);
        });

        // 3. Listen for Auth Changes (Sign In, Sign Out, Token Refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (session) {
                localStorage.setItem('sb_session', JSON.stringify(session));
                await fetchProfile(session.user.id);
            } else {
                localStorage.removeItem('sb_session');
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    /**
     * Fetch user's security profile from the 'profiles' table.
     * This determines if they are an admin or if they are approved to use the hub.
     * Has a 5-second timeout to prevent hanging on slow networks.
     */
    const fetchProfile = async (userId: string) => {
        const profileTimeout = setTimeout(() => {
            setLoading(false); // Don't wait forever for profile
        }, 5000);

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
            clearTimeout(profileTimeout);
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
