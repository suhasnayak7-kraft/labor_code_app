import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Mail, Building, Briefcase, Shield, ArrowLeft, Image as ImageIcon, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

interface ProfilePageProps {
    session: any;
    profile: any;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ session, profile }) => {
    const navigate = useNavigate();

    // Branding States
    const [companyLogo, setCompanyLogo] = useState(profile?.company_logo || '');
    const [brandingEnabled, setBrandingEnabled] = useState(profile?.branding_enabled || false);
    const [isSavingBranding, setIsSavingBranding] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (profile) {
            setCompanyLogo(profile.company_logo || '');
            setBrandingEnabled(profile.branding_enabled || false);
        }
    }, [profile]);

    const saveBrandingSettings = async () => {
        if (!session?.user?.id) return;

        setIsSavingBranding(true);
        setSaveSuccess(false);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    company_logo: companyLogo,
                    branding_enabled: brandingEnabled
                })
                .eq('id', session.user.id);

            if (error) throw error;
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to save branding settings:', error);
        } finally {
            setIsSavingBranding(false);
        }
    };

    const getUserInitials = () => {
        const name = profile?.full_name || profile?.email || '';
        return name
            .split(' ')
            .slice(0, 2)
            .map((n: string) => n[0])
            .join('')
            .toUpperCase() || '?';
    };

    const planLimits: Record<string, { daily_audits: number; description: string }> = {
        'Free': {
            daily_audits: 3,
            description: 'Perfect for testing and small teams',
        },
        'Pro': {
            daily_audits: 50,
            description: 'For growing businesses',
        },
        'Enterprise': {
            daily_audits: 999,
            description: 'Unlimited audits for large organizations',
        },
    };

    const currentPlan = profile?.plan ? profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1) : 'Free';
    const planInfo = planLimits[currentPlan] || planLimits['Free'];

    return (
        <div className="space-y-8 max-w-2xl">
            {/* Back Button */}
            <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => navigate('/')}
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Compliance Hub
            </Button>

            {/* Profile Header */}
            <div className="space-y-4">
                <div className="flex items-start gap-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#606C5A] to-[#4A5747] flex items-center justify-center text-white text-2xl font-bold">
                        {getUserInitials()}
                    </div>
                    <div className="space-y-2 flex-1">
                        <h1 className="text-3xl font-bold text-[#2C2A28]">
                            {profile?.full_name || 'User Profile'}
                        </h1>
                        <p className="text-[#5E5E5E] flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {session?.user?.email}
                        </p>
                        {profile?.role === 'admin' && (
                            <Badge className="w-fit">
                                <Shield className="w-3 h-3 mr-1" />
                                Administrator
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Company Information */}
            {(profile?.company_name || profile?.company_size || profile?.industry) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="w-5 h-5" />
                            Company Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {profile?.company_name && (
                            <div>
                                <div className="text-xs font-semibold text-[#8F837A] uppercase tracking-wider mb-1">
                                    Company Name
                                </div>
                                <div className="text-lg font-medium text-[#2C2A28]">
                                    {profile.company_name}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            {profile?.company_size && (
                                <div>
                                    <div className="text-xs font-semibold text-[#8F837A] uppercase tracking-wider mb-1">
                                        Company Size
                                    </div>
                                    <div className="text-base font-medium text-[#2C2A28]">
                                        {profile.company_size}
                                    </div>
                                </div>
                            )}

                            {profile?.industry && (
                                <div>
                                    <div className="text-xs font-semibold text-[#8F837A] uppercase tracking-wider mb-1">
                                        Industry
                                    </div>
                                    <div className="text-base font-medium text-[#2C2A28]">
                                        {profile.industry}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Plan Information */}
            <Card className="bg-gradient-to-r from-[#ECF0E8] to-[#F3F3F2] border-[#E6E4E0]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        Your Plan
                    </CardTitle>
                    <CardDescription>Manage your subscription and access.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Current Plan */}
                        <div className="rounded-lg border-2 border-[#606C5A] bg-white p-4">
                            <div className="text-xs font-semibold text-[#8F837A] uppercase tracking-wider mb-2">
                                Current Plan
                            </div>
                            <div className="text-3xl font-bold text-[#2C2A28] mb-1">
                                {currentPlan}
                            </div>
                            <p className="text-sm text-[#5E5E5E]">
                                {planInfo.description}
                            </p>
                        </div>

                        {/* Daily Limits */}
                        <div className="rounded-lg border border-[#E6E4E0] bg-white p-4">
                            <div className="text-xs font-semibold text-[#8F837A] uppercase tracking-wider mb-2">
                                Daily Audits
                            </div>
                            <div className="text-3xl font-bold text-[#2C2A28] mb-1">
                                {profile?.daily_audit_limit || planInfo.daily_audits}
                            </div>
                            <p className="text-sm text-[#5E5E5E]">
                                Per 24-hour period
                            </p>
                        </div>

                        {/* Status */}
                        <div className="rounded-lg border border-[#E6E4E0] bg-white p-4">
                            <div className="text-xs font-semibold text-[#8F837A] uppercase tracking-wider mb-2">
                                Account Status
                            </div>
                            <div className="text-3xl font-bold text-[#606C5A] mb-1">
                                Active
                            </div>
                            <p className="text-sm text-[#5E5E5E]">
                                Full access enabled
                            </p>
                        </div>
                    </div>

                    {/* Plan Features */}
                    <div className="pt-4 border-t border-[#E6E4E0]">
                        <h3 className="font-semibold text-[#2C2A28] mb-3">Plan Features</h3>
                        <ul className="space-y-2 text-sm text-[#5E5E5E]">
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#606C5A]"></span>
                                Labour Code Auditor Tool
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#606C5A]"></span>
                                Audit History & Reports
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#606C5A]"></span>
                                PDF Report Downloads
                            </li>
                            {currentPlan !== 'Free' && (
                                <>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-[#606C5A]"></span>
                                        Higher Daily Limits
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-[#606C5A]"></span>
                                        Priority Support
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Custom Branding Settings (Pro & Enterprise only) */}
            {currentPlan !== 'Free' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="w-5 h-5" />
                            Custom Branding
                        </CardTitle>
                        <CardDescription>
                            Configure how your company appears on PDF audit reports.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold text-[#2C2A28]">Enable Custom Branding</Label>
                                <p className="text-sm text-[#5E5E5E]">
                                    Show your logo and company details on generated PDFs.
                                </p>
                            </div>
                            <Switch
                                checked={brandingEnabled}
                                onCheckedChange={setBrandingEnabled}
                            />
                        </div>

                        <div className="space-y-2 pt-4 border-t border-[#E6E4E0]">
                            <Label htmlFor="logo-url" className="text-sm font-semibold text-[#8F837A] uppercase tracking-wider">Company Logo URL</Label>
                            <Input
                                id="logo-url"
                                placeholder="https://example.com/logo.png"
                                value={companyLogo}
                                onChange={(e) => setCompanyLogo(e.target.value)}
                                disabled={!brandingEnabled}
                                className="w-full"
                            />
                            <p className="text-xs text-[#5E5E5E] mt-1">Provide a direct link to your company logo (PNG or JPEG format recommended).</p>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Button
                                onClick={saveBrandingSettings}
                                disabled={isSavingBranding}
                                className="bg-[#606C5A] hover:bg-[#4A5747] text-white"
                            >
                                {isSavingBranding ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Branding Settings'
                                )}
                            </Button>

                            {saveSuccess && (
                                <span className="flex items-center text-sm text-green-600">
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Saved successfully
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Upgrade Section */}
            {currentPlan === 'Free' && (
                <Card className="border-[#8B4A42] bg-[#F5ECEA]">
                    <CardHeader>
                        <CardTitle className="text-[#8B4A42]">Want Higher Limits?</CardTitle>
                        <CardDescription className="text-[#8B4A42]/80">
                            Upgrade your plan to unlock more audits and features.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-[#8B4A42]/70 mb-4">
                            Payment options and plan upgrades are coming soon. Check back later to upgrade your account.
                        </p>
                        <Button variant="outline" disabled>
                            Upgrade Plan (Coming Soon)
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Account Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs font-semibold text-[#8F837A] uppercase tracking-wider mb-1">
                                User ID
                            </div>
                            <div className="text-sm font-mono text-[#2C2A28] truncate">
                                {session?.user?.id}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-[#8F837A] uppercase tracking-wider mb-1">
                                Account Created
                            </div>
                            <div className="text-sm text-[#2C2A28]">
                                {session?.user?.created_at
                                    ? new Date(session.user.created_at).toLocaleDateString()
                                    : 'N/A'}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
