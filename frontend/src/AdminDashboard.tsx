import { useEffect, useState } from 'react';
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
import { Shield, Lock, Unlock, Mail, Loader2, UserX, UserCheck, Activity, KeyRound, Save } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    const [loading, setLoading] = useState(true);

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
    const [isEditLimitOpen, setIsEditLimitOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        // Fetch Profiles
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (profileError) {
            console.error("Error fetching profiles:", profileError);
            toast.error("Failed to load user profiles.");
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
            if (res.ok) {
                // Update waitlist status
                const { error: updateError } = await supabase
                    .from('waiting_list')
                    .update({ status: 'approved' })
                    .eq('id', selectedWaitlistEntry.id);

                if (updateError) {
                    console.error("Waitlist update error:", updateError);
                    toast.error("User created but waitlist status failed to update. Run RLS fixes!");
                } else {
                    toast.success(`User ${selectedWaitlistEntry.email} successfully provisioned!`);
                    // Update local state immediately for hiding
                    setWaitingList(prev => prev.map(w => w.id === selectedWaitlistEntry.id ? { ...w, status: 'approved' } : w));
                }

                setProvisionPassword("");
                setIsApproveOpen(false);
                setSelectedWaitlistEntry(null);

                // We rely on local state updates for immediate UI feedback.
                // The new user profile will appear in "Approved & Live" after a manual refresh.
            } else {
                toast.error(data.detail || "Failed to provision user.");
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
                <TabsList className="grid w-full max-w-xl grid-cols-4 mb-8">
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
                                                                if (open) setSelectedWaitlistEntry(req);
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
                                                                            <label className="text-sm font-medium">Initial Password</label>
                                                                            <div className="relative">
                                                                                <KeyRound className="absolute top-2.5 left-2.5 h-4 w-4 text-zinc-500" />
                                                                                <Input
                                                                                    type="text"
                                                                                    placeholder="Enter a secure password..."
                                                                                    className="pl-9"
                                                                                    value={provisionPassword}
                                                                                    onChange={(e) => setProvisionPassword(e.target.value)}
                                                                                />
                                                                            </div>
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
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead className="w-[120px] text-center">Daily Quota</TableHead>
                                        <TableHead className="w-[140px]">Access Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {liveProfiles.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24 text-zinc-500">No active users found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        liveProfiles.map(profile => (
                                            <TableRow key={profile.id} className={profile.is_locked ? "bg-amber-50/30" : ""}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {profile.full_name || 'N/A'}
                                                        {profile.role === 'admin' && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Admin</Badge>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm font-mono">{profile.email || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-medium">{profile.company_name || 'Unknown Co.'}</div>
                                                    <div className="text-xs text-zinc-500">{profile.industry || 'Unknown'} {profile.company_size && `• ${profile.company_size}`}</div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="secondary" className="font-mono text-sm px-2.5 py-0.5">{profile.daily_audit_limit}</Badge>
                                                </TableCell>
                                                <TableCell>
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
                                                <TableCell className="text-right space-x-2">
                                                    <Dialog open={isEditLimitOpen && editingProfile?.id === profile.id} onOpenChange={(open) => {
                                                        if (open) { setEditingProfile(profile); setNewLimit(profile.daily_audit_limit); }
                                                        setIsEditLimitOpen(open);
                                                    }}>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" variant="outline"><Save size={14} className="mr-1.5 text-zinc-500" /> Edit Profile</Button>
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
                                                                <div className="space-y-3">
                                                                    <label className="text-sm font-medium">Reset Password <span className="text-zinc-400 font-normal">(Leave blank to keep current)</span></label>
                                                                    <div className="relative">
                                                                        <KeyRound className="absolute top-2.5 left-2.5 h-4 w-4 text-zinc-500" />
                                                                        <Input type="text" placeholder="New secure password..." value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} className="pl-9" />
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
                                                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50">Delete</Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This action will revoke all access for <strong>{profile.company_name}</strong> and move them to the Deleted Archive. They will be immediately blocked from making new API requests.
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
                                                </TableCell>
                                            </TableRow>
                                        ))
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
