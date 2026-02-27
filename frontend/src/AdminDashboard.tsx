import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Switch } from './components/ui/switch';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./components/ui/alert-dialog";
import { Shield, Lock, Unlock, Mail, Loader2, UserX, UserCheck, Activity, KeyRound, Save, Eye, EyeOff, BarChart3, Zap, Clock, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Progress } from './components/ui/progress';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '/api');

interface Profile {
    id: string;
    full_name: string;
    email: string;
    company_name: string;
    company_size?: string;
    industry: string;
    is_locked: boolean;
    is_deleted: boolean;
    daily_audit_limit: number;
    role: string;
    admin_password_ref?: string;
    total_tokens_used?: number;
    total_audits_done?: number;
}

interface AuditLog {
    id: string;
    user_id: string;
    model_id: string;
    provider: string;
    response_time_ms: number;
    total_tokens: number;
    created_at: string;
    filename: string;
}

interface ModelHealth {
    model_id: string;
    provider: string;
    rpm: number;
    tpm: number;
    isActive: boolean;
    rpmLimit: number;
    tpmLimit: number;
}

interface WaitingListEntry {
    id: string;
    full_name: string;
    email: string;
    company_name: string;
    company_size: string;
    industry: string;
    status: string;
    created_at: string;
}

export function AdminDashboard({ session, adminProfile }: { session: any, adminProfile: any }) {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [healthData, setHealthData] = useState<ModelHealth[]>([
        { model_id: 'gemini-1.5-flash', provider: 'google', rpm: 0, tpm: 0, rpmLimit: 15, tpmLimit: 1000000, isActive: true },
        { model_id: 'claude-3-5-sonnet', provider: 'anthropic', rpm: 0, tpm: 0, rpmLimit: 5, tpmLimit: 40000, isActive: false },
        { model_id: 'gpt-4o', provider: 'openai', rpm: 0, tpm: 0, rpmLimit: 3, tpmLimit: 30000, isActive: false }
    ]);

    // Modal States
    const [selectedWaitlistEntry, setSelectedWaitlistEntry] = useState<WaitingListEntry | null>(null);
    const [provisionPassword, setProvisionPassword] = useState("");
    const [isProvisioning, setIsProvisioning] = useState(false);

    // Approval Dialog Open State
    const [isApproveOpen, setIsApproveOpen] = useState(false);

    // Edit Profile/Limit Dialog
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
    const [newLimit, setNewLimit] = useState<number>(0);
    const [resetPassword, setResetPassword] = useState<string>("");
    const [oldPassword, setOldPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showProvisionPassword, setShowProvisionPassword] = useState(false);
    const [isEditLimitOpen, setIsEditLimitOpen] = useState(false);

    // Generate a random 8-char alphanumeric password
    const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    const fetchData = async () => {
        setLoading(true);
        // Fetch Profiles
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        // Fetch Audit Logs for health & consumption
        const { data: logData, error: logError } = await supabase
            .from('api_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (profileError) {
            console.error("Error fetching profiles:", profileError);
            toast.error("Failed to load user profiles.");
        }

        if (logError) {
            console.error("Error fetching logs:", logError);
        } else if (logData) {
            setAuditLogs(logData);

            // Calculate consumption for each profile
            if (profileData) {
                const updatedProfiles = profileData.map(p => {
                    const userLogs = logData.filter(l => l.user_id === p.id);
                    const totalTokens = userLogs.reduce((sum, l) => sum + (l.total_tokens || 0), 0);
                    return {
                        ...p,
                        total_tokens_used: totalTokens,
                        total_audits_done: userLogs.length
                    };
                });
                setProfiles(updatedProfiles);
            }

            // Calculate Model Health (Health metrics for current minute)
            const now = new Date();
            const oneMinAgo = new Date(now.getTime() - 60000);
            const recentLogs = logData.filter(l => new Date(l.created_at) > oneMinAgo);

            setHealthData(prev => prev.map(m => {
                const modelLogs = recentLogs.filter(l => l.model_id === m.model_id || (m.model_id === 'gpt-4o' && l.model_id === 'gpt-4o'));
                const rpm = modelLogs.length;
                const tpm = modelLogs.reduce((sum, l) => sum + (l.total_tokens || 0), 0);

                // Simulate Active status - in real app would check environment markers
                return { ...m, rpm, tpm };
            }));
        } else if (profileData) {
            setProfiles(profileData);
        }

        // Fetch Waiting List
        const { data: waitingData, error: waitingError } = await supabase
            .from('waiting_list')
            .select('*')
            .order('created_at', { ascending: false });

        if (waitingError) {
            console.error("Error fetching waiting list:", waitingError);
            toast.error("Failed to load access requests.");
        } else if (waitingData) {
            setWaitingList(waitingData);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const updateLimit = async (profileId: string, newLimit: number) => {
        const { error } = await supabase
            .from('profiles')
            .update({ daily_audit_limit: newLimit })
            .eq('id', profileId);

        if (error) {
            toast.error("Failed to update limit");
        } else {
            setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, daily_audit_limit: newLimit } : p));
            toast.success("Limit updated successfully");
        }
    };

    const UserExpansion = ({ profile }: { profile: Profile }) => {
        const userLogs = auditLogs.filter(l => l.user_id === profile.id);
        const modelData = [
            { name: 'Gemini', value: userLogs.filter(l => l.model_id.includes('gemini')).length },
            { name: 'Claude', value: userLogs.filter(l => l.model_id.includes('claude')).length },
            { name: 'GPT', value: userLogs.filter(l => l.model_id.includes('gpt')).length },
        ].filter(d => d.value > 0);

        const COLORS = ['#10b981', '#8b5cf6', '#3b82f6'];

        return (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-zinc-50/50 p-4 border-t border-zinc-100"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Model Preferences</h4>
                        {modelData.length > 0 ? (
                            <div className="h-[150px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={modelData}
                                            innerRadius={40}
                                            outerRadius={60}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {modelData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[150px] flex items-center justify-center text-xs text-zinc-400 italic">No audit history recorded</div>
                        )}
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Infrastructure Controls</h4>
                        <div className="p-4 bg-white rounded-lg border border-zinc-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-zinc-700">Daily Audit Quota</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        defaultValue={profile.daily_audit_limit}
                                        onBlur={(e) => updateLimit(profile.id, parseInt(e.target.value))}
                                        className="w-16 h-8 text-xs border rounded px-2 focus:ring-1 focus:ring-emerald-500 outline-none"
                                    />
                                    <span className="text-[10px] text-zinc-400">audits</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between opacity-50 pointer-events-none">
                                <span className="text-xs font-medium text-zinc-700">Token Ceiling</span>
                                <Badge variant="outline" className="text-[10px]">Unlimited</Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    const toggleLock = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('profiles')
            .update({ is_locked: !currentStatus })
            .eq('id', id);

        if (!error) {
            setProfiles(profiles.map(p => p.id === id ? { ...p, is_locked: !currentStatus } : p));
            toast.success(`Account ${!currentStatus ? 'locked' : 'unlocked'}.`);
        } else {
            toast.error("Failed to update lock status.");
        }
    };

    const handleApproveCreation = async () => {
        if (!selectedWaitlistEntry || !provisionPassword || provisionPassword.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }

        setIsProvisioning(true);
        try {
            const res = await fetch(`${API_URL}/admin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    email: selectedWaitlistEntry.email,
                    password: provisionPassword,
                    role: "user",
                    daily_audit_limit: 1, // Default limit
                    full_name: selectedWaitlistEntry.full_name,
                    company_name: selectedWaitlistEntry.company_name,
                    company_size: selectedWaitlistEntry.company_size,
                    industry: selectedWaitlistEntry.industry
                })
            });

            const data = await res.json();

            // Helper to mark the waitlist entry as approved and close the dialog
            const approveAndClose = async () => {
                const { error: updateError } = await supabase
                    .from('waiting_list')
                    .update({ status: 'approved' })
                    .eq('id', selectedWaitlistEntry.id);

                if (updateError) {
                    console.error("Waitlist update error:", updateError);
                    toast.error("Status update failed. Ensure RLS fixes are applied!");
                } else {
                    setWaitingList(prev => prev.map(w => w.id === selectedWaitlistEntry.id ? { ...w, status: 'approved' } : w));
                }
                setProvisionPassword("");
                setIsApproveOpen(false);
                setSelectedWaitlistEntry(null);
            };

            if (res.ok) {
                toast.success(`User ${selectedWaitlistEntry.email} successfully provisioned!`);
                // Save password ref for admin reference in future Edit Profile
                await supabase.from('profiles').update({ admin_password_ref: provisionPassword }).eq('email', selectedWaitlistEntry.email);
                await approveAndClose();
            } else {
                const errorMessage = data.detail || "";
                // If the user already exists in auth, still approve and close – they're already set up.
                const alreadyExists = errorMessage.toLowerCase().includes("already been registered") ||
                    errorMessage.toLowerCase().includes("already registered") ||
                    errorMessage.toLowerCase().includes("already exists");
                if (alreadyExists) {
                    toast.success(`${selectedWaitlistEntry.email} is already registered. Marked as approved!`);
                    await approveAndClose();
                } else {
                    toast.error(errorMessage || "Failed to provision user.");
                }
            }
        } catch (error) {
            toast.error("Error connecting to backend API.");
        }
        setIsProvisioning(false);
    };

    const updateWaitlistStatus = async (id: string, status: string) => {
        const { error } = await supabase
            .from('waiting_list')
            .update({ status })
            .eq('id', id);

        if (!error) {
            setWaitingList(prev => prev.map(w => w.id === id ? { ...w, status } : w));
            toast.success(`Request marked as ${status}.`);
        } else {
            console.error("Status update error:", error);
            toast.error(`Failed to update status to ${status}. Ensure RLS fixes are applied.`);
        }
    };

    const handleSaveLimit = async () => {
        if (!editingProfile) return;
        if (newLimit < 0) {
            toast.error("Limit cannot be negative.");
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .update({ daily_audit_limit: newLimit })
            .eq('id', editingProfile.id);

        if (!error) {
            setProfiles(profiles.map(p => p.id === editingProfile.id ? { ...p, daily_audit_limit: newLimit } : p));
            toast.success("Audit limit updated.");

            // Handle Password Change if entered
            if (resetPassword && resetPassword.length >= 6) {
                try {
                    const res = await fetch(`${API_URL}/admin/users/${editingProfile.id}/password`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({ new_password: resetPassword })
                    });
                    if (res.ok) {
                        toast.success("User password has been reset.");
                        // Store password ref in profile for admin reference
                        await supabase.from('profiles').update({ admin_password_ref: resetPassword }).eq('id', editingProfile.id);
                        setProfiles(prev => prev.map(p => p.id === editingProfile.id ? { ...p, admin_password_ref: resetPassword } : p));
                    } else {
                        const data = await res.json();
                        toast.error(data.detail || "Failed to reset password.");
                    }
                } catch (e) {
                    toast.error("Error communicating with backend regarding password.");
                }
            }

            setIsEditLimitOpen(false);
            setResetPassword("");
            setOldPassword("");
        } else {
            toast.error("Failed to update limit.");
        }
    };

    const softDeleteUser = async (id: string) => {
        // Technically, you might also want to disable their auth account, but for alpha, soft delete prevents access via our API.
        const { error } = await supabase
            .from('profiles')
            .update({ is_deleted: true, is_locked: true })
            .eq('id', id);

        if (!error) {
            setProfiles(profiles.map(p => p.id === id ? { ...p, is_deleted: true, is_locked: true } : p));
            toast.success("User account moved to archive.");
        } else {
            toast.error("Failed to delete user.");
        }
    };

    const liveProfiles = profiles.filter(p => !p.is_deleted);
    const deletedProfiles = profiles.filter(p => p.is_deleted);
    const pendingRequests = waitingList.filter(w => w.status === 'pending');
    const rejectedRequests = waitingList.filter(w => w.status === 'rejected');

    if (loading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-zinc-400" size={32} /></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-12">

            {/* Persistent Admin Header */}
            <div className="bg-zinc-900 rounded-xl p-6 text-white shadow-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-500/20 p-3 rounded-full border border-emerald-500/30">
                        <Shield className="text-emerald-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Governance Console</h1>
                        <p className="text-zinc-400 flex items-center gap-2 text-sm mt-1">
                            Logged in as <span className="text-zinc-200 font-medium">{adminProfile?.full_name || session?.user?.email}</span>
                            <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700">Administrator</Badge>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-400 hover:text-white hover:bg-zinc-800 gap-2 h-9 px-3"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} className="text-emerald-400" />}
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="requests" className="w-full">
                <TabsList className="grid w-full max-w-2xl grid-cols-5 mb-8">
                    <TabsTrigger value="health" className="flex items-center gap-2">
                        <Activity size={14} /> System Health
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="relative">
                        Access Requests
                        {pendingRequests.length > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-blue-500"></span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="live">Approved & Live</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                    <TabsTrigger value="deleted">Archive</TabsTrigger>
                </TabsList>

                {/* TAB 0: SYSTEM HEALTH (CONTROL TOWER) */}
                <TabsContent value="health" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {healthData.map((model, idx) => {
                            const rpmProgress = (model.rpm / model.rpmLimit) * 100;
                            const tpmProgress = (model.tpm / model.tpmLimit) * 100;
                            const isCritical = rpmProgress > 80 || tpmProgress > 80;
                            const isExhausted = rpmProgress >= 100 || tpmProgress >= 100;

                            return (
                                <motion.div
                                    key={model.model_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <Card className="border-zinc-200 shadow-sm overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
                                        <div className={`h-1 w-full ${isExhausted ? 'bg-red-500' : isCritical ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    {model.provider === 'anthropic' ? <Zap size={18} className="text-purple-500" /> :
                                                        model.provider === 'openai' ? <Globe size={18} className="text-zinc-600" /> :
                                                            <Zap size={18} className="text-blue-500" />}
                                                    {model.model_id}
                                                </CardTitle>
                                                <Badge variant={model.isActive || model.rpm > 0 ? "default" : "secondary"} className={model.isActive || model.rpm > 0 ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" : ""}>
                                                    {model.isActive || model.rpm > 0 ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                            <CardDescription className="font-mono text-[10px] uppercase tracking-wider">{model.provider} INFRASTRUCTURE</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-medium">
                                                    <span className="text-zinc-500 flex items-center gap-1"><Activity size={12} /> Requests (RPM)</span>
                                                    <span className={isExhausted ? 'text-red-600' : isCritical ? 'text-amber-600' : 'text-zinc-900'}>{model.rpm} / {model.rpmLimit}</span>
                                                </div>
                                                <Progress value={rpmProgress} className="h-1.5 bg-zinc-100" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-medium">
                                                    <span className="text-zinc-500 flex items-center gap-1"><Zap size={12} /> Tokens (TPM)</span>
                                                    <span className={isExhausted ? 'text-red-600' : isCritical ? 'text-amber-600' : 'text-zinc-900'}>{model.tpm.toLocaleString()} / {model.tpmLimit.toLocaleString()}</span>
                                                </div>
                                                <Progress value={tpmProgress} className="h-1.5 bg-zinc-100" />
                                            </div>
                                            <div className="pt-2 flex items-center justify-between text-[10px] text-zinc-400 font-medium bg-zinc-50 -mx-6 -mb-6 px-6 py-3 border-t">
                                                <span className="flex items-center gap-1"><Clock size={10} /> Resets in 42s</span>
                                                <span className="uppercase">{model.provider} API KEY DETECTED</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Global Activity Preview */}
                    <Card className="border-zinc-200 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 size={16} /> Global Audit Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'Gemini', count: auditLogs.filter(l => l.provider === 'google').length },
                                    { name: 'Claude', count: auditLogs.filter(l => l.provider === 'anthropic').length },
                                    { name: 'GPT', count: auditLogs.filter(l => l.provider === 'openai').length },
                                ]}>
                                    <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} />
                                    <YAxis fontSize={12} axisLine={false} tickLine={false} hide />
                                    <RechartsTooltip />
                                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 1: ACCESS REQUESTS */}
                <TabsContent value="requests" className="space-y-4">
                    <Card className="border-zinc-200 shadow-sm border-t-4 border-t-blue-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Mail size={18} /> Pending Invitations</CardTitle>
                            <CardDescription>Review new organizations requesting access to the Auditor. Approving them will provision a new Auth account.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader className="bg-zinc-50/50">
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingRequests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24 text-zinc-500">No pending invitations.</TableCell>
                                        </TableRow>
                                    ) : (
                                        pendingRequests.map(req => (
                                            <TableRow key={req.id}>
                                                <TableCell className="font-medium">{req.full_name}</TableCell>
                                                <TableCell className="text-sm font-mono">{req.email}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-sm">{req.company_name}</div>
                                                    <div className="text-xs text-zinc-500">{req.industry} • {req.company_size}</div>
                                                </TableCell>
                                                <TableCell className="text-xs text-zinc-500">{new Date(req.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    {req.status === 'pending' && (
                                                        <div className="flex justify-end gap-2">
                                                            <Dialog open={isApproveOpen && selectedWaitlistEntry?.id === req.id} onOpenChange={(open) => {
                                                                if (open) {
                                                                    setSelectedWaitlistEntry(req);
                                                                    setProvisionPassword(generatePassword());
                                                                    setShowProvisionPassword(false);
                                                                }
                                                                setIsApproveOpen(open);
                                                            }}>
                                                                <DialogTrigger asChild>
                                                                    <Button size="sm" variant="outline" className="border-blue-200 hover:bg-blue-50 hover:text-blue-700">Approve</Button>
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle>Provision User Account</DialogTitle>
                                                                        <DialogDescription>
                                                                            You are approving <strong>{req.company_name}</strong>. Create an initial password for them. The default daily audit limit will be set to 1.
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <div className="grid gap-4 py-4">
                                                                        <div className="grid gap-2">
                                                                            <label className="text-sm font-medium">Email Address</label>
                                                                            <Input value={req.email} disabled className="bg-zinc-50" />
                                                                        </div>
                                                                        <div className="grid gap-2">
                                                                            <div className="flex items-center justify-between">
                                                                                <label className="text-sm font-medium">Initial Password</label>
                                                                                <button type="button" onClick={() => setProvisionPassword(generatePassword())} className="text-xs text-blue-600 hover:underline">↻ Regenerate</button>
                                                                            </div>
                                                                            <div className="relative">
                                                                                <KeyRound className="absolute top-2.5 left-2.5 h-4 w-4 text-zinc-500" />
                                                                                <Input
                                                                                    type={showProvisionPassword ? "text" : "password"}
                                                                                    placeholder="Enter a secure password..."
                                                                                    className="pl-9 pr-9"
                                                                                    value={provisionPassword}
                                                                                    onChange={(e) => setProvisionPassword(e.target.value)}
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setShowProvisionPassword(p => !p)}
                                                                                    className="absolute top-2.5 right-2.5 text-zinc-400 hover:text-zinc-700"
                                                                                >
                                                                                    {showProvisionPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                                                </button>
                                                                            </div>
                                                                            <p className="text-xs text-zinc-500">Auto-generated. Share this with the user securely.</p>
                                                                        </div>
                                                                    </div>
                                                                    <DialogFooter>
                                                                        <Button variant="outline" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
                                                                        <Button onClick={handleApproveCreation} disabled={isProvisioning}>
                                                                            {isProvisioning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                                                            Create Account
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>

                                                            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => updateWaitlistStatus(req.id, 'rejected')}>Reject</Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: APPROVED & LIVE */}
                <TabsContent value="live" className="space-y-4">
                    <Card className="border-zinc-200 shadow-sm border-t-4 border-t-emerald-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><UserCheck size={18} /> Active Organizations</CardTitle>
                            <CardDescription>Manage daily quotas, suspend access, or archive users.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader className="bg-zinc-50/50">
                                    <TableRow>
                                        <TableHead>User / Role</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Company & Industry</TableHead>
                                        <TableHead className="text-center">Rate Limit</TableHead>
                                        <TableHead className="text-center">Consumption</TableHead>
                                        <TableHead className="w-[140px]">Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {liveProfiles.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center h-24 text-zinc-500">No active users found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        <AnimatePresence>
                                            {liveProfiles.map((profile) => (
                                                <React.Fragment key={profile.id}>
                                                    <TableRow
                                                        className={`group cursor-pointer transition-colors ${profile.is_locked ? "bg-amber-50/30" : "hover:bg-zinc-50/50"}`}
                                                        onClick={() => setExpandedUser(expandedUser === profile.id ? null : profile.id)}
                                                    >
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
                                                                    {profile.full_name?.charAt(0) || 'U'}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-semibold text-zinc-900">{profile.full_name || 'N/A'}</span>
                                                                        {profile.role === 'admin' && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] h-4">Admin</Badge>}
                                                                    </div>
                                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{profile.role}</div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-sm font-mono text-zinc-500">{profile.email || 'N/A'}</TableCell>
                                                        <TableCell>
                                                            <div className="text-sm font-medium text-zinc-900">{profile.company_name || 'Unknown Co.'}</div>
                                                            <div className="text-xs text-zinc-500">{profile.industry || 'Unknown'} {profile.company_size && `• ${profile.company_size}`}</div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <Badge variant="secondary" className="font-mono text-xs px-2 py-0">{profile.daily_audit_limit} audits/day</Badge>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="text-xs font-medium text-zinc-900">{(profile.total_tokens_used || 0).toLocaleString()} tokens</span>
                                                                <span className="text-[10px] text-zinc-500 uppercase">{profile.total_audits_done || 0} audits total</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex items-center space-x-2">
                                                                <Switch
                                                                    checked={!profile.is_locked}
                                                                    onCheckedChange={() => toggleLock(profile.id, profile.is_locked)}
                                                                    className={!profile.is_locked ? 'bg-emerald-500' : 'bg-amber-500'}
                                                                    disabled={profile.role === 'admin'}
                                                                />
                                                                <span className="text-xs font-medium text-zinc-500 w-16">
                                                                    {profile.is_locked ? <span className="text-amber-600 flex items-center gap-1"><Lock size={12} /> Blocked</span> : <span className="text-emerald-600 flex items-center gap-1"><Unlock size={12} /> Active</span>}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex justify-end gap-2 text-zinc-500">
                                                                <Dialog open={isEditLimitOpen && editingProfile?.id === profile.id} onOpenChange={(open) => {
                                                                    if (open) {
                                                                        setEditingProfile(profile);
                                                                        setNewLimit(profile.daily_audit_limit);
                                                                        setOldPassword(profile.admin_password_ref || '');
                                                                        setResetPassword('');
                                                                        setShowOldPassword(false);
                                                                        setShowPassword(false);
                                                                    }
                                                                    setIsEditLimitOpen(open);
                                                                }}>
                                                                    <DialogTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-emerald-600">
                                                                            <Save size={16} />
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="sm:max-w-md">
                                                                        <DialogHeader>
                                                                            <DialogTitle>Update {profile.full_name || profile.company_name}</DialogTitle>
                                                                            <DialogDescription>Modify the daily audit limit or reset their password.</DialogDescription>
                                                                        </DialogHeader>
                                                                        <div className="py-4 space-y-6">
                                                                            <div className="space-y-3">
                                                                                <label className="text-sm font-medium">Daily Audit Quota</label>
                                                                                <div className="flex items-center gap-3">
                                                                                    <Button variant="outline" size="icon" onClick={() => setNewLimit(Math.max(0, newLimit - 1))}>-</Button>
                                                                                    <Input type="number" value={newLimit} onChange={(e) => setNewLimit(parseInt(e.target.value) || 0)} className="w-20 text-center font-mono" />
                                                                                    <Button variant="outline" size="icon" onClick={() => setNewLimit(newLimit + 1)}>+</Button>
                                                                                </div>
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                <label className="text-sm font-medium">Old Password <span className="text-zinc-400 font-normal">(for reference)</span></label>
                                                                                <div className="relative">
                                                                                    <KeyRound className="absolute top-2.5 left-2.5 h-4 w-4 text-zinc-500" />
                                                                                    <Input
                                                                                        type={showOldPassword ? "text" : "password"}
                                                                                        placeholder="Current password..."
                                                                                        value={oldPassword}
                                                                                        onChange={(e) => setOldPassword(e.target.value)}
                                                                                        className="pl-9 pr-9"
                                                                                    />
                                                                                    <button type="button" onClick={() => setShowOldPassword(p => !p)} className="absolute top-2.5 right-2.5 text-zinc-400 hover:text-zinc-700">
                                                                                        {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                                                                <div className="flex-1 h-px bg-zinc-200" />
                                                                                <span>↓ New Password</span>
                                                                                <div className="flex-1 h-px bg-zinc-200" />
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                <label className="text-sm font-medium">New Password <span className="text-zinc-400 font-normal">(Leave blank to keep current)</span></label>
                                                                                <div className="relative">
                                                                                    <KeyRound className="absolute top-2.5 left-2.5 h-4 w-4 text-zinc-500" />
                                                                                    <Input
                                                                                        type={showPassword ? "text" : "password"}
                                                                                        placeholder="New secure password..."
                                                                                        value={resetPassword}
                                                                                        onChange={(e) => setResetPassword(e.target.value)}
                                                                                        className="pl-9 pr-9"
                                                                                    />
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => setShowPassword(p => !p)}
                                                                                        className="absolute top-2.5 right-2.5 text-zinc-400 hover:text-zinc-700"
                                                                                    >
                                                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <DialogFooter className="sm:justify-between">
                                                                            <Button variant="ghost" className="text-zinc-500" onClick={() => { setIsEditLimitOpen(false); setResetPassword(""); }}>Cancel</Button>
                                                                            <Button onClick={handleSaveLimit}>Save Changes</Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>
                                                                {profile.role !== 'admin' && (
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600"><UserX size={16} /></Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    This action will revoke all access for <strong>{profile.company_name}</strong> and move them to the Deleted Archive.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => softDeleteUser(profile.id)}>
                                                                                    Revoke Access
                                                                                </AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                    {expandedUser === profile.id && (
                                                        <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                                                            <TableCell colSpan={7} className="p-0 border-none">
                                                                <UserExpansion profile={profile} />
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </AnimatePresence>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: REJECTED */}
                <TabsContent value="rejected" className="space-y-4">
                    <Card className="border-zinc-200 shadow-sm border-t-4 border-t-red-400">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600"><UserX size={18} /> Rejected Requests</CardTitle>
                            <CardDescription>Applications that were declined access. You can revert them to pending if needed.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader className="bg-zinc-50/50">
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rejectedRequests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24 text-zinc-500">No rejected applications.</TableCell>
                                        </TableRow>
                                    ) : (
                                        rejectedRequests.map(req => (
                                            <TableRow key={req.id}>
                                                <TableCell className="font-medium">{req.full_name}</TableCell>
                                                <TableCell className="text-sm font-mono">{req.email}</TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-medium">{req.company_name}</div>
                                                    <div className="text-xs text-zinc-500">{req.industry} {req.company_size && `• ${req.company_size}`}</div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" variant="outline" onClick={() => updateWaitlistStatus(req.id, 'pending')}>Revert to Pending</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 4: DELETED */}
                <TabsContent value="deleted" className="space-y-4">
                    <Card className="border-zinc-200 shadow-sm border-t-4 border-t-zinc-400">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-zinc-500"><UserX size={18} /> Deleted Archive</CardTitle>
                            <CardDescription>Accounts that have been permanently removed from active service.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader className="bg-zinc-50/50">
                                    <TableRow>
                                        <TableHead>User / Company</TableHead>
                                        <TableHead>Industry</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deletedProfiles.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center h-24 text-zinc-500">Archive is empty.</TableCell>
                                        </TableRow>
                                    ) : (
                                        deletedProfiles.map(profile => (
                                            <TableRow key={profile.id} className="opacity-60 bg-zinc-50">
                                                <TableCell>
                                                    <div className="font-medium line-through text-zinc-500">{profile.full_name || 'N/A'}</div>
                                                    <div className="text-sm text-zinc-400">{profile.company_name || 'Unknown Co.'}</div>
                                                </TableCell>
                                                <TableCell className="text-zinc-500">{profile.industry || 'Unknown'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-zinc-500 border-zinc-200">Archived</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div >
    );
}
