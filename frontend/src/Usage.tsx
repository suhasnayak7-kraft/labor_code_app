import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ApiLog {
    id: number;
    created_at: string;
    endpoint: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    filename?: string | null;
    risk_score?: number | null;
}

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '/api');

export function UsageDashboard({ token, dailyLimit }: { token?: string, dailyLimit?: number }) {
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
            {/* Row 1: Top Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
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
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estimated Session Cost</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight text-emerald-600">${estimatedCost.toFixed(5)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Based on Gemini Flash pricing</p>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Area Chart */}
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
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Line
                                    type="monotone"
                                    dataKey="tokens"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6, fill: '#059669', stroke: '#fff' }}
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
                                <TableHead className="text-center">Risk Score</TableHead>
                                <TableHead className="text-right">Total Tokens</TableHead>
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
                                                    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${log.risk_score > 70 ? 'bg-red-100 text-red-800' :
                                                        log.risk_score > 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-emerald-100 text-emerald-800'
                                                        }`}>
                                                        {log.risk_score}
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-zinc-900">
                                                {log.total_tokens.toLocaleString()}
                                            </TableCell>
                                        </TableRow>

                                        {/* Expandable Breakdown Row */}
                                        {expandedRow === log.id && (
                                            <TableRow className="bg-zinc-50 hover:bg-zinc-50">
                                                <TableCell colSpan={4} className="p-0 border-b-0">
                                                    <div className="px-6 py-4 grid grid-cols-2 max-w-sm gap-4 border-l-4 border-l-emerald-500">
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
