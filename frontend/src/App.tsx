import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Hooks & Types
import { useAuth } from './hooks/useAuth';

// Security Guards
import { AuthGuard, ApprovalGuard, AdminGuard } from './components/auth/AuthGuards';
import { ErrorBoundary } from './components/auth/ErrorBoundary';

// Pages
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { ComplianceHubPage } from './pages/ComplianceHubPage';
import { LabourAuditPage } from './pages/LabourAuditPage';
import { ProfilePage } from './pages/ProfilePage';
import { UsagePage } from './pages/UsagePage';
import { AdminPage } from './pages/AdminPage';

// Layout Components
import { ShieldCheck, User, LogOut } from 'lucide-react';
import { Button } from './components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '/api');

/**
 * App Component
 * 
 * The root of the Labour Code application.
 * Manages high-level routing and layout with strict security enforcement.
 */
export default function App() {
  const { session, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F3F2] animate-pulse">
        <ShieldCheck className="w-12 h-12 text-[#606C5A]" />
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-center" richColors />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/onboarding" element={
          <AuthGuard>
            <OnboardingPage />
          </AuthGuard>
        } />

        {/* Protected Hub Routes (Requires Auth + Approval) */}
        <Route path="/" element={
          <AuthGuard>
            <ApprovalGuard>
              <ErrorBoundary>
                <Layout signOut={signOut} profile={profile} session={session}>
                  <ComplianceHubPage session={session} profile={profile} apiUrl={API_URL} />
                </Layout>
              </ErrorBoundary>
            </ApprovalGuard>
          </AuthGuard>
        } />

        <Route path="/audit" element={
          <AuthGuard>
            <ApprovalGuard>
              <ErrorBoundary>
                <Layout signOut={signOut} profile={profile} session={session}>
                  <LabourAuditPage session={session} profile={profile} apiUrl={API_URL} />
                </Layout>
              </ErrorBoundary>
            </ApprovalGuard>
          </AuthGuard>
        } />

        <Route path="/profile" element={
          <AuthGuard>
            <ApprovalGuard>
              <ErrorBoundary>
                <Layout signOut={signOut} profile={profile} session={session}>
                  <ProfilePage session={session} profile={profile} />
                </Layout>
              </ErrorBoundary>
            </ApprovalGuard>
          </AuthGuard>
        } />

        <Route path="/usage" element={
          <AuthGuard>
            <ApprovalGuard>
              <ErrorBoundary>
                <Layout signOut={signOut} profile={profile} session={session}>
                  <UsagePage token={session?.access_token} dailyLimit={profile?.daily_audit_limit} role={profile?.role} />
                </Layout>
              </ErrorBoundary>
            </ApprovalGuard>
          </AuthGuard>
        } />

        {/* Admin Secret Routes (Requires Auth + Admin Role) */}
        <Route path="/admin" element={
          <AuthGuard>
            <AdminGuard>
              <ErrorBoundary>
                <Layout signOut={signOut} profile={profile} session={session}>
                  <AdminPage session={session} adminProfile={profile} />
                </Layout>
              </ErrorBoundary>
            </AdminGuard>
          </AuthGuard>
        } />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

/**
 * Layout Component
 *
 * Provides a consistent shell (Navbar) for all internal pages.
 */
const Layout: React.FC<{ children: React.ReactNode, signOut: () => void, profile: any, session: any }> = ({ children, signOut, profile, session }) => {
  const currentPath = window.location.pathname;
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F3F3F2] text-[#2C2A28] font-sans">
      <nav className="sticky top-0 z-50 w-full border-b border-[#E6E4E0] bg-[#FFFFFC] shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div
            className="flex items-center gap-2 font-bold text-xl tracking-tight text-[#2C2A28] cursor-pointer"
            onClick={() => navigate('/')}
          >
            <ShieldCheck className="w-6 h-6 text-[#606C5A]" />
            AuditAI
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-sm font-medium">
              <Link
                to="/"
                className={`flex items-center gap-2 transition-colors ${currentPath === '/' ? 'text-[#2C2A28]' : 'text-[#8F837A] hover:text-[#2C2A28]'}`}
              >
                <ShieldCheck className="w-4 h-4" />
                Compliance Hub
              </Link>
              {profile?.role === 'admin' && (
                <>
                  <Link
                    to="/usage"
                    className={`flex items-center gap-2 transition-colors ${currentPath === '/usage' ? 'text-[#2C2A28]' : 'text-[#8F837A] hover:text-[#2C2A28]'}`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Usage Analytics
                  </Link>
                  <Link
                    to="/admin"
                    className={`flex items-center gap-2 transition-colors ${currentPath === '/admin' ? 'text-[#2C2A28]' : 'text-[#8F837A] hover:text-[#2C2A28]'}`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Admin
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/profile')}
                className={`flex items-center gap-2 transition-colors ${currentPath === '/profile' ? 'text-[#2C2A28]' : 'text-[#8F837A] hover:text-[#2C2A28]'}`}
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </Button>

              <Button variant="ghost" size="sm" onClick={signOut} className="text-[#8B4A42] hover:bg-[#F5ECEA] hover:text-[#8B4A42]">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 md:px-6 py-8 animate-in fade-in duration-500">
        {children}
      </main>
    </div>
  );
};
