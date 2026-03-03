import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/auth';

interface AuthContextType {
    session: any;
    profile: Profile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
    signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<any>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let timeoutFired = false;

        // Single 10-second timeout for entire auth init (getSession + fetchProfile)
        const timeout = setTimeout(() => {
            timeoutFired = true;
            if (isMounted) {
                // If Supabase is slow, allow the UI to show current state (or redirect to login if no session)
                console.warn('[Auth] Timeout: Supabase took >10s, proceeding with available state');
                setLoading(false);
            }
        }, 10000);

        // Verify Supabase is initialized
        if (!supabase.auth) {
            console.error('[Auth] Supabase not initialized - check env vars');
            clearTimeout(timeout);
            if (isMounted) {
                setSession(null);
                setProfile(null);
                setLoading(false);
            }
            return;
        }

        // Check for auth error in URL hash (Supabase common pattern)
        const hash = window.location.hash;
        if (hash.includes('error=') || hash.includes('error_description=')) {
            const params = new URLSearchParams(hash.substring(1));
            const error = params.get('error_description') || params.get('error');
            console.error('[Auth] Redirect error detected:', error);
            // Optionally toast or set state, but getting session will likely fail anyway
        }

        // Call getSession with error boundary
        Promise.resolve()
            .then(() => supabase.auth.getSession())
            .then(({ data: { session }, error }) => {
                if (timeoutFired || !isMounted) return;

                if (error) {
                    console.error('[Auth] getSession returned error:', error.message);
                    throw error;
                }

                clearTimeout(timeout);
                setSession(session);
                if (session) {
                    localStorage.setItem('sb_session', JSON.stringify(session));
                    fetchProfile(session.user.id);
                } else {
                    localStorage.removeItem('sb_session');
                    setLoading(false);
                }
            })
            .catch((error) => {
                if (timeoutFired || !isMounted) return;

                console.error('[Auth] getSession error:', error?.message || error);
                clearTimeout(timeout);
                setSession(null);
                setProfile(null);
                localStorage.removeItem('sb_session');
                setLoading(false);
            });

        // 3. Listen for Auth Changes (Sign In, Sign Out, Token Refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (isMounted) {
                setSession(session);
                if (session) {
                    localStorage.setItem('sb_session', JSON.stringify(session));
                    await fetchProfile(session.user.id);
                } else {
                    localStorage.removeItem('sb_session');
                    setProfile(null);
                    setLoading(false);
                }
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    /**
     * Fetch user's security profile from the 'profiles' table.
     * This determines if they are an admin or if they are approved to use the hub.
     * Has a 2-second timeout to keep total auth init under 5 seconds.
     */
    const fetchProfile = async (userId: string) => {
        const profileTimeout = setTimeout(() => {
            console.warn('[Auth] Profile fetch timeout - setting loading to false');
            setLoading(false); // Don't wait forever for profile
        }, 2000);

        try {
            console.log('[Auth] Fetching profile for user:', userId);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // 404 (PGRST116) means profile doesn't exist - this is expected for new users
                if (error.code === 'PGRST116') {
                    console.warn('[Auth] Profile not found (404) - user may be newly signed up');
                    setProfile(null);
                    clearTimeout(profileTimeout);
                    setLoading(false);
                    return;
                }
                console.error('[Auth] Profile fetch error:', error.code, error.message);
                throw error;
            }

            if (!data) {
                console.warn('[Auth] Profile query returned no data - user may not be in database yet');
                setProfile(null);
            } else {
                console.log('[Auth] Profile loaded successfully:', { id: data.id, is_approved: data.is_approved, role: data.role });
                setProfile(data as Profile);
            }
        } catch (err: any) {
            console.error('[Auth] Error fetching security profile:', err?.message || err);
            setProfile(null);
        } finally {
            clearTimeout(profileTimeout);
            setLoading(false);
        }
    };

    /**
     * Refresh profile data manually (e.g., after an admin approval).
     */
    const refreshProfile = async () => {
        if (session?.user?.id) {
            await fetchProfile(session.user.id);
        }
    };

    return (
        <AuthContext.Provider value={{
            session,
            profile,
            loading,
            refreshProfile,
            signOut: async () => {
                const { error } = await supabase.auth.signOut();
                if (error) console.error('[Auth] SignOut error:', error);

                // Aggressively clear local state on sign out
                setSession(null);
                setProfile(null);
                setLoading(false);
                localStorage.removeItem('sb_session');

                return { error };
            },
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
