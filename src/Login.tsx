import React, { useState } from 'react';
import { supabase } from './lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Button } from './components/ui/button';
import { Loader2, LockKeyhole, Mail, Eye, EyeOff } from 'lucide-react';

type LoginView = 'login' | 'request-otp' | 'verify-otp';

const MAX_OTP_ATTEMPTS = 3;

export function Login({ onLoginSuccess }: { onLoginSuccess: () => void }) {
    const [view, setView] = useState<LoginView>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [otpAttempts, setOtpAttempts] = useState(0);

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Visibility states
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
        } else {
            onLoginSuccess();
            setLoading(false);
        }
    };

    const handleRequestOtp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        if (otpAttempts >= MAX_OTP_ATTEMPTS) {
            setError(`You have reached the maximum of ${MAX_OTP_ATTEMPTS} OTP requests permitted on this plan.`);
            setLoading(false);
            return;
        }

        // Send OTP
        const { error: otpError } = await supabase.auth.resetPasswordForEmail(email);

        if (otpError) {
            setError(otpError.message);
        } else {
            const newAttempts = otpAttempts + 1;
            setOtpAttempts(newAttempts);
            setSuccessMessage(`If an account exists, a 6-digit unique ID has been sent to your email. (Attempt ${newAttempts}/${MAX_OTP_ATTEMPTS})`);
            setView('verify-otp');
        }
        setLoading(false);
    };

    const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            setLoading(false);
            return;
        }

        // 1. Verify OTP
        const { error: verifyError } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'recovery'
        });

        if (verifyError) {
            setError(verifyError.message);
            setLoading(false);
            return;
        }

        // 2. Update Password
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (updateError) {
            setError(updateError.message);
            setLoading(false);
            return;
        }

        // 3. Success
        onLoginSuccess();
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md border-zinc-200 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-700 to-zinc-900" />
                <CardHeader className="space-y-3 pb-6 text-center">
                    <div className="mx-auto bg-zinc-100 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                        {view === 'login' ? <LockKeyhole className="text-zinc-900 w-6 h-6" /> : <Mail className="text-zinc-900 w-6 h-6" />}
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {view === 'login' ? 'Sign In' : view === 'request-otp' ? 'Setup / Reset' : 'Verify Unique ID'}
                    </CardTitle>
                    <CardDescription className="text-zinc-500">
                        {view === 'login' && 'Enter your credentials to access the Labour Code Auditor.'}
                        {view === 'request-otp' && 'Enter your work email to receive a secure setup link.'}
                        {view === 'verify-otp' && `Enter the 6-digit code sent to ${email} to set your new password.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* LOGIN VIEW */}
                    {view === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Work Email</Label>
                                <Input id="email" type="email" required placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input id="password" type={showLoginPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="pr-10" />
                                    <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600">
                                        {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md text-center">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800 text-white" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Secure Log In"}
                            </Button>

                            <div className="text-center mt-4 pt-4 border-t border-zinc-100">
                                <button type="button" onClick={() => { setView('request-otp'); setError(null); }} className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                                    First Time Setup / Forgot Password?
                                </button>
                            </div>
                        </form>
                    )}

                    {/* REQUEST OTP VIEW */}
                    {view === 'request-otp' && (
                        <form onSubmit={handleRequestOtp} className="space-y-4">
                            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-md">
                                <strong>Note:</strong> You currently have {MAX_OTP_ATTEMPTS - otpAttempts} attempts to send an OTP to your email (limit adjusts based on active Supabase tier).
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reset-email">Work Email</Label>
                                <Input id="reset-email" type="email" required placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md text-center">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800 text-white" disabled={loading || otpAttempts >= MAX_OTP_ATTEMPTS}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Unique ID"}
                            </Button>

                            <div className="text-center mt-4 pt-2">
                                <button type="button" onClick={() => { setView('login'); setError(null); }} className="text-sm text-zinc-500 hover:text-zinc-900">
                                    ← Back to Login
                                </button>
                            </div>
                        </form>
                    )}

                    {/* VERIFY OTP VIEW */}
                    {view === 'verify-otp' && (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            {successMessage && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-md text-center mb-4">
                                    {successMessage}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="otp">Unique 6-Digit ID</Label>
                                <Input id="otp" type="text" required placeholder="123456" className="font-mono text-center tracking-widest text-lg" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
                            </div>
                            <div className="space-y-2 pt-2 border-t border-zinc-100">
                                <Label htmlFor="new-password">New Password</Label>
                                <div className="relative">
                                    <Input id="new-password" type={showNewPassword ? "text" : "password"} required placeholder="Min. 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="pr-10" />
                                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600">
                                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <div className="relative">
                                    <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="pr-10" />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600">
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md text-center">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading || otp.length < 6}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Set Password & Log In"}
                            </Button>

                            <div className="text-center mt-4">
                                <button type="button" onClick={() => { setView('request-otp'); setError(null); }} className="text-sm text-zinc-500 hover:text-zinc-900">
                                    Didn't receive the code? Try again
                                </button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
