import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Switch } from '../components/ui/switch';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { Shield, Lock, Unlock, Mail, Loader2, UserX, UserCheck, Activity, KeyRound, Save, Eye, EyeOff, Zap, Clock, Users, AlertCircle, FileText, FileCheck, Calculator, FolderOpen, CalendarDays, AlertTriangle, TrendingUp, Upload, Database, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';


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
    total_tokens_used?: number;
    total_audits_done?: number;
    audits_used_today?: number;
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

interface ToolConfig {
    id: string;
    name: string;
    description: string;
    icon: string;
    tier: number;
    status: 'live' | 'coming_soon' | 'disabled';
    free_limit: number;
    pro_limit: number;
    max_limit: number;
    enabled_for_free: boolean;
    enabled_for_pro: boolean;
    enabled_for_max: boolean;
    sort_order: number;
}

interface PlanConfig {
    id: string;
    display_name: string;
    price_monthly: number;
    price_annual: number;
    discount_percentage: number;
    description: string;
    is_active: boolean;
    features: string[];
    sort_order: number;
}

export function AdminPage({ session, adminProfile }: { session: any, adminProfile: any }) {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [healthData, setHealthData] = useState<ModelHealth[]>([
        { model_id: 'gemini-2.5-flash', provider: 'google', rpm: 0, tpm: 0, rpmLimit: 15, tpmLimit: 1000000, isActive: true }
    ]);
    const [toolConfigs, setToolConfigs] = useState<ToolConfig[]>([]);
    const [isSavingTool, setIsSavingTool] = useState<string | null>(null);
    const [planConfigs, setPlanConfigs] = useState<PlanConfig[]>([]);
    const [isSavingPlan, setIsSavingPlan] = useState<string | null>(null);
    const [editingPlan, setEditingPlan] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Data Repository state
    const [mdFile, setMdFile] = useState<File | null>(null);
    const [uploadToolId, setUploadToolId] = useState('labour-audit');
    const [isIngesting, setIsIngesting] = useState(false);
    const [ingestResult, setIngestResult] = useState<{ success: boolean; chunks: number; filename: string } | null>(null);
    const mdFileRef = useRef<HTMLInputElement>(null);
    const [kbFiles, setKbFiles] = useState<{ filename: string; tool_id: string }[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<{ filename: string; tool_id: string } | null>(null);
    const [toolToActivate, setToolToActivate] = useState<string | null>(null);

    // Tool Registry Management
    const [isAddingTool, setIsAddingTool] = useState(false);
    const [toolToEdit, setToolToEdit] = useState<ToolConfig | null>(null);
    const [toolToPermanentlyDelete, setToolToPermanentlyDelete] = useState<ToolConfig | null>(null);
    const [deleteConfirmName, setDeleteConfirmName] = useState("");
    const [newToolData, setNewToolData] = useState<Partial<ToolConfig>>({
        name: '',
        description: '',
        icon: 'FileText',
        tier: 1,
        status: 'coming_soon',
        enabled_for_free: false,
        enabled_for_pro: true,
        enabled_for_max: true
    });

    const toolIconMap: Record<string, React.ReactNode> = {
        'FileText': <FileText size={18} className="text-[#606C5A]" />,
        'FileCheck': <FileCheck size={18} className="text-[#606C5A]" />,
        'Calculator': <Calculator size={18} className="text-[#606C5A]" />,
        'FolderOpen': <FolderOpen size={18} className="text-[#606C5A]" />,
        'CalendarDays': <CalendarDays size={18} className="text-[#606C5A]" />,
        'AlertTriangle': <AlertTriangle size={18} className="text-[#606C5A]" />,
        'TrendingUp': <TrendingUp size={18} className="text-[#606C5A]" />,
        'Shield': <Shield size={18} className="text-[#606C5A]" />,
        'Gavel': <Zap size={18} className="text-[#606C5A]" />, // Gavel not in current subset, using Zap as legal pulse
    };

    const availableIcons = Object.keys(toolIconMap);

    // Modal States
    const [selectedWaitlistEntry, setSelectedWaitlistEntry] = useState<WaitingListEntry | null>(null);
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
    const [isEditLimitOpen, setIsEditLimitOpen] = useState(false);

    const handleIngestMd = async () => {
        if (!mdFile) return;
        setIsIngesting(true);
        setIngestResult(null);
        try {
            const formData = new FormData();
            formData.append('file', mdFile);
            formData.append('tool_id', uploadToolId);
            const res = await fetch(`${API_URL}/admin/ingest-md`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
                body: formData,
            });
            const ingestCt = res.headers.get('content-type') || '';
            const data = ingestCt.includes('application/json') ? await res.json() : {};
            if (res.ok) {
                setIngestResult({ success: true, chunks: data.chunks_ingested, filename: mdFile.name });
                toast.success(`"${mdFile.name}" ingested — ${data.chunks_ingested} chunks added to knowledge base.`);
                setMdFile(null);
                if (mdFileRef.current) mdFileRef.current.value = '';

                // Fetch updated file list
                fetchKbFiles();

                // Tool activation check
                const tool = toolConfigs.find(t => t.id === uploadToolId);
                if (tool && tool.status === 'coming_soon') {
                    setToolToActivate(uploadToolId);
                }
            } else {
                setIngestResult({ success: false, chunks: 0, filename: mdFile.name });
                toast.error(data.detail || 'Ingestion failed.');
            }
        } catch (e) {
            toast.error('Error connecting to backend.');
        }
        setIsIngesting(false);
    };

    const fetchKbFiles = async () => {
        setIsLoadingFiles(true);
        try {
            // Fetch directly from labour_laws table instead of potentially unreachable backend endpoint
            const { data, error } = await supabase
                .from('labour_laws')
                .select('filename, tool_id');

            if (error) throw error;

            if (data) {
                // Deduplicate by filename + tool_id pair
                const filesMap = new Map();
                data.forEach(row => {
                    const fname = row.filename;
                    const tid = row.tool_id;
                    if (!fname) return;

                    const key = `${tid}:${fname}`;
                    if (!filesMap.has(key)) {
                        filesMap.set(key, {
                            filename: fname,
                            tool_id: tid
                        });
                    }
                });

                setKbFiles(Array.from(filesMap.values()));
            }
        } catch (e) {
            console.error("Fetch KB files error:", e);
            toast.error("Failed to fetch database repository files.");
        }
        setIsLoadingFiles(false);
    };

    const handleDeleteKbFile = async (tid: string, fname: string) => {
        try {
            const res = await fetch(`${API_URL}/admin/knowledge-base/files?tool_id=${tid}&filename=${encodeURIComponent(fname)}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            if (res.ok) {
                toast.success(`Deleted file "${fname}"`);
                fetchKbFiles();
                setFileToDelete(null);
            } else {
                toast.error("Failed to delete file.");
            }
        } catch (e) {
            toast.error("Error deleting file.");
        }
    };

    const activateTool = async (toolId: string) => {
        const { error } = await supabase
            .from('tool_config')
            .update({ status: 'live' })
            .eq('id', toolId);

        if (!error) {
            setToolConfigs(prev => prev.map(t => t.id === toolId ? { ...t, status: 'live' } : t));
            toast.success(`Tool "${toolId}" is now LIVE!`);
        } else {
            toast.error("Failed to activate tool.");
        }
        setToolToActivate(null);
    };

    const fetchData = async () => {
        // Only show full-page loader if we have no data yet
        if (profiles.length === 0 && toolConfigs.length === 0) {
            setLoading(true);
        }
        try {
            // ✅ Run ALL queries in parallel — no sequential awaits
            const [
                { data: profileData, error: profileError },
                { data: logData, error: logError },
                { data: waitingData, error: waitingError },
                { data: toolData },
                { data: planData },
            ] = await Promise.all([
                supabase.from('profiles').select('*').order('created_at', { ascending: false }),
                supabase.from('api_logs').select('*').order('created_at', { ascending: false }).limit(200),
                supabase.from('waiting_list').select('*').order('created_at', { ascending: false }),
                supabase.from('tool_config').select('*').order('sort_order', { ascending: true }),
                supabase.from('plan_config').select('*').order('sort_order', { ascending: true }),
            ]);

            if (profileError) {
                console.error("Error fetching profiles:", profileError);
                toast.error("Failed to load user profiles.");
            }

            if (logError) {
                console.error("Error fetching logs:", logError);
            } else if (logData) {
                setAuditLogs(logData);

                // Calculate per-user consumption from fetched logs
                if (profileData) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const updatedProfiles = profileData.map(p => {
                        const userLogs = logData.filter(l => l.user_id === p.id);
                        const todayLogs = userLogs.filter(l => new Date(l.created_at) >= today);
                        const totalTokens = userLogs.reduce((sum, l) => sum + (l.total_tokens || 0), 0);
                        return {
                            ...p,
                            total_tokens_used: totalTokens,
                            total_audits_done: userLogs.length,
                            audits_used_today: todayLogs.length
                        };
                    });
                    setProfiles(updatedProfiles);
                }
            } else if (profileData) {
                setProfiles(profileData);
            }

            if (waitingError) {
                console.error("Error fetching waiting list:", waitingError);
            } else if (waitingData) {
                setWaitingList(waitingData);
            }

            if (toolData) setToolConfigs(toolData as ToolConfig[]);
            if (planData) setPlanConfigs(planData as PlanConfig[]);

            // Fetch model stats and KB files in parallel too (non-blocking for UI)
            fetchStats();
            fetchKbFiles();
        } catch (err) {
            console.error("fetchData error:", err);
            toast.error("Failed to load admin data.");
        } finally {
            setLoading(false);
        }
    };

    const updateToolConfig = async (toolId: string, field: string, value: any) => {
        setIsSavingTool(toolId);
        try {
            const { error } = await supabase
                .from('tool_config')
                .update({ [field]: value })
                .eq('id', toolId);
            if (error) throw error;
            setToolConfigs(prev => prev.map(t => t.id === toolId ? { ...t, [field]: value } : t));
            toast.success('Tool configuration updated');
        } catch (e) {
            console.error(e);
            toast.error('Failed to update tool');
        }
        setIsSavingTool(null);
    };

    const handleAddTool = async () => {
        if (!newToolData.name) {
            toast.error("Tool name is required");
            return;
        }
        // Unique ID generation: name-based slug
        const id = newToolData.name.toLowerCase().replace(/\s+/g, '-');

        try {
            const { data, error } = await supabase
                .from('tool_config')
                .insert([{ ...newToolData, id, sort_order: toolConfigs.length + 1 }])
                .select();

            if (error) throw error;
            if (data) setToolConfigs(prev => [...prev, data[0]]);
            setIsAddingTool(false);
            setNewToolData({
                name: '',
                description: '',
                icon: 'FileText',
                tier: 1,
                status: 'coming_soon',
                enabled_for_free: false,
                enabled_for_pro: true,
                enabled_for_max: true
            });
            toast.success("New tool added to registry");
        } catch (e) {
            console.error(e);
            toast.error("Failed to add tool");
        }
    };

    const handlePermanentlyDeleteTool = async () => {
        if (!toolToPermanentlyDelete) return;
        if (deleteConfirmName !== toolToPermanentlyDelete.name) {
            toast.error("Tool name mismatch. Deletion cancelled.");
            return;
        }

        try {
            // First delete files from storage if any? (Backend handles DB cleanup usually, but we ensure DB entry is gone)
            const { error } = await supabase
                .from('tool_config')
                .delete()
                .eq('id', toolToPermanentlyDelete.id);

            if (error) throw error;

            setToolConfigs(prev => prev.filter(t => t.id !== toolToPermanentlyDelete.id));
            toast.success(`Tool "${toolToPermanentlyDelete.name}" permanently removed`);
            setToolToPermanentlyDelete(null);
            setDeleteConfirmName("");
        } catch (e) {
            console.error(e);
            toast.error("Failed to delete tool");
        }
    };

    const updatePlanConfig = async (planId: string, updates: Partial<PlanConfig>) => {
        setIsSavingPlan(planId);
        try {
            const { error } = await supabase
                .from('plan_config')
                .update(updates)
                .eq('id', planId);

            if (error) throw error;

            setPlanConfigs(prev => prev.map(p => p.id === planId ? { ...p, ...updates } : p));
            toast.success('Plan updated.');
        } catch (e: any) {
            console.error('Failed to update plan:', e);
            toast.error(e.message || 'Failed to update plan.');
        }
        setIsSavingPlan(null);
    };

    const calculateAnnualPrice = (monthly: number, discount: number) => {
        return Math.floor(monthly * 12 * (1 - (discount / 100)));
    };

    const fetchStats = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch(`${API_URL}/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setHealthData(prev => prev.map(m => {
                    const stat = data.models.find((s: any) => s.model_id === m.model_id);
                    if (stat) {
                        return {
                            ...m,
                            rpm: stat.rpm,
                            tpm: stat.tpm,
                            isActive: stat.status === 'Active'
                        };
                    }
                    return m;
                }));
                // toast.success("Metrics updated");
            }
        } catch (err) {
            console.error("Error fetching admin stats:", err);
        } finally {
            setTimeout(() => setIsRefreshing(false), 800);
        }
    };

    useEffect(() => {
        fetchData();

        // Subscribe to real-time changes
        const profilesSubscription = supabase
            .channel('public:profiles')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                fetchData();
            })
            .subscribe();

        const waitingListSubscription = supabase
            .channel('public:waiting_list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'waiting_list' }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(profilesSubscription);
            supabase.removeChannel(waitingListSubscription);
        };
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

        // Tool usage breakdown by model
        const toolUsage = [
            { model: 'gemini-2.5-flash', label: 'Gemini Flash 2.5', count: userLogs.filter(l => l.model_id?.includes('gemini')).length, tokens: userLogs.filter(l => l.model_id?.includes('gemini')).reduce((s, l) => s + (l.total_tokens || 0), 0) },
        ];

        return (
            <div className="bg-[#FBFAF5] p-6 border-t border-[#E6E4E0]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8F837A]">Tool Usage Breakdown</h4>
                        <div className="bg-[#FFFFFC] rounded-lg border border-[#E6E4E0] overflow-hidden">
                            <table className="w-full text-[11px]">
                                <thead>
                                    <tr className="border-b border-[#E6E4E0] bg-[#F3F3F2]">
                                        <th className="text-left px-3 py-2 text-[#8F837A] font-semibold uppercase tracking-wider text-[9px]">Model</th>
                                        <th className="text-right px-3 py-2 text-[#8F837A] font-semibold uppercase tracking-wider text-[9px]">Runs</th>
                                        <th className="text-right px-3 py-2 text-[#8F837A] font-semibold uppercase tracking-wider text-[9px]">Tokens</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {toolUsage.map(row => (
                                        <tr key={row.model} className="border-b border-[#F3F3F2] last:border-0">
                                            <td className="px-3 py-2 font-mono text-[#2C2A28]">{row.label}</td>
                                            <td className="px-3 py-2 text-right font-mono text-[#5E5E5E]">{row.count}</td>
                                            <td className="px-3 py-2 text-right font-mono text-[#5E5E5E]">{row.tokens.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {userLogs.length === 0 && (
                                        <tr><td colSpan={3} className="px-3 py-4 text-center text-[#8F837A] italic">No audit history recorded</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8F837A]">Infrastructure Controls</h4>
                        <div className="p-4 bg-[#FFFFFC] rounded-lg border border-[#E6E4E0] space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-[#2C2A28]">Daily Audit Quota</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        defaultValue={profile.daily_audit_limit}
                                        onBlur={(e) => updateLimit(profile.id, parseInt(e.target.value))}
                                        className="w-16 h-8 text-xs border border-[#E6E4E0] rounded px-2 focus:ring-1 focus:ring-[#606C5A] outline-none bg-[#FBFAF5]"
                                    />
                                    <span className="text-[10px] text-[#8F837A]">audits</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between opacity-50 pointer-events-none">
                                <span className="text-xs font-medium text-[#2C2A28]">Token Ceiling</span>
                                <Badge variant="outline" className="text-[10px]">Unlimited</Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit Trail Table Removed - Admins only see aggregated counts, not individual logs */}
            </div>
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
        if (!selectedWaitlistEntry) return;

        setIsProvisioning(true);
        try {
            // First update the profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    is_approved: true,
                    is_locked: false
                })
                .eq('email', selectedWaitlistEntry.email);

            if (profileError) {
                console.error("Profile update error:", profileError);
                toast.error("Failed to approve user profile. Check RLS or permissions.");
                setIsProvisioning(false);
                return;
            }

            // Then update the waitlist entry
            const { error: updateError } = await supabase
                .from('waiting_list')
                .update({ status: 'approved' })
                .eq('id', selectedWaitlistEntry.id);

            if (updateError) {
                console.error("Waitlist update error:", updateError);
                toast.error("Status update failed.");
            } else {
                setWaitingList(prev => prev.map(w => w.id === selectedWaitlistEntry.id ? { ...w, status: 'approved' } : w));
                toast.success(`User ${selectedWaitlistEntry.email} successfully approved!`);
            }
            setIsApproveOpen(false);
            setSelectedWaitlistEntry(null);
        } catch (error) {
            toast.error("An error occurred during approval.");
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
                        const ct = res.headers.get('content-type') || '';
                        const data = ct.includes('application/json') ? await res.json() : {};
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
        <div className="space-y-6 fade-in max-w-6xl mx-auto pb-12">
            <Tabs defaultValue="pulse" className="w-full space-y-6">
                {/* Persistent Admin Header */}
                <div className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(95,87,80,0.07)] flex items-center justify-between border border-[#E6E4E0]">
                    <div className="flex flex-row items-center gap-5">
                        <div className="bg-[#ECF0E8] p-2.5 rounded-xl border border-[#DCE4D5] shadow-sm">
                            <Shield className="text-[#606C5A] w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-serif text-2xl text-[#2C2A28]">Governance Console</h1>
                            <p className="text-[#8F837A] flex items-center gap-2 text-[13px] mt-1">
                                Logged in as <span className="text-[#2C2A28] font-medium">{adminProfile?.full_name || session?.user?.email}</span>
                                <Badge variant="secondary" className="bg-[#F3F3F2] text-[#5E5E5E] border-[#E6E4E0] text-[10px] uppercase tracking-wider h-4">Administrator</Badge>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <TabsList className="bg-[#F3F3F2] border border-[#E6E4E0] p-1 h-auto rounded-lg mr-2">
                            <TabsTrigger value="pulse" className="text-[13px] font-medium data-[state=active]:bg-white data-[state=active]:text-[#2C2A28] data-[state=active]:shadow-[0_1px_2px_rgba(95,87,80,0.06)] text-[#8F837A] rounded-md px-4 py-1.5 transition-all">Pulse</TabsTrigger>
                            <TabsTrigger value="governance" className="text-[13px] font-medium data-[state=active]:bg-white data-[state=active]:text-[#2C2A28] data-[state=active]:shadow-[0_1px_2px_rgba(95,87,80,0.06)] text-[#8F837A] rounded-md px-4 py-1.5 transition-all">Governance</TabsTrigger>
                            <TabsTrigger value="plans" className="text-[13px] font-medium data-[state=active]:bg-white data-[state=active]:text-[#2C2A28] data-[state=active]:shadow-[0_1px_2px_rgba(95,87,80,0.06)] text-[#8F837A] rounded-md px-4 py-1.5 transition-all">Plans & Tools</TabsTrigger>
                            <TabsTrigger value="system" className="text-[13px] font-medium data-[state=active]:bg-white data-[state=active]:text-[#2C2A28] data-[state=active]:shadow-[0_1px_2px_rgba(95,87,80,0.06)] text-[#8F837A] rounded-md px-4 py-1.5 transition-all">System</TabsTrigger>
                            <TabsTrigger value="data" className="text-[13px] font-medium data-[state=active]:bg-white data-[state=active]:text-[#2C2A28] data-[state=active]:shadow-[0_1px_2px_rgba(95,87,80,0.06)] text-[#8F837A] rounded-md px-4 py-1.5 transition-all">Data Repo</TabsTrigger>
                        </TabsList>

                        <Button
                            variant="outline"
                            size="sm"
                            className={`bg-white border-[#E6E4E0] text-[#5E5E5E] hover:bg-[#F3F3F2] hover:text-[#2C2A28] gap-2 h-9 px-4 transition-all ${isRefreshing ? 'opacity-50' : ''}`}
                            onClick={fetchData}
                            disabled={loading || isRefreshing}
                        >
                            {loading || isRefreshing ? <Loader2 size={16} className="animate-spin text-[#606C5A]" /> : <Activity size={16} className="text-[#606C5A]" />}
                            {loading || isRefreshing ? 'Updating Metrics...' : 'Refresh Pulse'}
                        </Button>
                    </div>
                </div>

                <div className="relative fade-in">
                    <TabsContent value="pulse" className="space-y-6 outline-none">
                        <div className="mb-4">
                            <h2 className="font-serif text-xl tracking-tight text-[#2C2A28]">Pulse</h2>
                            <p className="text-[13px] text-[#8F837A] mt-1">Real-time metrics and recent audit activity.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="bg-[#FFFFFC] border-[#E6E4E0] shadow-[0_1px_2px_rgba(95,87,80,0.04)]">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-[13px] font-medium text-[#5E5E5E]">Active Users Today</CardTitle>
                                        <Users className="w-4 h-4 text-[#8F837A]" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-[#2C2A28] font-serif">
                                        {profiles.filter(p => !p.is_deleted && p.audits_used_today && p.audits_used_today > 0).length}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#FFFFFC] border-[#E6E4E0] shadow-[0_1px_2px_rgba(95,87,80,0.04)]">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-[13px] font-medium text-[#5E5E5E]">Audits Run Today</CardTitle>
                                        <FileText className="w-4 h-4 text-[#8F837A]" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-[#2C2A28] font-serif">
                                        {auditLogs.filter(l => new Date(l.created_at) >= new Date(new Date().setHours(0, 0, 0, 0))).length}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#FFFFFC] border-[#E6E4E0] shadow-[0_1px_2px_rgba(95,87,80,0.04)]">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-[13px] font-medium text-[#5E5E5E]">Pending Requests</CardTitle>
                                        <Clock className="w-4 h-4 text-[#8F837A]" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-[#2C2A28] font-serif">
                                        {waitingList.filter(w => w.status === 'pending').length}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#FFFFFC] border-[#E6E4E0] shadow-[0_1px_2px_rgba(95,87,80,0.04)]">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-[13px] font-medium text-[#5E5E5E]">Errors (24h)</CardTitle>
                                        <AlertCircle className="w-4 h-4 text-[#8F837A]" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-[#8F837A] font-serif">
                                        0
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                    </TabsContent>

                    {/* PLANS & TOOLS TAB */}
                    <TabsContent value="plans" className="space-y-8 outline-none">
                        <div className="mb-2">
                            <h2 className="font-serif text-xl tracking-tight text-[#2C2A28]">Plans & Tools</h2>
                            <p className="text-[13px] text-[#8F837A] mt-1">Configure which tools are available per plan tier. Changes save instantly to the database.</p>
                        </div>

                        {/* Plan Tier Cards — dynamic from plan_config table */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(planConfigs.length > 0 ? planConfigs : [
                                { id: 'free', display_name: 'Free', price_monthly: 0, price_annual: 0, discount_percentage: 0, description: 'Self-serve access to get started', features: [], sort_order: 1, is_active: true },
                                { id: 'pro', display_name: 'Pro', price_monthly: 49900, price_annual: 499000, discount_percentage: 15, description: 'For growing businesses', features: [], sort_order: 2, is_active: true },
                                { id: 'max', display_name: 'Max', price_monthly: 99900, price_annual: 999000, discount_percentage: 20, description: 'For large organizations', features: [], sort_order: 3, is_active: true },
                            ] as PlanConfig[]).map(plan => {
                                const accentMap: Record<string, string> = { free: 'border-t-[#C0B4A8]', pro: 'border-t-[#606C5A]', max: 'border-t-[#4E7A94]' };
                                const badgeMap: Record<string, string> = { free: 'bg-[#F3F3F2] text-[#5E5E5E] border-[#E6E4E0]', pro: 'bg-[#ECF0E8] text-[#606C5A] border-[#DCE4D5]', max: 'bg-[#EBF3FA] text-[#4E7A94] border-[#C3DBE9]' };
                                const isSaving = isSavingPlan === plan.id;
                                const isEditing = editingPlan === plan.id;
                                return (
                                    <Card key={plan.id} className={`bg-[#FFFFFC] border-[#E6E4E0] border-t-4 ${accentMap[plan.id] || 'border-t-[#C0B4A8]'} shadow-[0_1px_3px_rgba(95,87,80,0.07)]`}>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-[15px] font-semibold text-[#2C2A28]">{plan.display_name}</CardTitle>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={`text-[10px] uppercase font-bold tracking-widest border ${badgeMap[plan.id] || badgeMap.free}`}>{plan.display_name}</Badge>
                                                    <button
                                                        onClick={() => setEditingPlan(isEditing ? null : plan.id)}
                                                        className="text-[10px] text-[#8F837A] hover:text-[#2C2A28] transition-colors underline underline-offset-2"
                                                    >
                                                        {isEditing ? 'Done' : 'Edit'}
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Monthly price — editable */}
                                            {isEditing ? (
                                                <div className="mt-2 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] text-[#8F837A] w-24 shrink-0">Monthly (₹)</span>
                                                        <Input
                                                            type="number" min={0}
                                                            defaultValue={plan.price_monthly}
                                                            className="h-7 text-[12px] border-[#E6E4E0]"
                                                            onBlur={e => {
                                                                const v = parseInt(e.target.value, 10);
                                                                if (!isNaN(v) && v !== plan.price_monthly) {
                                                                    const annual = calculateAnnualPrice(v, plan.discount_percentage);
                                                                    updatePlanConfig(plan.id, { price_monthly: v, price_annual: annual });
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] text-[#8F837A] w-24 shrink-0">Annual (₹)</span>
                                                        <Input
                                                            type="number" min={0}
                                                            value={plan.price_annual}
                                                            readOnly
                                                            className="h-7 text-[12px] border-[#E6E4E0] bg-[#F3F3F2] cursor-not-allowed"
                                                            title="Auto-calculated based on monthly price and discount"
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] text-[#8F837A] w-24 shrink-0">Tagline</span>
                                                        <Input
                                                            type="text"
                                                            defaultValue={plan.description}
                                                            className="h-7 text-[12px] border-[#E6E4E0]"
                                                            onBlur={e => { if (e.target.value !== plan.description) updatePlanConfig(plan.id, { description: e.target.value }); }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="text-xl font-bold font-serif text-[#2C2A28] mt-1">
                                                        {plan.price_monthly === 0 ? '₹0' : `₹${plan.price_monthly.toLocaleString('en-IN')}`}
                                                        <span className="text-[13px] font-normal text-[#8F837A]"> / month</span>
                                                    </div>
                                                    {plan.price_annual > 0 && (
                                                        <div className="text-[11px] text-[#8F837A]">₹{plan.price_annual.toLocaleString('en-IN')} billed annually</div>
                                                    )}
                                                    <CardDescription className="text-[12px] text-[#8F837A] mt-0.5">{plan.description}</CardDescription>
                                                </>
                                            )}
                                        </CardHeader>
                                        <CardContent>
                                            {isSaving && <div className="text-[11px] text-[#8F837A] italic mb-2 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Saving...</div>}
                                            {plan.features && plan.features.length > 0 ? (
                                                <ul className="space-y-1.5">
                                                    {plan.features.map((f: string) => (
                                                        <li key={f} className="flex items-center gap-2 text-[12px] text-[#5E5E5E]">
                                                            <div className="w-1 h-1 rounded-full bg-[#C0B4A8] flex-shrink-0" />
                                                            {f}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-[11px] text-[#C0B4A8] italic">No features listed yet.</p>
                                            )}
                                            {plan.price_annual > 0 && plan.discount_percentage > 0 && !isEditing && (
                                                <div className="mt-3 text-[11px] text-[#606C5A] border-t border-[#E6E4E0] pt-2 flex items-center justify-between">
                                                    <span>Annual Discount applied:</span>
                                                    <span className="font-bold">-{plan.discount_percentage}%</span>
                                                </div>
                                            )}
                                            {isEditing && plan.id !== 'free' && (
                                                <div className="mt-3 space-y-2 border-t border-[#E6E4E0] pt-3">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold uppercase tracking-wider text-[#8F837A]">Discount %</label>
                                                            <Input
                                                                type="number"
                                                                defaultValue={plan.discount_percentage}
                                                                onBlur={e => {
                                                                    const v = parseInt(e.target.value);
                                                                    if (!isNaN(v) && v !== plan.discount_percentage) {
                                                                        const annual = calculateAnnualPrice(plan.price_monthly, v);
                                                                        updatePlanConfig(plan.id, { discount_percentage: v, price_annual: annual });
                                                                    }
                                                                }}
                                                                className="h-8 text-[12px] border-[#E6E4E0] focus:ring-[#606C5A]"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>


                        {/* Tool Registry Table */}
                        <Card className="bg-[#FFFFFC] border-[#E6E4E0] shadow-[0_1px_3px_rgba(95,87,80,0.07)]">
                            <CardHeader className="pb-2 border-b border-[#E6E4E0]">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <CardTitle className="text-[15px] font-medium text-[#2C2A28]">Tool Registry</CardTitle>
                                        <CardDescription className="text-[12px] text-[#8F837A] mt-0.5">Manage global availability, status, and icons for all tools.</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-[#F3F3F2] text-[#8F837A] border-[#E6E4E0] text-[10px] uppercase tracking-wider">
                                            {toolConfigs.filter(t => t.status === 'live').length} of {toolConfigs.length} Live
                                        </Badge>
                                        <Button
                                            size="sm"
                                            onClick={() => setIsAddingTool(true)}
                                            className="bg-[#606C5A] hover:bg-[#4A5446] text-white text-[11px] h-8 font-medium px-3"
                                        >
                                            <Zap size={14} className="mr-1.5" /> Add New Tool
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-[#E6E4E0] hover:bg-transparent">
                                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#8F837A] pl-6 py-3">Tool</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#8F837A] text-center">Tier</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#8F837A] text-center">Status</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#8F837A] text-center">Free</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#8F837A] text-center">Free Limit</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#8F837A] text-center">Pro</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#8F837A] text-center">Pro Limit</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#8F837A] text-center">Max</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#8F837A] text-center">Max Limit</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-[#8F837A] text-center pr-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {toolConfigs.map(tool => {
                                            const isLive = tool.status === 'live';
                                            const isSaving = isSavingTool === tool.id;
                                            return (
                                                <TableRow key={tool.id} className="border-b border-[#E6E4E0] last:border-0 hover:bg-[#F3F3F2]/40 transition-colors">
                                                    <TableCell className="pl-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-1.5 bg-[#F3F3F2] rounded-md border border-[#E6E4E0]">
                                                                {toolIconMap[tool.icon] || <FileText size={18} className="text-[#8F837A]" />}
                                                            </div>
                                                            <div>
                                                                <div className="text-[13px] font-medium text-[#2C2A28]">{tool.name}</div>
                                                                <div className="text-[11px] text-[#8F837A] mt-0.5 max-w-[200px] leading-snug">{tool.description}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-[#8F837A] border-[#E6E4E0]">
                                                            T{tool.tier}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {isLive ? (
                                                            <Badge className="bg-[#ECF0E8] text-[#606C5A] border border-[#DCE4D5] text-[10px] font-bold uppercase tracking-wider">Live</Badge>
                                                        ) : (
                                                            <Badge className="bg-[#F3F3F2] text-[#C0B4A8] border border-[#E6E4E0] text-[10px] font-bold uppercase tracking-wider">Soon</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Switch
                                                            checked={tool.enabled_for_free}
                                                            onCheckedChange={(val) => updateToolConfig(tool.id, 'enabled_for_free', val)}
                                                            disabled={isSaving}
                                                            className="data-[state=checked]:bg-[#606C5A]"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {tool.enabled_for_free ? (
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    defaultValue={tool.free_limit === -1 ? '' : tool.free_limit}
                                                                    placeholder={tool.free_limit === -1 ? '∞' : String(tool.free_limit)}
                                                                    className="w-16 h-7 text-center text-[12px] border-[#E6E4E0] text-[#2C2A28]"
                                                                    onBlur={(e) => {
                                                                        const val = e.target.value === '' ? -1 : parseInt(e.target.value, 10);
                                                                        if (!isNaN(val) && val !== tool.free_limit) {
                                                                            updateToolConfig(tool.id, 'free_limit', val);
                                                                        }
                                                                    }}
                                                                />
                                                                <span className="text-[10px] text-[#8F837A]">/mo</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[12px] text-[#C0B4A8]">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Switch
                                                            checked={tool.enabled_for_pro}
                                                            onCheckedChange={(val) => updateToolConfig(tool.id, 'enabled_for_pro', val)}
                                                            disabled={isSaving}
                                                            className="data-[state=checked]:bg-[#606C5A]"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {tool.enabled_for_pro ? (
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    defaultValue={tool.pro_limit === -1 ? '' : tool.pro_limit}
                                                                    placeholder={tool.pro_limit === -1 ? '∞' : String(tool.pro_limit)}
                                                                    className="w-16 h-7 text-center text-[12px] border-[#E6E4E0] text-[#2C2A28]"
                                                                    onBlur={(e) => {
                                                                        const val = e.target.value === '' ? -1 : parseInt(e.target.value, 10);
                                                                        if (!isNaN(val) && val !== tool.pro_limit) {
                                                                            updateToolConfig(tool.id, 'pro_limit', val);
                                                                        }
                                                                    }}
                                                                />
                                                                <span className="text-[10px] text-[#8F837A]">/mo</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[12px] text-[#C0B4A8]">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Switch
                                                            checked={tool.enabled_for_max}
                                                            onCheckedChange={(val) => updateToolConfig(tool.id, 'enabled_for_max', val)}
                                                            disabled={isSaving}
                                                            className="data-[state=checked]:bg-[#606C5A]"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {tool.enabled_for_max ? (
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    defaultValue={tool.max_limit === -1 ? '' : tool.max_limit}
                                                                    placeholder={tool.max_limit === -1 ? '∞' : String(tool.max_limit)}
                                                                    className="w-16 h-7 text-center text-[12px] border-[#E6E4E0] text-[#2C2A28]"
                                                                    onBlur={(e) => {
                                                                        const val = e.target.value === '' ? -1 : parseInt(e.target.value, 10);
                                                                        if (!isNaN(val) && val !== tool.max_limit) {
                                                                            updateToolConfig(tool.id, 'max_limit', val);
                                                                        }
                                                                    }}
                                                                />
                                                                <span className="text-[10px] text-[#8F837A]">/mo</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[12px] text-[#C0B4A8]">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center pr-6">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => setToolToEdit(tool)}
                                                                className="p-1.5 text-[#8F837A] hover:text-[#606C5A] hover:bg-[#F3F3F2] rounded-md transition-colors"
                                                                title="Edit Details"
                                                            >
                                                                <Save size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => setToolToPermanentlyDelete(tool)}
                                                                className="p-1.5 text-[#8F837A] hover:text-[#D32F2F] hover:bg-[#FDECEA] rounded-md transition-colors"
                                                                title="Permanent Delete"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                                {toolConfigs.length === 0 && (
                                    <div className="py-12 text-center text-[13px] text-[#8F837A] italic">
                                        Loading tool configurations...
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* ADD TOOL DIALOG */}
                        <Dialog open={isAddingTool} onOpenChange={setIsAddingTool}>
                            <DialogContent className="sm:max-w-[425px] bg-[#FFFFFC] border-[#E6E4E0]">
                                <DialogHeader>
                                    <DialogTitle className="text-[#2C2A28] font-serif">Add New Tool</DialogTitle>
                                    <DialogDescription>Create a new tool entry in the compliance hub.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <label className="text-[12px] font-bold uppercase tracking-wider text-[#8F837A]">Tool Name</label>
                                        <Input
                                            placeholder="e.g. Wage Compliance"
                                            value={newToolData.name}
                                            onChange={e => setNewToolData({ ...newToolData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-[12px] font-bold uppercase tracking-wider text-[#8F837A]">Description</label>
                                        <textarea
                                            className="flex h-20 w-full rounded-md border border-[#E6E4E0] bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-[#C0B4A8] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#606C5A]"
                                            placeholder="What does this tool do?"
                                            value={newToolData.description}
                                            onChange={e => setNewToolData({ ...newToolData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-[12px] font-bold uppercase tracking-wider text-[#8F837A]">Icon</label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {availableIcons.map(iconName => (
                                                <button
                                                    key={iconName}
                                                    onClick={() => setNewToolData({ ...newToolData, icon: iconName })}
                                                    className={`p-2 flex items-center justify-center rounded-md border ${newToolData.icon === iconName ? 'bg-[#ECF0E8] border-[#606C5A]' : 'border-[#E6E4E0] hover:bg-[#F3F3F2]'}`}
                                                >
                                                    {toolIconMap[iconName]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <label className="text-[12px] font-bold uppercase tracking-wider text-[#8F837A]">Min Tier</label>
                                            <select
                                                className="flex h-9 w-full rounded-md border border-[#E6E4E0] bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#606C5A]"
                                                value={newToolData.tier}
                                                onChange={e => setNewToolData({ ...newToolData, tier: parseInt(e.target.value) })}
                                            >
                                                <option value={1}>Tier 1 (Free)</option>
                                                <option value={2}>Tier 2 (Pro)</option>
                                                <option value={3}>Tier 3 (Max)</option>
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-[12px] font-bold uppercase tracking-wider text-[#8F837A]">Status</label>
                                            <select
                                                className="flex h-9 w-full rounded-md border border-[#E6E4E0] bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#606C5A]"
                                                value={newToolData.status}
                                                onChange={e => setNewToolData({ ...newToolData, status: e.target.value as any })}
                                            >
                                                <option value="live">Live</option>
                                                <option value="coming_soon">Coming Soon</option>
                                                <option value="disabled">Disabled</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsAddingTool(false)}>Cancel</Button>
                                    <Button onClick={handleAddTool} className="bg-[#606C5A] hover:bg-[#4A5446] text-white">Create Tool</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* EDIT TOOL DETAILED DIALOG */}
                        <Dialog open={!!toolToEdit} onOpenChange={() => setToolToEdit(null)}>
                            <DialogContent className="sm:max-w-[425px] bg-[#FFFFFC] border-[#E6E4E0]">
                                <DialogHeader>
                                    <DialogTitle className="text-[#2C2A28] font-serif">Edit Tool Details</DialogTitle>
                                </DialogHeader>
                                {toolToEdit && (
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <label className="text-[12px] font-bold uppercase tracking-wider text-[#8F837A]">Tool Name</label>
                                            <Input
                                                value={toolToEdit.name}
                                                onChange={e => setToolToEdit({ ...toolToEdit, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-[12px] font-bold uppercase tracking-wider text-[#8F837A]">Description</label>
                                            <textarea
                                                className="flex h-20 w-full rounded-md border border-[#E6E4E0] bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#606C5A]"
                                                value={toolToEdit.description}
                                                onChange={e => setToolToEdit({ ...toolToEdit, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-[12px] font-bold uppercase tracking-wider text-[#8F837A]">Icon</label>
                                            <div className="grid grid-cols-5 gap-2">
                                                {availableIcons.map(iconName => (
                                                    <button
                                                        key={iconName}
                                                        onClick={() => setToolToEdit({ ...toolToEdit, icon: iconName })}
                                                        className={`p-2 flex items-center justify-center rounded-md border ${toolToEdit.icon === iconName ? 'bg-[#ECF0E8] border-[#606C5A]' : 'border-[#E6E4E0] hover:bg-[#F3F3F2]'}`}
                                                    >
                                                        {toolIconMap[iconName]}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <label className="text-[12px] font-bold uppercase tracking-wider text-[#8F837A]">Tier Level</label>
                                                <select
                                                    className="flex h-9 w-full rounded-md border border-[#E6E4E0] bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#606C5A]"
                                                    value={toolToEdit.tier}
                                                    onChange={e => setToolToEdit({ ...toolToEdit, tier: parseInt(e.target.value) })}
                                                >
                                                    <option value={1}>Tier 1</option>
                                                    <option value={2}>Tier 2</option>
                                                    <option value={3}>Tier 3</option>
                                                </select>
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-[12px] font-bold uppercase tracking-wider text-[#8F837A]">Status</label>
                                                <select
                                                    className="flex h-9 w-full rounded-md border border-[#E6E4E0] bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#606C5A]"
                                                    value={toolToEdit.status}
                                                    onChange={e => setToolToEdit({ ...toolToEdit, status: e.target.value as any })}
                                                >
                                                    <option value="live">Live</option>
                                                    <option value="coming_soon">Coming Soon</option>
                                                    <option value="disabled">Disabled</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setToolToEdit(null)}>Cancel</Button>
                                    <Button
                                        onClick={async () => {
                                            if (toolToEdit) {
                                                // Batch update - simpler to just call individual updates or a new function
                                                // For now let's just update all relevant fields
                                                const fields = ['name', 'description', 'icon', 'tier', 'status'];
                                                for (const f of fields) {
                                                    await updateToolConfig(toolToEdit.id, f, (toolToEdit as any)[f]);
                                                }
                                                setToolToEdit(null);
                                            }
                                        }}
                                        className="bg-[#606C5A] hover:bg-[#4A5446] text-white"
                                    >
                                        Save Changes
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* PERMANENT DELETE SAFETY DIALOG */}
                        <AlertDialog open={!!toolToPermanentlyDelete} onOpenChange={() => setToolToPermanentlyDelete(null)}>
                            <AlertDialogContent className="bg-[#FFFFFC] border-[#E6E4E0]">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-[#D32F2F] font-serif">Delete Tool: {toolToPermanentlyDelete?.name}?</AlertDialogTitle>
                                    <AlertDialogDescription className="space-y-3">
                                        <p>This action is <strong>irreversible</strong>. You are about to permanently remove this tool from the registry. All configuration and tier access for this tool will be lost.</p>
                                        <div className="bg-[#FDECEA] p-3 rounded-md text-[#D32F2F] text-[12px]">
                                            To confirm, please type exactly "<strong>{toolToPermanentlyDelete?.name}</strong>" below:
                                        </div>
                                        <Input
                                            value={deleteConfirmName}
                                            onChange={e => setDeleteConfirmName(e.target.value)}
                                            placeholder="Type tool name to confirm"
                                            className="border-[#F8C1BE] focus:ring-[#D32F2F] text-center"
                                        />
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => { setToolToPermanentlyDelete(null); setDeleteConfirmName(""); }}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handlePermanentlyDeleteTool}
                                        disabled={deleteConfirmName !== toolToPermanentlyDelete?.name}
                                        className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
                                    >
                                        Delete Forever
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TabsContent>

                    <TabsContent value="system" className="space-y-6 outline-none">
                        <div className="mb-4">
                            <h2 className="font-serif text-xl tracking-tight text-[#2C2A28]">System Health & Cost</h2>
                            <p className="text-[13px] text-[#8F837A] mt-1">Monitor AI model performance, rate limits, and estimated costs.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {healthData.map((model) => {
                                const rpmProgress = (model.rpm / (model.rpmLimit || 1)) * 100;
                                const tpmProgress = (model.tpm / (model.tpmLimit || 1)) * 100;
                                const isCritical = rpmProgress > 80 || tpmProgress > 80;
                                const isExhausted = rpmProgress >= 100 || tpmProgress >= 100;

                                return (
                                    <div
                                        key={model.model_id}
                                    >
                                        <Card className="bg-[#FFFFFC] border-[#E6E4E0] shadow-[0_1px_3px_rgba(95,87,80,0.07)] overflow-hidden group hover:border-[#C0B4A8] transition-all duration-300">
                                            <div className={`h-1.5 w-full ${isExhausted ? 'bg-[#D32F2F]' : isCritical ? 'bg-[#F2A65A]' : 'bg-[#606C5A]/40'}`} />
                                            <CardHeader className="pb-2 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-lg flex items-center gap-2 text-[#2C2A28]">
                                                        <Activity size={18} className="text-[#4E7A94]" />
                                                        <span className="font-mono tracking-tight text-[#2C2A28]">{model.model_id}</span>
                                                    </CardTitle>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] uppercase font-bold tracking-widest ${model.isActive ? "bg-[#ECF0E8] text-[#606C5A] border-[#DCE4D5]" : "bg-[#FDECEA] text-[#D32F2F] border-[#F8C1BE]"}`}
                                                    >
                                                        {model.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                                <CardDescription className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8F837A] font-bold">{model.provider} ON-DEMAND NODE</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-5">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[10px] font-bold text-[#5E5E5E] uppercase tracking-wider">
                                                        <span className="flex items-center gap-1.5"><Activity size={12} className="text-[#C0B4A8]" /> Requests (RPM)</span>
                                                        <span className={isExhausted ? 'text-[#D32F2F]' : isCritical ? 'text-[#F2A65A]' : 'text-[#5E5E5E]'}>{model.rpm} / {model.rpmLimit}</span>
                                                    </div>
                                                    <div className="h-1 bg-[#F3F3F2] rounded-full overflow-hidden">
                                                        <div className={`h-full transition-all ${isExhausted ? 'bg-[#D32F2F]' : isCritical ? 'bg-[#F2A65A]' : 'bg-[#606C5A]/60'}`} style={{ width: `${rpmProgress}%` }} />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[10px] font-bold text-[#5E5E5E] uppercase tracking-wider">
                                                        <span className="flex items-center gap-1.5"><Zap size={12} className="text-[#C0B4A8]" /> Tokens (TPM)</span>
                                                        <span className={isExhausted ? 'text-[#D32F2F]' : isCritical ? 'text-[#F2A65A]' : 'text-[#8F837A]'}>{model.tpm.toLocaleString()} / {model.tpmLimit.toLocaleString()}</span>
                                                    </div>
                                                    <div className="h-1 bg-[#F3F3F2] rounded-full overflow-hidden">
                                                        <div className={`h-full transition-all ${isExhausted ? 'bg-[#D32F2F]' : isCritical ? 'bg-[#F2A65A]' : 'bg-[#606C5A]/60'}`} style={{ width: `${tpmProgress}%` }} />
                                                    </div>
                                                </div>

                                                <div className="pt-4 flex items-center justify-between text-[9px] text-[#8F837A] font-bold bg-[#F3F3F2] -mx-6 -mb-6 px-6 py-3 border-t border-[#E6E4E0]">
                                                    <span className="flex items-center gap-1.5 uppercase tracking-wider"><Clock size={10} className="text-[#606C5A]/50" /> Resets in 60s</span>
                                                    <span className="uppercase tracking-[0.1em]">NODE_ID: {model.model_id.toUpperCase().split('-')[0]}_01</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>
                    </TabsContent>

                    <TabsContent value="governance" className="space-y-6 outline-none">
                        <div className="mb-4">
                            <h2 className="font-serif text-xl tracking-tight text-[#2C2A28]">User Governance</h2>
                            <p className="text-[13px] text-[#8F837A] mt-1">Manage access requests, provision users, and monitor individual usage.</p>
                        </div>
                        <Tabs defaultValue="requests" className="w-full">
                            <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-8 bg-[#F3F3F2] border border-[#E6E4E0] p-1 rounded-xl">
                                <TabsTrigger value="requests" className="relative data-[state=active]:bg-white data-[state=active]:text-[#2C2A28] data-[state=active]:shadow-[0_1px_2px_rgba(95,87,80,0.06)] rounded-lg transition-all hover:bg-white/50 text-[#8F837A] text-xs font-bold">
                                    Pending Requests
                                    {pendingRequests.length > 0 && (
                                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-[#606C5A]"></span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="live" className="data-[state=active]:bg-white data-[state=active]:text-[#606C5A] data-[state=active]:shadow-[0_1px_2px_rgba(95,87,80,0.06)] rounded-lg transition-all hover:bg-white/50 text-[#8F837A] text-xs font-bold">Active Users</TabsTrigger>
                                <TabsTrigger value="rejected" className="data-[state=active]:bg-white data-[state=active]:text-[#2C2A28] data-[state=active]:shadow-[0_1px_2px_rgba(95,87,80,0.06)] rounded-lg transition-all hover:bg-white/50 text-[#8F837A] text-xs font-bold">Rejected</TabsTrigger>
                                <TabsTrigger value="deleted" className="data-[state=active]:bg-white data-[state=active]:text-[#2C2A28] data-[state=active]:shadow-[0_1px_2px_rgba(95,87,80,0.06)] rounded-lg transition-all hover:bg-white/50 text-[#8F837A] text-xs font-bold">Archive</TabsTrigger>
                            </TabsList>

                            {/* TAB 1: ACCESS REQUESTS */}
                            <TabsContent value="requests" className="space-y-4 border-none p-0 outline-none">
                                <Card className="bg-[#FFFFFC] border-[#E6E4E0] shadow-[0_1px_3px_rgba(95,87,80,0.07)] border-t-4 border-t-[#606C5A]">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-[#2C2A28]"><Mail size={18} className="text-[#606C5A]" /> Pending Invitations</CardTitle>
                                        <CardDescription className="text-[#8F837A]">Review new organizations requesting access to the Auditor. Approving them will provision a new Auth account.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader className="bg-zinc-50/50">
                                                <TableRow className="border-zinc-200 hover:bg-transparent">
                                                    <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Name</TableHead>
                                                    <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Email</TableHead>
                                                    <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Company</TableHead>
                                                    <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Date</TableHead>
                                                    <TableHead className="text-right text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pendingRequests.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center h-24 text-zinc-500">No pending invitations.</TableCell>
                                                    </TableRow>
                                                ) : (
                                                    pendingRequests.map(req => (
                                                        <TableRow key={req.id} className="border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                                                            <TableCell className="font-medium text-zinc-900">{req.full_name}</TableCell>
                                                            <TableCell className="text-sm font-mono text-zinc-500">{req.email}</TableCell>
                                                            <TableCell>
                                                                <div className="font-medium text-sm text-zinc-700">{req.company_name}</div>
                                                                <div className="text-[10px] text-zinc-400 uppercase tracking-tight font-bold">{req.industry} • {req.company_size}</div>
                                                            </TableCell>
                                                            <TableCell className="text-[10px] text-zinc-500 font-mono">{new Date(req.created_at).toLocaleDateString()}</TableCell>
                                                            <TableCell className="text-right space-x-2">
                                                                {req.status === 'pending' && (
                                                                    <div className="flex justify-end gap-2">
                                                                        <Dialog open={isApproveOpen && selectedWaitlistEntry?.id === req.id} onOpenChange={(open) => {
                                                                            if (open) {
                                                                                setSelectedWaitlistEntry(req);
                                                                            }
                                                                            setIsApproveOpen(open);
                                                                        }}>
                                                                            <DialogTrigger asChild>
                                                                                <Button size="sm" variant="outline" className="bg-[#ECF0E8] border-[#DCE4D5] text-[#606C5A] hover:bg-[#606C5A] hover:text-white transition-all">Approve</Button>
                                                                            </DialogTrigger>
                                                                            <DialogContent>
                                                                                <DialogHeader>
                                                                                    <DialogTitle>Approve User Account</DialogTitle>
                                                                                    <DialogDescription>
                                                                                        You are approving <strong>{req.company_name}</strong>. They will be granted access to the Compliance Hub.
                                                                                    </DialogDescription>
                                                                                </DialogHeader>
                                                                                <div className="grid gap-4 py-4">
                                                                                    <div className="grid gap-2">
                                                                                        <label className="text-sm font-medium">Email Address</label>
                                                                                        <Input value={req.email} disabled className="bg-zinc-50" />
                                                                                    </div>
                                                                                </div>
                                                                                <DialogFooter>
                                                                                    <Button variant="outline" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
                                                                                    <Button onClick={handleApproveCreation} disabled={isProvisioning}>
                                                                                        {isProvisioning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                                                                        Approve Access
                                                                                    </Button>
                                                                                </DialogFooter>
                                                                            </DialogContent>
                                                                        </Dialog>

                                                                        <Button size="sm" variant="ghost" className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10" onClick={() => updateWaitlistStatus(req.id, 'rejected')}>Reject</Button>
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
                                <Card className="bg-[#FFFFFC] border-[#E6E4E0] shadow-[0_1px_3px_rgba(95,87,80,0.07)] border-t-4 border-t-[#606C5A]">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-[#2C2A28]"><UserCheck size={18} className="text-[#606C5A]" /> Active Organizations</CardTitle>
                                        <CardDescription className="text-[#8F837A]">Manage daily quotas, suspend access, or archive users.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader className="bg-zinc-50/50">
                                                <TableRow className="border-zinc-200 hover:bg-transparent">
                                                    <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">User / Role</TableHead>
                                                    <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Email</TableHead>
                                                    <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Company & Industry</TableHead>
                                                    <TableHead className="text-center text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Rate Limit</TableHead>
                                                    <TableHead className="text-center text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Consumption</TableHead>
                                                    <TableHead className="w-[140px] text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Status</TableHead>
                                                    <TableHead className="text-right text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {liveProfiles.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="text-center h-24 text-zinc-500">No active users found.</TableCell>
                                                    </TableRow>
                                                ) : (
                                                    liveProfiles.map((profile) => (
                                                        <React.Fragment key={profile.id}>
                                                            <TableRow
                                                                className={`group cursor-pointer transition-colors border-zinc-100 ${profile.is_locked ? "bg-amber-50" : "hover:bg-zinc-50/50"}`}
                                                                onClick={() => setExpandedUser(expandedUser === profile.id ? null : profile.id)}
                                                            >
                                                                <TableCell className="font-medium">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-[#ECF0E8] border border-[#DCE4D5] flex items-center justify-center text-[#606C5A] text-xs font-bold">
                                                                            {profile.full_name?.charAt(0) || 'U'}
                                                                        </div>
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-sm font-semibold text-zinc-900">{profile.full_name || 'N/A'}</span>
                                                                                {profile.role === 'admin' && <Badge variant="outline" className="bg-[#ECF0E8] text-[#606C5A] border-[#DCE4D5] text-[10px] h-4">Admin</Badge>}
                                                                            </div>
                                                                            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">{profile.role}</div>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-sm font-mono text-zinc-500">{profile.email || 'N/A'}</TableCell>
                                                                <TableCell>
                                                                    <div className="text-sm font-medium text-zinc-900">{profile.company_name || 'Unknown Co.'}</div>
                                                                    <div className="text-[10px] text-zinc-400 font-bold uppercase">{profile.industry || 'Unknown'} {profile.company_size && `• ${profile.company_size}`}</div>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
                                                                        <div className="flex justify-between w-full text-[9px] font-bold text-zinc-500 uppercase px-1">
                                                                            <span>Daily Usage</span>
                                                                            <span>{profile.audits_used_today || 0} / {profile.daily_audit_limit} audits today</span>
                                                                        </div>
                                                                        <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                                                                            <div
                                                                                className={`h-full transition-all ${((profile.audits_used_today || 0) / (profile.daily_audit_limit || 1)) >= 1 ? 'bg-red-500' : 'bg-emerald-500/60'}`}
                                                                                style={{ width: `${Math.min(100, ((profile.audits_used_today || 0) / (profile.daily_audit_limit || 1)) * 100)}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-[9px] text-zinc-400 font-mono uppercase tracking-tighter">{(profile.total_tokens_used || 0).toLocaleString()} PROCESSED</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <Badge variant="outline" className="text-[9px] font-mono whitespace-nowrap bg-zinc-50 border-zinc-200 text-zinc-600 px-2 py-0">
                                                                        {profile.total_audits_done || 0} AUDITS
                                                                    </Badge>
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
                                                                                setResetPassword('');
                                                                                setShowOldPassword(false);
                                                                                setShowPassword(false);
                                                                            }
                                                                            setIsEditLimitOpen(open);
                                                                        }}>
                                                                            <DialogTrigger asChild>
                                                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-emerald-600 transition-all">
                                                                                    <Save size={16} />
                                                                                </Button>
                                                                            </DialogTrigger>
                                                                            <DialogContent className="sm:max-w-md bg-white border-zinc-200">
                                                                                <DialogHeader>
                                                                                    <DialogTitle className="text-zinc-900">Update {profile.full_name || profile.company_name}</DialogTitle>
                                                                                    <DialogDescription className="text-zinc-500">Modify the daily audit limit or reset their password.</DialogDescription>
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
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* TAB 3: REJECTED */}
                            <TabsContent value="rejected" className="space-y-4">
                                <Card className="bg-[#FFFFFC] border-[#E6E4E0] shadow-[0_1px_3px_rgba(95,87,80,0.07)] border-t-4 border-t-[#8B4A42]">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-[#2C2A28]"><UserX size={18} className="text-[#8B4A42]" /> Rejected Requests</CardTitle>
                                        <CardDescription className="text-[#8F837A]">Applications that were declined access. You can revert them to pending if needed.</CardDescription>
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
                                                        <TableRow key={req.id} className="border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                                                            <TableCell className="font-medium text-zinc-900">{req.full_name}</TableCell>
                                                            <TableCell className="text-sm font-mono text-zinc-500">{req.email}</TableCell>
                                                            <TableCell>
                                                                <div className="text-sm font-medium text-zinc-900">{req.company_name}</div>
                                                                <div className="text-xs text-zinc-400 font-bold uppercase">{req.industry} {req.company_size && `• ${req.company_size}`}</div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button size="sm" variant="outline" className="border-zinc-200 text-zinc-600 hover:bg-zinc-50" onClick={() => updateWaitlistStatus(req.id, 'pending')}>Revert to Pending</Button>
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
                                <Card className="bg-[#FFFFFC] border-[#E6E4E0] shadow-[0_1px_3px_rgba(95,87,80,0.07)] border-t-4 border-t-[#C0B4A8]">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-[#2C2A28]"><UserX size={18} className="text-[#8F837A]" /> Deleted Archive</CardTitle>
                                        <CardDescription className="text-[#8F837A]">Accounts that have been permanently removed from active service.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader className="bg-zinc-50/50">
                                                <TableRow className="border-zinc-200 hover:bg-transparent">
                                                    <TableHead className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">User / Company</TableHead>
                                                    <TableHead className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Industry</TableHead>
                                                    <TableHead className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {deletedProfiles.length === 0 ? (
                                                    <TableRow className="border-zinc-800">
                                                        <TableCell colSpan={3} className="text-center h-24 text-zinc-500">Archive is empty.</TableCell>
                                                    </TableRow>
                                                ) : (
                                                    deletedProfiles.map(profile => (
                                                        <TableRow key={profile.id} className="border-zinc-100 opacity-60 bg-zinc-50/50">
                                                            <TableCell>
                                                                <div className="font-medium line-through text-zinc-500">{profile.full_name || 'N/A'}</div>
                                                                <div className="text-xs text-zinc-400 font-bold uppercase tracking-tighter">{profile.company_name || 'Unknown Co.'}</div>
                                                            </TableCell>
                                                            <TableCell className="text-zinc-400 text-xs font-mono">{profile.industry || 'Unknown'}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-zinc-200">Archived</Badge>
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
                    </TabsContent>
                    {/* DATA REPOSITORY TAB */}
                    <TabsContent value="data" className="space-y-6 outline-none">
                        <div className="mb-4">
                            <h2 className="font-serif text-xl tracking-tight text-[#2C2A28]">Knowledge Base</h2>
                            <p className="text-[13px] text-[#8F837A] mt-1">Upload Markdown files to expand the legal knowledge base used for compliance audits.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Upload Panel */}
                            <Card className="bg-[#FFFFFC] border-[#E6E4E0] shadow-[0_1px_3px_rgba(95,87,80,0.07)]">
                                <CardHeader className="pb-3 border-b border-[#E6E4E0]">
                                    <CardTitle className="text-[15px] font-medium text-[#2C2A28] flex items-center gap-2">
                                        <Upload size={16} className="text-[#606C5A]" />
                                        Upload Document
                                    </CardTitle>
                                    <CardDescription className="text-[12px] text-[#8F837A]">
                                        Upload a <code className="font-mono text-[11px] bg-[#F3F3F2] px-1 rounded">.md</code> file. It will be chunked, embedded with Gemini, and upserted to the pgvector knowledge base.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-5 space-y-5">
                                    {/* Tool Selection */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-medium text-[#2C2A28]">Target Tool Dashboard</label>
                                        <select
                                            value={uploadToolId}
                                            onChange={(e) => setUploadToolId(e.target.value)}
                                            className="w-full text-[13px] border border-[#E6E4E0] rounded-md px-3 py-2 bg-[#FFFFFC] focus:outline-none focus:ring-1 focus:ring-[#606C5A] text-[#2C2A28]"
                                        >
                                            {toolConfigs.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Drop target */}
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${mdFile ? 'border-[#606C5A] bg-[#ECF0E8]/30' : 'border-[#E6E4E0] bg-[#F3F3F2]/40 hover:border-[#C0B4A8]'}`}
                                        onClick={() => mdFileRef.current?.click()}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const f = e.dataTransfer.files[0];
                                            if (f && (f.name.endsWith('.md') || f.type === 'text/markdown')) {
                                                setMdFile(f);
                                                setIngestResult(null);
                                            } else {
                                                toast.error('Only Markdown (.md) files are supported.');
                                            }
                                        }}
                                    >
                                        <input
                                            ref={mdFileRef}
                                            type="file"
                                            accept=".md,text/markdown"
                                            className="hidden"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                if (f) { setMdFile(f); setIngestResult(null); }
                                            }}
                                        />
                                        <Database size={28} className={`mb-3 ${mdFile ? 'text-[#606C5A]' : 'text-[#C0B4A8]'}`} />
                                        {mdFile ? (
                                            <>
                                                <p className="text-[13px] font-medium text-[#2C2A28]">{mdFile.name}</p>
                                                <p className="text-[11px] text-[#8F837A] mt-1">{(mdFile.size / 1024).toFixed(1)} KB — Ready to ingest</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-[13px] font-medium text-[#5E5E5E]">Click or drag a Markdown file here</p>
                                                <p className="text-[11px] text-[#8F837A] mt-1">Supports .md files up to 5 MB</p>
                                            </>
                                        )}
                                    </div>

                                    {/* Result feedback */}
                                    {ingestResult && (
                                        <div className={`flex items-start gap-3 p-3 rounded-lg border text-[12px] ${ingestResult.success ? 'bg-[#ECF0E8] border-[#DCE4D5] text-[#606C5A]' : 'bg-[#F5ECEA] border-[#E8C4C0] text-[#8B4A42]'}`}>
                                            {ingestResult.success
                                                ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                                                : <XCircle size={15} className="mt-0.5 shrink-0" />}
                                            <span>
                                                {ingestResult.success
                                                    ? <><strong>{ingestResult.filename}</strong> ingested successfully — <strong>{ingestResult.chunks}</strong> chunks added to vector store.</>
                                                    : <>Failed to ingest <strong>{ingestResult.filename}</strong>. Check backend logs.</>}
                                            </span>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full bg-[#606C5A] hover:bg-[#4F5A4A] text-white gap-2"
                                        disabled={!mdFile || isIngesting}
                                        onClick={handleIngestMd}
                                    >
                                        {isIngesting ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                                        {isIngesting ? 'Ingesting…' : 'Ingest to Knowledge Base'}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Instructions panel */}
                            <Card className="bg-[#FBFAF5] border-[#E6E4E0] shadow-[0_1px_2px_rgba(95,87,80,0.04)]">
                                <CardHeader className="pb-3 border-b border-[#E6E4E0]">
                                    <CardTitle className="text-[15px] font-medium text-[#2C2A28] flex items-center gap-2">
                                        <FileText size={16} className="text-[#606C5A]" />
                                        How It Works
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-5 space-y-4 text-[12px] text-[#5E5E5E]">
                                    <div className="space-y-3">
                                        {[
                                            { step: '1', text: 'Upload a .md file containing legal text, Labour Code sections, or compliance guidance.' },
                                            { step: '2', text: 'The backend splits the file into ~500-word chunks for optimal retrieval granularity.' },
                                            { step: '3', text: 'Each chunk is embedded using Gemini Embeddings (768 dimensions) and upserted to the pgvector table.' },
                                            { step: '4', text: 'During audits, the vector search retrieves the top-5 most relevant chunks as legal context for the AI.' },
                                        ].map(item => (
                                            <div key={item.step} className="flex items-start gap-3">
                                                <span className="w-5 h-5 rounded-full bg-[#ECF0E8] text-[#606C5A] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{item.step}</span>
                                                <p className="leading-relaxed">{item.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-[#E6E4E0] pt-4 space-y-1">
                                        <p className="text-[11px] text-[#8F837A] font-semibold uppercase tracking-wider">Recommended Sources</p>
                                        <p className="text-[11px] text-[#8F837A]">Code on Wages 2019, OSHWC Code 2020, Industrial Relations Code 2020, Social Security Code 2020, applicable state rules, and EPFO/ESIC circulars.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* MANAGE DATABASE REPOSITORY SECTION */}
                        <div className="mt-8">
                            <div className="mb-4">
                                <h2 className="font-serif text-xl tracking-tight text-[#2C2A28]">Manage Database Repository</h2>
                                <p className="text-[13px] text-[#8F837A] mt-1">Review and manage active files in the knowledge base across all tools.</p>
                            </div>

                            <Card className="bg-[#FFFFFC] border-[#E6E4E0] shadow-[0_1px_3px_rgba(95,87,80,0.07)]">
                                <CardHeader className="pb-3 border-b border-[#E6E4E0]">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-[15px] font-medium text-[#2C2A28] flex items-center gap-2">
                                            <Database size={16} className="text-[#606C5A]" />
                                            Active Database Repository
                                        </CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-[12px] text-[#606C5A]"
                                            onClick={fetchKbFiles}
                                            disabled={isLoadingFiles}
                                        >
                                            {isLoadingFiles ? <Loader2 size={14} className="animate-spin mr-1" /> : <Activity size={14} className="mr-1" />}
                                            Refresh List
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-[#F9F9F8]">
                                            <TableRow className="border-[#E6E4E0]">
                                                <TableHead className="text-[11px] font-semibold text-[#8F837A] uppercase tracking-wider py-3 px-4">Tool Context</TableHead>
                                                <TableHead className="text-[11px] font-semibold text-[#8F837A] uppercase tracking-wider py-3">Filename</TableHead>
                                                <TableHead className="text-right text-[11px] font-semibold text-[#8F837A] uppercase tracking-wider py-3 px-4">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="text-[13px]">
                                            {isLoadingFiles ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center py-10">
                                                        <Loader2 size={24} className="animate-spin mx-auto text-[#C0B4A8] mb-2" />
                                                        <p className="text-[#8F837A]">Loading catalog...</p>
                                                    </TableCell>
                                                </TableRow>
                                            ) : kbFiles.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center py-10">
                                                        <Database size={24} className="mx-auto text-[#C0B4A8] mb-2" />
                                                        <p className="text-[#8F837A]">No files uploaded yet.</p>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                kbFiles.map((file, idx) => {
                                                    const tool = toolConfigs.find(t => t.id === file.tool_id);
                                                    return (
                                                        <TableRow key={`${file.tool_id}-${file.filename}-${idx}`} className="border-[#E6E4E0] hover:bg-[#F9F9F8]/50 transition-colors">
                                                            <TableCell className="py-4 px-4">
                                                                <Badge variant="outline" className="text-[10px] font-medium bg-[#ECF0E8] text-[#606C5A] border-none px-2 whitespace-nowrap">
                                                                    {tool?.name || file.tool_id}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="font-medium text-[#2C2A28]">
                                                                <div className="flex items-center gap-2">
                                                                    <FileText size={14} className="text-[#8F837A]" />
                                                                    {file.filename}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right py-4 px-4">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-[#8B4A42] hover:bg-[#F5ECEA] hover:text-[#8B4A42] rounded-md"
                                                                    onClick={() => setFileToDelete(file)}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>


                    </TabsContent>
                </div>
            </Tabs>

            {/* DELETION CONFIRMATION DIALOG */}
            <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
                <AlertDialogContent className="bg-[#FFFFFC] border-[#E6E4E0]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[#2C2A28] flex items-center gap-2">
                            <AlertTriangle className="text-[#8B4A42]" size={20} />
                            Confirm File Deletion
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[#5E5E5E]">
                            Are you sure you want to delete <strong className="text-[#2C2A28]">"{fileToDelete?.filename}"</strong> from the <strong className="text-[#2C2A28]">{toolConfigs.find(t => t.id === fileToDelete?.tool_id)?.name}</strong> knowledge base?
                            <br /><br />
                            This will remove all associated AI context chunks. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="border-[#E6E4E0] text-[#5E5E5E] hover:bg-[#F3F3F2]">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-[#8B4A42] hover:bg-[#7A3E38] text-white"
                            onClick={() => fileToDelete && handleDeleteKbFile(fileToDelete.tool_id, fileToDelete.filename)}
                        >
                            Delete File
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* TOOL ACTIVATION DIALOG */}
            <AlertDialog open={!!toolToActivate} onOpenChange={(open) => !open && setToolToActivate(null)}>
                <AlertDialogContent className="bg-[#FFFFFC] border-[#E6E4E0]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[#2C2A28] flex items-center gap-2">
                            <Zap className="text-[#606C5A]" size={20} />
                            Activate Tool?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[#5E5E5E]">
                            You've uploaded knowledge base data for <strong className="text-[#2C2A28]">"{toolConfigs.find(t => t.id === toolToActivate)?.name}"</strong> which is currently marked as "Coming Soon".
                            <br /><br />
                            Would you like to activate this tool and make it LIVE for all users now?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="border-[#E6E4E0] text-[#5E5E5E] hover:bg-[#F3F3F2]">Keep Coming Soon</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-[#606C5A] hover:bg-[#4F5A4A] text-white"
                            onClick={() => toolToActivate && activateTool(toolToActivate)}
                        >
                            Activate Now
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
