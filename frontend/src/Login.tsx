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
            setError(`Maximum attempts (${MAX_OTP_ATTEMPTS}) reached for this plan.`);
            setLoading(false);
            return;
        }

        const { error: otpError } = await supabase.auth.resetPasswordForEmail(email);

        if (otpError) {
            setError(otpError.message);
        } else {
            const newAttempts = otpAttempts + 1;
            setOtpAttempts(newAttempts);
            setSuccessMessage(`If an account exists, a unique ID has been sent to your email.`);
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

        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (updateError) {
            setError(updateError.message);
            setLoading(false);
            return;
        }

        onLoginSuccess();
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-[85vh] py-12 px-4">
            <Card className="w-full max-w-md border-border shadow-md transition-shadow duration-150">
                <CardHeader className="space-y-4 pt-10 pb-6 text-center">
                    <div className="mx-auto flex items-center justify-center text-primary mb-2">
                        {view === 'login' ? <LockKeyhole size={28} strokeWidth={1.5} /> : <Mail size={28} strokeWidth={1.5} />}
                    </div>
                    <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
                        {view === 'login' ? 'Sign In' : view === 'request-otp' ? 'Setup / Reset' : 'Verify Identity'}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground font-normal">
                        {view === 'login' && 'Enter your credentials to access the Labour Code Auditor.'}
                        {view === 'request-otp' && 'Enter your work email to receive a secure setup link.'}
                        {view === 'verify-otp' && `Enter the code sent to ${email} to continue.`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-8">
                    {/* LOGIN VIEW */}
                    {view === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">Work Email</Label>
                                <Input id="email" type="email" required placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} className="bg-background border-input focus:border-primary transition-colors" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">Password</Label>
                                <div className="relative">
                                    <Input id="password" type={showLoginPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="pr-10 bg-background border-input focus:border-primary transition-colors" />
                                    <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors">
                                        {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-sm text-center">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6" disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Secure Log In"}
                            </Button>

                            <div className="text-center mt-6 pt-4 border-t border-border/50">
                                <button type="button" onClick={() => { setView('request-otp'); setError(null); }} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                                    First Time Setup / Forgot Password?
                                </button>
                            </div>
                        </form>
                    )}

                    {/* REQUEST OTP VIEW */}
                    {view === 'request-otp' && (
                        <form onSubmit={handleRequestOtp} className="space-y-5">
                            <div className="p-3 bg-secondary border border-border text-muted-foreground text-[11px] rounded-sm leading-relaxed">
                                <strong>Note:</strong> Limited attempts per hour based on system security tier.
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reset-email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">Work Email</Label>
                                <Input id="reset-email" type="email" required placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} className="bg-background border-input focus:border-primary transition-colors" />
                            </div>

                            {error && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-sm text-center">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6" disabled={loading || otpAttempts >= MAX_OTP_ATTEMPTS}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Unique ID"}
                            </Button>

                            <div className="text-center mt-4">
                                <button type="button" onClick={() => { setView('login'); setError(null); }} className="text-sm text-muted-foreground hover:text-foreground transition-all">
                                    ← Back to Login
                                </button>
                            </div>
                        </form>
                    )}

                    {/* VERIFY OTP VIEW */}
                    {view === 'verify-otp' && (
                        <form onSubmit={handleVerifyOtp} className="space-y-5">
                            {successMessage && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] rounded-sm text-center mb-4">
                                    {successMessage}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="otp" className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">Verification Code</Label>
                                <Input id="otp" type="text" required placeholder="••••••" className="font-mono text-center tracking-[0.5em] text-lg bg-background border-input focus:border-primary transition-colors" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
                            </div>
                            <div className="space-y-2 pt-4 border-t border-border/50">
                                <Label htmlFor="new-password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">New Password</Label>
                                <div className="relative">
                                    <Input id="new-password" type={showNewPassword ? "text" : "password"} required placeholder="Min. 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="pr-10 bg-background border-input focus:border-primary transition-colors" />
                                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors">
                                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">Confirm Password</Label>
                                <div className="relative">
                                    <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="pr-10 bg-background border-input focus:border-primary transition-colors" />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors">
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-sm text-center">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6" disabled={loading || otp.length < 6}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set Password & Log In"}
                            </Button>

                            <div className="text-center mt-4">
                                <button type="button" onClick={() => { setView('request-otp'); setError(null); }} className="text-sm text-muted-foreground hover:text-foreground transition-all">
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
