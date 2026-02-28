import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from './components/ui/badge';
import { Eye, Download, FileText, Zap, ShieldCheck } from 'lucide-react';
import { Button } from './components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/ui/accordion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ApiLog {
    id: number;
    created_at: string;
    endpoint: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    filename?: string | null;
    risk_score?: number | null;
    findings?: string[] | null;
}

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '/api');

export function UsageDashboard({ token, dailyLimit, role }: { token?: string, dailyLimit?: number, role?: string }) {
    const [logs, setLogs] = useState<ApiLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    useEffect(() => {
        async function fetchLogs() {
            if (!token) return;
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/logs`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setLogs(data);
                } else {
                    console.error("Failed to fetch logs from backend", response.status);
                }
            } catch (error) {
                console.error("Backend fetch error:", error);
            }
            setLoading(false);
        }
        fetchLogs();
    }, []);

    // Format data for Recharts AreaChart
    const chartData = logs.map((log) => ({
        time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tokens: log.total_tokens,
    }));

    const totalTokensUsed = logs.reduce((acc, log) => acc + log.total_tokens, 0);
    // Rough estimation for Gemini 2.5 Flash pricing: $0.075 / 1M Input Tokens, $0.30 / 1M Output Tokens
    // For simplicity of display, we'll blend it to an estimated $0.10 per 1M total tokens
    const estimatedCost = (totalTokensUsed / 1000000) * 0.10;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <p className="text-xs text-zinc-500 flex items-center gap-1.5 px-1">
                    <span>📝 Reports are automatically deleted after 7 days for your privacy.</span>
                </p>
            </div>

            {/* Row 1: Top Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Public Metric: Audits Today */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Audits Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight">
                            {logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length}
                            <span className="text-zinc-400 text-xl font-medium"> / {dailyLimit || '-'}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Daily quota remaining</p>
                    </CardContent>
                </Card>

                {/* Admin Only Metrics */}
                {role === 'admin' && (
                    <>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Tokens Consumed</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold tracking-tight">{totalTokensUsed.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-1">Across all API requests</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Estimated Session Cost</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold tracking-tight text-[#606C5A]">${estimatedCost.toFixed(5)}</div>
                                <p className="text-xs text-muted-foreground mt-1">Based on Gemini Flash pricing</p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Row 2: Area Chart (Admin Only) */}
            {role === 'admin' && (
                <Card className="border-zinc-200 shadow-sm">
                    <CardHeader>
                        <CardTitle>Token Usage Trends</CardTitle>
                        <CardDescription>Daily token consumption volume.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-zinc-500">Loading chart data...</div>
                        ) : logs.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-zinc-500">No data available yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#606C5A" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#606C5A" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Line
                                        type="monotone"
                                        dataKey="tokens"
                                        stroke="#606C5A"
                                        strokeWidth={2.5}
                                        dot={{ r: 4, fill: '#606C5A', strokeWidth: 2, stroke: '#FFFFFC' }}
                                        activeDot={{ r: 6, fill: '#4F5A4A', stroke: '#FFFFFC' }}
                                    />
                                    <CartesianGrid stroke="#f4f4f5" strokeDasharray="5 5" vertical={false} />
                                    <XAxis dataKey="time" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#18181b', fontWeight: 'bold' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Row 3: History Vault Vault */}
            <Card className="border-zinc-200 shadow-sm">
                <CardHeader>
                    <CardTitle>Recent Audit History</CardTitle>
                    <CardDescription>Click on any row to view token consumption breakdown.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader className="bg-zinc-50/50">
                            <TableRow>
                                <TableHead className="w-[180px]">Timestamp</TableHead>
                                <TableHead>Filename</TableHead>
                                <TableHead className="text-center">Compliance Score</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-zinc-500">Loading history...</TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-zinc-500">No audit logs found.</TableCell>
                                </TableRow>
                            ) : (
                                [...logs].reverse().map((log) => (
                                    <React.Fragment key={log.id}>
                                        <TableRow
                                            className="cursor-pointer hover:bg-zinc-50 transition-colors"
                                            onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                                        >
                                            <TableCell className="font-medium text-zinc-600">
                                                {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {log.filename || "Unknown Document"}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {log.risk_score !== null && log.risk_score !== undefined ? (
                                                    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${100 - log.risk_score >= 70 ? 'bg-[#ECF0E8] text-[#606C5A]' :
                                                        100 - log.risk_score >= 50 ? 'bg-[#F8F0DE] text-[#7A6020]' : 'bg-[#F5ECEA] text-[#8B4A42]'
                                                        }`}>
                                                        {100 - log.risk_score}
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Report">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                                            <DialogHeader>
                                                                <DialogTitle className="flex items-center gap-2">
                                                                    <ShieldCheck className="w-5 h-5 text-zinc-900" />
                                                                    Compliance Audit Report
                                                                </DialogTitle>
                                                                <CardDescription>
                                                                    {log.filename} • {new Date(log.created_at).toLocaleDateString()}
                                                                </CardDescription>
                                                            </DialogHeader>
                                                            <div className="space-y-6 pt-4">
                                                                <div className="flex items-center justify-between p-4 bg-[#F3F3F2] rounded-lg border border-[#E6E4E0]">
                                                                    <div>
                                                                        <div className="text-xs font-medium text-[#8F837A] uppercase">Compliance Score</div>
                                                                        <div className={`text-4xl font-black ${100 - (log.risk_score ?? 100) >= 70 ? 'text-[#606C5A]' : 100 - (log.risk_score ?? 100) >= 50 ? 'text-[#A68B2C]' : 'text-[#8B4A42]'}`}>
                                                                            {100 - (log.risk_score ?? 100)}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <Badge variant="outline" className="px-3 py-1">
                                                                            {100 - (log.risk_score ?? 100) >= 90 ? 'Likely Compliant' : 100 - (log.risk_score ?? 100) >= 70 ? 'Moderate Risk' : 100 - (log.risk_score ?? 100) >= 50 ? 'Significant Gaps' : 'Critical Non-Compliance'}
                                                                        </Badge>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-3">
                                                                    <h3 className="font-bold flex items-center gap-2 text-sm text-zinc-700">
                                                                        <FileText className="w-4 h-4" />
                                                                        Detailed Findings
                                                                    </h3>
                                                                    {log.findings && log.findings.length > 0 ? (
                                                                        <Accordion type="single" collapsible className="w-full">
                                                                            {log.findings.map((finding, idx) => (
                                                                                <AccordionItem key={idx} value={`finding-${idx}`}>
                                                                                    <AccordionTrigger className="text-left text-xs font-medium hover:no-underline">{finding.split('.')[0]}.</AccordionTrigger>
                                                                                    <AccordionContent className="text-xs text-zinc-600 leading-relaxed">
                                                                                        {finding}
                                                                                    </AccordionContent>
                                                                                </AccordionItem>
                                                                            ))}
                                                                        </Accordion>
                                                                    ) : (
                                                                        <p className="text-xs text-zinc-400 italic">No detailed findings stored for this audit.</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        title="Download PDF"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const doc = new jsPDF();
                                                            const score = 100 - (log.risk_score ?? 0);
                                                            const date = new Date(log.created_at).toLocaleDateString('en-IN');

                                                            // Branded Header
                                                            doc.setFillColor(24, 24, 27); // Dark zinc
                                                            doc.rect(0, 0, 210, 40, 'F');
                                                            doc.setTextColor(255, 255, 255);
                                                            doc.setFontSize(22);
                                                            doc.text("🛡️ AuditAI Compliance Report", 15, 25);
                                                            doc.setFontSize(10);
                                                            doc.text("Indian Labour Code Compliance Platform", 15, 32);

                                                            // Meta Info
                                                            doc.setTextColor(24, 24, 27);
                                                            doc.setFontSize(10);
                                                            doc.setFont("helvetica", "bold");
                                                            doc.text("Document:", 15, 55);
                                                            doc.setFont("helvetica", "normal");
                                                            doc.text(log.filename || "Unknown", 40, 55);

                                                            doc.setFont("helvetica", "bold");
                                                            doc.text("Audit Date:", 15, 62);
                                                            doc.setFont("helvetica", "normal");
                                                            doc.text(date, 40, 62);

                                                            doc.setFont("helvetica", "bold");
                                                            doc.text("Jurisdiction:", 15, 69);
                                                            doc.setFont("helvetica", "normal");
                                                            doc.text("Republic of India (Labour Codes 2025)", 40, 69);

                                                            // Score Box
                                                            doc.setDrawColor(228, 228, 231);
                                                            doc.setFillColor(score >= 80 ? 240 : score >= 50 ? 254 : 254, score >= 80 ? 253 : score >= 50 ? 252 : 242, score >= 80 ? 244 : score >= 50 ? 232 : 242);
                                                            doc.roundedRect(15, 80, 180, 40, 3, 3, 'FD');

                                                            doc.setTextColor(score >= 80 ? 5 : score >= 50 ? 202 : 220, score >= 80 ? 150 : score >= 50 ? 138 : 38, score >= 80 ? 105 : score >= 50 ? 4 : 38);
                                                            doc.setFontSize(48);
                                                            doc.setFont("helvetica", "bold");
                                                            doc.text(score.toString(), 30, 110);

                                                            doc.setFontSize(14);
                                                            const status = score >= 80 ? 'COMPLIANT' : score >= 50 ? 'MODERATE RISK' : 'CRITICAL NON-COMPLIANCE';
                                                            doc.text(status, 65, 100);
                                                            doc.setFontSize(10);
                                                            doc.setFont("helvetica", "normal");
                                                            doc.setTextColor(113, 113, 122);
                                                            doc.text("Overall Compliance Stability Score", 65, 108);

                                                            // Findings Table
                                                            doc.setTextColor(24, 24, 27);
                                                            doc.setFontSize(12);
                                                            doc.setFont("helvetica", "bold");
                                                            doc.text("DETAILED AUDIT FINDINGS", 15, 140);

                                                            autoTable(doc, {
                                                                startY: 145,
                                                                head: [['#', 'Finding Details']],
                                                                body: log.findings ? log.findings.map((f, i) => [i + 1, f]) : [['-', 'No findings available']],
                                                                theme: 'striped',
                                                                headStyles: { fillColor: [24, 24, 27] },
                                                                styles: { fontSize: 9, cellPadding: 5 }
                                                            });

                                                            doc.save(`audit-report-${log.filename}.pdf`);
                                                        }}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>

                                                    {role === 'admin' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            title="Token Usage"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setExpandedRow(expandedRow === log.id ? null : log.id);
                                                            }}
                                                        >
                                                            <Zap className={`h-4 w-4 ${expandedRow === log.id ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {/* Expandable Breakdown Row */}
                                        {expandedRow === log.id && (
                                            <TableRow className="bg-[#FBFAF5] hover:bg-[#FBFAF5]">
                                                <TableCell colSpan={4} className="p-0 border-b-0">
                                                    <div className="px-6 py-4 grid grid-cols-2 max-w-sm gap-4 border-l-4 border-l-[#606C5A]">
                                                        <div>
                                                            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Prompt Tokens</div>
                                                            <div className="text-sm font-semibold">{log.prompt_tokens.toLocaleString()} <span className="text-zinc-400 font-normal">tokens</span></div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Completion Tokens</div>
                                                            <div className="text-sm font-semibold">{log.completion_tokens.toLocaleString()} <span className="text-zinc-400 font-normal">tokens</span></div>
                                                        </div>
                                                    </div>
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
        </div>
    );
}
