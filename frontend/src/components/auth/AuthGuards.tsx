import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * AuthGuard
 * 
 * Tier 1 Security: Ensures the user is logged in.
 * If not, they are redirected to /login with the current path saved.
 */
export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F3F3F2]">Loading secure context...</div>;

    if (!session) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

/**
 * ApprovalGuard
 * 
 * Tier 2 Security: Ensures the user is approved by an admin.
 * If not, they are redirected to /onboarding.
 */
export const ApprovalGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { profile, loading } = useAuth();

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F3F3F2]">Verifying approval status...</div>;

    if (!profile?.is_approved) {
        return <Navigate to="/onboarding" replace />;
    }

    return <>{children}</>;
};

/**
 * AdminGuard
 * 
 * Tier 3 Security: Ensures the user has the 'admin' role.
 * If not, they are redirected back to the main hub.
 */
export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { profile, loading } = useAuth();

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F3F3F2]">Verifying administrator privileges...</div>;

    if (profile?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
