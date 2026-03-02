import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, User, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

/**
 * LoginPage
 * 
 * The enterprise entry point for AuditAI.
 * Supports secure Sign In and Sign Up flows with delegated manual approval.
 */
export const LoginPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(null);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Identity verified. Accessing Hub...");
        }
        setLoading(false);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(null);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
                emailRedirectTo: window.location.origin
            }
        });

        if (error) {
            toast.error(error.message);
        } else {
            setSuccess("Account request received. Please check your email to verify your identity.");
            toast.success("Request initiated.");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F3F3F2] p-4 text-[#2C2A28]">
            <div className="mb-8 flex items-center gap-3 font-bold text-3xl tracking-tight">
                <ShieldCheck className="w-10 h-10 text-[#606C5A]" />
                AuditAI
            </div>

            <Card className="w-full max-w-[450px] border-[#E6E4E0] shadow-2xl bg-[#FFFFFC]">
                <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-[#F3F3F2] rounded-t-lg p-1">
                        <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign In</TabsTrigger>
                        <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Request Access</TabsTrigger>
                    </TabsList>

                    <div className="p-6">
                        <TabsContent value="login">
                            <form onSubmit={handleSignIn} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Work Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-[#8F837A]" />
                                        <Input id="email" type="email" placeholder="name@company.com" className="pl-10 h-11 border-[#E6E4E0]" value={email} onChange={e => setEmail(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Security Key</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-[#8F837A]" />
                                        <Input id="password" type="password" className="pl-10 h-11 border-[#E6E4E0]" value={password} onChange={e => setPassword(e.target.value)} required />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full h-11 transition-all shadow-md active:scale-[0.98]" disabled={loading}>
                                    {loading ? "Authenticating..." : "Access Hub"}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup">
                            {success ? (
                                <div className="space-y-6 text-center py-4">
                                    <div className="mx-auto bg-[#ECF0E8] w-16 h-16 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-8 h-8 text-[#606C5A]" />
                                    </div>
                                    <h3 className="text-xl font-bold">Verification Sent</h3>
                                    <p className="text-[#5E5E5E] text-sm leading-relaxed">{success}</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSignUp} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-[#8F837A]" />
                                            <Input id="fullName" placeholder="Jane Doe" className="pl-10 h-11 border-[#E6E4E0]" value={fullName} onChange={e => setFullName(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-email">Company Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-[#8F837A]" />
                                            <Input id="signup-email" type="email" placeholder="jane@enterprise.com" className="pl-10 h-11 border-[#E6E4E0]" value={email} onChange={e => setEmail(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signup-password">Secure Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-[#8F837A]" />
                                            <Input id="signup-password" type="password" className="pl-10 h-11 border-[#E6E4E0]" value={password} onChange={e => setPassword(e.target.value)} required />
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full h-11 font-semibold transition-all shadow-md active:scale-[0.98]" disabled={loading}>
                                        {loading ? "Processing..." : "Submit Access Request"}
                                    </Button>
                                </form>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </Card>

            <div className="mt-8 text-center space-y-2 max-w-sm">
                <p className="text-xs text-[#8F837A] font-medium leading-relaxed">
                    Labour Code Compliance Auditor · Enterprise Edition 2.0
                </p>
                <p className="text-[10px] text-[#C0B4A8] uppercase tracking-[0.1em]">
                    Powered by Gemini 1.5 Pro & Secure Infrastructure
                </p>
            </div>
        </div>
    );
};
