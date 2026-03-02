import React from 'react';
import { ShieldCheck, Clock, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

/**
 * OnboardingPage
 * 
 * The landing page for authenticated but unapproved users.
 * This acts as a security gate, preventing access to core features until an admin verifies the account.
 */
export const OnboardingPage: React.FC = () => {
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F3F3F2] p-4 text-[#2C2A28]">
            <Card className="max-w-md w-full border-[#E6E4E0] shadow-xl bg-[#FFFFFC]">
                <CardContent className="pt-10 pb-8 text-center space-y-6">
                    <div className="mx-auto bg-[#ECF0E8] w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-300">
                        <Clock className="w-10 h-10 text-[#606C5A] animate-pulse" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight">Approval Pending</h1>
                        <p className="text-[#8F837A] leading-relaxed">
                            Hello, <span className="font-semibold text-[#2C2A28]">{profile?.full_name || 'User'}</span>.
                            Your account is currently in the <strong>AuditAI Approval Queue</strong>.
                        </p>
                    </div>

                    <div className="bg-[#F8F7F4] p-4 rounded-lg border border-[#E6E4E0] text-sm text-[#5E5E5E] text-left">
                        <p className="flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-[#606C5A] mt-0.5" />
                            <span>To ensure the highest compliance standards, every new account is manually vetted by our security team.</span>
                        </p>
                    </div>

                    <p className="text-sm text-[#C0B4A8]">
                        You will be granted access to the Compliance Hub once your request is reviewed.
                        This usually takes 12-24 hours.
                    </p>

                    <div className="pt-4 flex flex-col gap-3">
                        <Button
                            variant="outline"
                            onClick={() => window.location.reload()}
                            className="w-full border-[#E6E4E0] hover:bg-zinc-100"
                        >
                            Check Status
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleSignOut}
                            className="w-full text-[#8B4A42] hover:bg-[#F5ECEA] hover:text-[#8B4A42]"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="fixed bottom-8 text-[11px] text-[#C0B4A8] font-medium tracking-widest uppercase">
                AuditAI Enterprise Security · Version 2025.1
            </div>
        </div>
    );
};
