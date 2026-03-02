import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

interface Tool {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    status: 'active' | 'coming-soon';
    path?: string;
}

interface ComplianceHubPageProps {
    profile: any;
}

export const ComplianceHubPage: React.FC<ComplianceHubPageProps> = ({ profile }) => {
    const navigate = useNavigate();

    const tools: Tool[] = [
        {
            id: 'labour-audit',
            name: 'Labour Code Auditor',
            description: 'Audit employee policies against Indian Labour Codes 2025. Identify compliance gaps in seconds.',
            icon: <ShieldCheck className="w-8 h-8" />,
            status: 'active',
            path: '/audit',
        },
        {
            id: 'wage-compliance',
            name: 'Wage Compliance Checker',
            description: 'Verify wage structures, deductions, and payment compliance across all labour codes.',
            icon: <ShieldCheck className="w-8 h-8" />,
            status: 'coming-soon',
        },
        {
            id: 'social-security',
            name: 'Social Security & Benefits',
            description: 'Review employee benefits, PF, ESI, and gratuity compliance.',
            icon: <ShieldCheck className="w-8 h-8" />,
            status: 'coming-soon',
        },
        {
            id: 'workplace-safety',
            name: 'Workplace Safety & Health',
            description: 'Assess occupational safety protocols and working conditions compliance.',
            icon: <ShieldCheck className="w-8 h-8" />,
            status: 'coming-soon',
        },
        {
            id: 'ir-compliance',
            name: 'Industrial Relations',
            description: 'Check dispute resolution, collective bargaining, and employee relations policies.',
            icon: <ShieldCheck className="w-8 h-8" />,
            status: 'coming-soon',
        },
        {
            id: 'contract-review',
            name: 'Contract & Agreement Review',
            description: 'Review employment contracts, service agreements, and legal documents.',
            icon: <ShieldCheck className="w-8 h-8" />,
            status: 'coming-soon',
        },
    ];

    const handleToolClick = (tool: Tool) => {
        if (tool.status === 'active' && tool.path) {
            navigate(tool.path);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                    <Card
                        key={tool.id}
                        className={`relative transition-all duration-300 ${tool.status === 'active'
                            ? 'cursor-pointer hover:shadow-lg hover:border-[#606C5A]'
                            : 'opacity-60'
                            }`}
                        onClick={() => handleToolClick(tool)}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="text-[#606C5A]">{tool.icon}</div>
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg">{tool.name}</CardTitle>
                                    </div>
                                </div>
                                {tool.status === 'coming-soon' && (
                                    <Badge variant="outline" className="ml-2 shrink-0">
                                        Coming Soon
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <CardDescription className="text-sm leading-relaxed">
                                {tool.description}
                            </CardDescription>

                            {tool.status === 'active' && (
                                <Button
                                    variant="default"
                                    className="w-full gap-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToolClick(tool);
                                    }}
                                >
                                    Access Tool
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            )}

                            {tool.status === 'coming-soon' && (
                                <Button variant="outline" className="w-full" disabled>
                                    Available Soon
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

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
