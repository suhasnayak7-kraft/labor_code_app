import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, FileText, FileCheck, Calculator, FolderOpen, CalendarDays, AlertTriangle, TrendingUp, Shield, Zap, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';


interface ComplianceHubPageProps {
    profile: any;
}

export const ComplianceHubPage: React.FC<ComplianceHubPageProps> = ({ profile }) => {
    const navigate = useNavigate();
    const [tools, setTools] = React.useState<any[]>([]);
    const [hasDataTools, setHasDataTools] = React.useState<Set<string>>(new Set());
    const [loading, setLoading] = React.useState(true);

    const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN';

    // Same icon map as AdminPage
    const toolIconMap: Record<string, React.ReactNode> = {
        'FileText': <FileText className="w-8 h-8" />,
        'FileCheck': <FileCheck className="w-8 h-8" />,
        'Calculator': <Calculator className="w-8 h-8" />,
        'FolderOpen': <FolderOpen className="w-8 h-8" />,
        'CalendarDays': <CalendarDays className="w-8 h-8" />,
        'AlertTriangle': <AlertTriangle className="w-8 h-8" />,
        'TrendingUp': <TrendingUp className="w-8 h-8" />,
        'Shield': <Shield className="w-8 h-8" />,
        'Gavel': <Zap className="w-8 h-8" />,
    };

    React.useEffect(() => {
        const fetchData = async () => {
            if (tools.length === 0) {
                setLoading(true);
            }
            try {
                // 1. Fetch tools
                const { data: toolsData, error: toolsError } = await supabase
                    .from('tool_config')
                    .select('*')
                    .order('sort_order', { ascending: true });

                if (toolsError) throw toolsError;

                // 2. Fetch distinct tool_ids from labour_laws to check for verified data
                const { data: lawsData, error: lawsError } = await supabase
                    .from('labour_laws')
                    .select('tool_id');

                if (lawsError) throw lawsError;

                if (lawsData) {
                    const toolIdsWithData = new Set(lawsData.map((row: any) => row.tool_id));
                    setHasDataTools(toolIdsWithData);
                }

                if (toolsData) {
                    const planTierMap: Record<string, number> = {
                        'free': 1,
                        'pro': 2,
                        'max': 3
                    };
                    const userTier = planTierMap[profile?.plan?.toLowerCase()] || 1;

                    const filtered = isAdmin
                        ? toolsData
                        : toolsData.filter(t => t.status === 'live' && t.tier <= userTier);

                    setTools(filtered);
                }
            } catch (e) {
                console.error("Error fetching tools:", e);
                toast.error("Failed to load tools repository.");
            }
            setLoading(false);
        };

        fetchData();
    }, [profile, isAdmin]);

    const handleToolClick = (tool: any) => {
        // Only labour-audit has a specialized page for now
        if (tool.id === 'labour-audit') {
            navigate('/audit');
        } else {
            // General placeholder for other tools
            toast.info(`The specialized assistant for "${tool.name}" is being finalized, but the standard auditor is active.`);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-[#2C2A28]">Compliance Hub</h1>
                <p className="text-lg text-[#5E5E5E]">Access all compliance tools and auditing features for Indian Labour Code compliance.</p>
            </div>

            {/* Tools Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#606C5A]" />
                    <p className="text-[#8F837A] font-medium">Loading your tools...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tools.map((tool) => {
                        const isLive = tool.status === 'live';
                        const isAccessible = isLive || isAdmin;

                        return (
                            <Card
                                key={tool.id}
                                className={`relative transition-all duration-300 border-[#E6E4E0] flex flex-col ${isAccessible
                                    ? 'cursor-pointer hover:shadow-lg hover:border-[#606C5A]'
                                    : 'opacity-60 grayscale-[0.5]'
                                    }`}
                                onClick={() => handleToolClick(tool)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-[#ECF0E8] rounded-xl text-[#606C5A] border border-[#DCE4D5] shadow-sm">
                                                {toolIconMap[tool.icon] || <ShieldCheck className="w-8 h-8" />}
                                            </div>
                                            <CardTitle className="text-xl font-serif text-[#2C2A28] leading-tight">
                                                {tool.name}
                                                {isAdmin && (
                                                    <Badge className="ml-2 bg-[#4E7A94]/10 text-[#4E7A94] border-[#4E7A94]/20 text-[9px] uppercase tracking-tighter align-middle">
                                                        Admin Access
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                        </div>
                                        {hasDataTools.has(tool.id) ? (
                                            <Badge variant="outline" className="bg-[#ECF0E8] text-[#606C5A] border-[#DCE4D5] text-[10px] uppercase font-bold tracking-wider animate-pulse-subtle">
                                                Verified Dataset
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-[#4E7A94]/10 text-[#4E7A94] border-[#4E7A94]/20 text-[10px] uppercase font-bold tracking-wider">
                                                Early Access
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-1 flex flex-col space-y-6 pt-0">
                                    <CardDescription className="text-[13px] text-[#5E5E5E] leading-relaxed">
                                        {tool.description}
                                    </CardDescription>

                                    <div className="mt-auto">
                                        {isAccessible ? (
                                            <Button
                                                variant="default"
                                                className="w-full gap-2 bg-[#606C5A] hover:bg-[#4A5446] text-white shadow-sm transition-all active:scale-[0.98]"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToolClick(tool);
                                                }}
                                            >
                                                Access Tool
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        ) : (
                                            <Button variant="outline" className="w-full border-[#E6E4E0] text-[#8F837A]" disabled>
                                                Coming Soon
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Plan Info Section */}
            <Card className="bg-gradient-to-r from-[#ECF0E8] to-[#F3F3F2] border-[#E6E4E0]">
                <CardHeader>
                    <CardTitle>Your Current Plan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <div className="text-xs font-semibold text-[#8F837A] uppercase tracking-wider mb-2">
                                Plan Type
                            </div>
                            <div className="text-2xl font-bold text-[#2C2A28]">
                                {profile?.plan ? profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1) : 'Free'}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-[#8F837A] uppercase tracking-wider mb-2">
                                Daily Audits
                            </div>
                            <div className="text-2xl font-bold text-[#2C2A28]">
                                {profile?.daily_audit_limit || 3}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-[#8F837A] uppercase tracking-wider mb-2">
                                Status
                            </div>
                            <div className="text-2xl font-bold text-[#606C5A]">
                                Active
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
