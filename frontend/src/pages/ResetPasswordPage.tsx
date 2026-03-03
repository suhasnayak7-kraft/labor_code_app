import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const ResetPasswordPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Handle Hash fragments from supabase magic link
        supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                // we are securely allowed to change the password
                console.log("Password recovery mode active");
            }
        });
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            toast.error(error.message || "Failed to update password");
        } else {
            setSuccess(true);
            toast.success("Password updated successfully");
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F3F3F2] p-4 text-[#2C2A28]">
            <div className="mb-8 flex items-center gap-3 font-bold text-3xl tracking-tight">
                <ShieldCheck className="w-10 h-10 text-[#606C5A]" />
                AuditAI Password Reset
            </div>

            <Card className="w-full max-w-[450px] border-[#E6E4E0] shadow-2xl bg-[#FFFFFC] p-6">
                {success ? (
                    <div className="space-y-6 text-center py-4">
                        <div className="mx-auto bg-[#ECF0E8] w-16 h-16 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-[#606C5A]" />
                        </div>
                        <h3 className="text-xl font-bold">Password Reset Successful</h3>
                        <p className="text-[#5E5E5E] text-sm leading-relaxed">You can now access the hub with your new secure password.</p>
                        <Button className="w-full h-11 bg-[#606C5A] hover:bg-[#4E5A48] text-white" onClick={() => navigate('/login')}>Return to Sign In</Button>
                    </div>
                ) : (
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Enter New Secure Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-[#8F837A]" />
                                <Input id="password" type="password" className="pl-10 h-11 border-[#E6E4E0]" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} autoFocus />
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-11 font-semibold transition-all shadow-md active:scale-[0.98] bg-[#606C5A] hover:bg-[#4E5A48] text-white" disabled={loading}>
                            {loading ? "Updating..." : "Update Password"}
                        </Button>
                    </form>
                )}
            </Card>
        </div>
    );
};
