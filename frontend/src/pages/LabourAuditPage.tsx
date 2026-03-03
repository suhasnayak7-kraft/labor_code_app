import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, ShieldCheck, FileText, Download, Eye, Zap, Activity, ArrowLeft } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { TextLoop } from '../components/ui/text-loop';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';

interface ApiLog {
    id: number;
    created_at: string;
    endpoint: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    filename?: string | null;
    compliance_score?: number | null;
    findings?: string[] | null;
}

interface LabourAuditPageProps {
    session: any;
    profile: any;
    apiUrl: string;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB backend limit

export const LabourAuditPage: React.FC<LabourAuditPageProps> = ({ session, profile, apiUrl }) => {
    const navigate = useNavigate();

    // Audit state
    const [file, setFile] = useState<File | null>(null);
    const [isAuditing, setIsAuditing] = useState(false);
    const [result, setResult] = useState<{ compliance_score: number; findings: string[] } | null>(null);
    const [scanProgress, setScanProgress] = useState(0);
    const [auditStatus, setAuditStatus] = useState<{ usage_today: number; daily_limit: number; remaining: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // History state
    const [logs, setLogs] = useState<ApiLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    // Fetch audit status and logs on mount
    useEffect(() => {
        fetchAuditStatus();
        fetchLogs();
    }, [session]);

    const fetchAuditStatus = async () => {
        if (!session?.access_token) return;
        try {
            const resp = await fetch(`${apiUrl}/audit/status`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            if (resp.ok) setAuditStatus(await resp.json());
        } catch (err) {
            console.error("Failed to fetch audit status", err);
        }
    };

    const fetchLogs = async () => {
        if (!session?.access_token) return;
        if (logs.length === 0) {
            setLogsLoading(true);
        }
        try {
            const response = await fetch(`${apiUrl}/logs`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
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
        setLogsLoading(false);
    };

    const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile?.type === 'application/pdf' || droppedFile?.name.endsWith('.docx')) {
            if (droppedFile.size > MAX_FILE_SIZE) {
                toast.error("File is too large (> 20MB).");
            } else {
                setFile(droppedFile);
            }
        } else {
            toast.error("Please upload a PDF or Word (.docx) file.");
        }
    };

    const handleAudit = async () => {
        if (!file) return;
        setIsAuditing(true);
        setResult(null);
        setScanProgress(0);

        const progressInterval = setInterval(() => {
            setScanProgress((p: number) => (p >= 90 ? 90 : p + 5));
        }, 2000);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('model_id', 'gemini-1.5-flash');
        formData.append('tool_id', 'labour-audit');

        // Check if dev environment to use local endpoint or deployed endpoint
        const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '/api');

        try {
            const response = await fetch(`${apiUrl}/audit`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}` },
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || "Audit failed.");

            clearInterval(progressInterval);
            setScanProgress(100);

            setTimeout(() => {
                setResult(data);
                setIsAuditing(false);
                fetchAuditStatus();
                fetchLogs(); // Refresh logs after audit
            }, 800);

        } catch (err: any) {
            clearInterval(progressInterval);
            toast.error(err.message);
            setIsAuditing(false);
        }
    };

    const handleDownloadReport = () => {
        if (!result || !file) return;
        const score = result.compliance_score;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`
      <html>
        <head>
          <title>Compliance Audit Report - ${file.name}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #606C5A; margin-bottom: 30px; padding-bottom: 10px; }
            .score { font-size: 48px; font-weight: bold; color: ${score >= 80 ? '#606C5A' : '#8B4A42'}; }
            .finding { margin-bottom: 15px; border-left: 4px solid #eee; padding-left: 15px; }
          </style>
        </head>
        <body>
          <div class="header"><h1>Labour Code Compliance Audit</h1></div>
          <div class="score">Score: ${score}/100</div>
          <h2>Document: ${file.name}</h2>
          <h3>Findings:</h3>
          ${result.findings.map((f: string) => `<div class="finding">${f}</div>`).join('')}
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

    const downloadPDFReport = (log: ApiLog) => {
        const doc = new jsPDF();
        const score = log.compliance_score ?? 50;
        const date = new Date(log.created_at).toLocaleDateString('en-IN');

        const isBranded = profile?.branding_enabled && profile?.company_logo;

        // Header Background
        doc.setFillColor(isBranded ? 255 : 24, isBranded ? 255 : 24, isBranded ? 255 : 27);
        doc.rect(0, 0, 210, 40, 'F');

        if (isBranded) {
            // Apply Custom Branding Logo
            try {
                // Approximate sizing, placing the logo top-left
                doc.addImage(profile.company_logo, 'PNG', 15, 10, 40, 20, undefined, 'FAST');
                doc.setTextColor(30, 30, 30);
                doc.setFontSize(22);
                doc.text("Compliance Report", 60, 25);
            } catch (e) {
                console.error("Failed to load branding logo for PDF", e);
                // Fallback to default header if image fails to load
                doc.setFillColor(24, 24, 27);
                doc.rect(0, 0, 210, 40, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22);
                doc.text("🛡️ AuditAI Compliance Report", 15, 25);
                doc.setFontSize(10);
                doc.text("Indian Labour Code Compliance Platform", 15, 32);
            }
        } else {
            // Default Header
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text("🛡️ AuditAI Compliance Report", 15, 25);
            doc.setFontSize(10);
            doc.text("Indian Labour Code Compliance Platform", 15, 32);
        }

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
            body: log.findings ? log.findings.map((f: string, i: number) => [i + 1, f.replace(/\*\*/g, '')]) : [['-', 'No findings available']],
            theme: 'striped',
            headStyles: { fillColor: [24, 24, 27] },
            styles: { fontSize: 9, cellPadding: 5 },
            margin: { bottom: 30 }
        });

        // AI Legal Disclaimer at the bottom
        const finalY = (doc as any).lastAutoTable.finalY || 200;

        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(150, 150, 150);

        const disclaimerText = "Disclaimer: This document is generated by an Artificial Intelligence model (Gemini 2.5 Flash) and is provided for informational and preliminary audit purposes only. It DOES NOT constitute formal legal advice. Please have your legal team or a qualified practitioner verify these findings before taking organizational action.";

        const splitDisclaimer = doc.splitTextToSize(disclaimerText, 180);

        // Check if we need a new page for the disclaimer
        if (finalY + 20 > 280) {
            doc.addPage();
            doc.text(splitDisclaimer, 15, 20);
        } else {
            doc.text(splitDisclaimer, 15, finalY + 15);
        }

        doc.save(`audit-report-${log.filename}.pdf`);
    };

    return (
        <div className="space-y-8">
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

            {/* Tabs for Audit vs History */}
            <Tabs defaultValue="audit" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="audit" className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Run Audit
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Audit History
                    </TabsTrigger>
                </TabsList>

                {/* Audit Tab */}
                <TabsContent value="audit" className="space-y-6 mt-6">
                    <div className="max-w-[800px] mx-auto bg-white p-8 md:p-12 rounded-lg shadow-[0_1px_3px_rgba(95,87,80,0.07)] border border-[#E6E4E0] fade-in">
                        <AnimatePresence mode="wait">
                            {!isAuditing && !result && (
                                <div className="space-y-8 fade-in">
                                    <div className="text-center space-y-3 mb-10">
                                        <h1 className="font-serif text-4xl tracking-tight text-[#2C2A28]">Labour Code Auditor</h1>
                                        <p className="text-[14px] text-[#5E5E5E]">Identify compliance risks against 2025 Labour Regulations.</p>
                                    </div>
                                    <Card className="border-2 border-dashed border-zinc-200" onDragOver={e => e.preventDefault()} onDrop={handleFileDrop} onClick={() => fileInputRef.current?.click()}>
                                        <CardContent className="p-10 text-center">
                                            <input type="file" accept=".pdf,.docx" className="hidden" ref={fileInputRef} onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
                                            <UploadCloud className="w-8 h-8 mx-auto text-[#606C5A] mb-4" />
                                            <h3 className="text-lg font-semibold">{file ? file.name : "Drop PDF or Word file here"}</h3>
                                            <Progress value={file ? 100 : 0} className="h-1 mt-4" />
                                            <Button className="mt-6 w-full max-w-sm" disabled={!file || (auditStatus?.remaining === 0 && profile?.role !== 'admin')} onClick={e => { e.stopPropagation(); handleAudit(); }}>
                                                Run Audit
                                            </Button>
                                            {auditStatus && (
                                                <p className="text-xs text-zinc-500 mt-4">
                                                    Daily limit: {auditStatus.usage_today} / {auditStatus.daily_limit} audits used
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {isAuditing && (
                                <div className="py-20 flex flex-col items-center">
                                    <ShieldCheck className="w-12 h-12 text-[#606C5A] mb-8" />
                                    <div className="text-zinc-500 font-medium h-6">
                                        <TextLoop>
                                            <span>Analyzing Indian Labour Laws...</span>
                                            <span>Identifying Risk Factors...</span>
                                            <span>Finalizing Report...</span>
                                        </TextLoop>
                                    </div>
                                    <Progress value={scanProgress} className="h-2 w-full max-w-md mt-8" />
                                </div>
                            )}

                            {result && (
                                <div className="space-y-6 fade-in">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-2xl font-bold">Audit Results</h2>
                                        <Button variant="outline" size="sm" onClick={handleDownloadReport}><Download className="w-4 h-4 mr-2" /> Download</Button>
                                    </div>
                                    <Card>
                                        <CardHeader><CardTitle>Compliance Score</CardTitle></CardHeader>
                                        <CardContent className="text-center">
                                            <div className={`text-6xl font-black ${result.compliance_score >= 80 ? 'text-[#606C5A]' : 'text-[#8B4A42]'}`}>{result.compliance_score}</div>
                                        </CardContent>
                                    </Card>
                                    <div className="space-y-4">
                                        {result.findings.map((f: string, i: number) => (
                                            <Alert key={i}>
                                                <FileText className="h-4 w-4" />
                                                <AlertTitle>Finding {i + 1}</AlertTitle>
                                                <AlertDescription>{f}</AlertDescription>
                                            </Alert>
                                        ))}
                                    </div>
                                    <Button className="w-full" variant="outline" onClick={() => { setResult(null); setFile(null); fetchLogs(); }}>Audit Another</Button>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-6 mt-6">
                    <Card className="border-zinc-200 shadow-sm">
                        <CardHeader>
                            <CardTitle>Audit History & Compliance Records</CardTitle>
                            <CardDescription>View and download all your compliance audit reports.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader className="bg-zinc-50/50">
                                    <TableRow>
                                        <TableHead className="w-[180px]">Timestamp</TableHead>
                                        <TableHead>Filename</TableHead>
                                        <TableHead className="text-center">Compliance Score</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logsLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24 text-zinc-500">Loading history...</TableCell>
                                        </TableRow>
                                    ) : logs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24 text-zinc-500">No audit logs found. Run your first audit to get started!</TableCell>
                                        </TableRow>
                                    ) : (
                                        [...logs].reverse().map((log) => (
                                            <React.Fragment key={log.id}>
                                                <TableRow className="cursor-pointer hover:bg-zinc-50 transition-colors">
                                                    <TableCell className="font-medium text-zinc-600">
                                                        {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {log.filename || "Unknown Document"}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {log.compliance_score !== null && log.compliance_score !== undefined ? (
                                                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${log.compliance_score >= 80 ? 'bg-[#ECF0E8] text-[#606C5A]' :
                                                                log.compliance_score >= 50 ? 'bg-[#F8F0DE] text-[#7A6020]' : 'bg-[#F5ECEA] text-[#8B4A42]'
                                                                }`}>
                                                                {log.compliance_score}
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
                                                                                <div className={`text-4xl font-black ${log.compliance_score ?? 50 >= 80 ? 'text-[#606C5A]' : log.compliance_score ?? 50 >= 50 ? 'text-[#A68B2C]' : 'text-[#8B4A42]'}`}>
                                                                                    {log.compliance_score ?? 50}
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <Badge variant="outline" className="px-3 py-1">
                                                                                    {log.compliance_score ?? 50 >= 80 ? 'Compliant' : log.compliance_score ?? 50 >= 50 ? 'Moderate Risk' : 'Critical'}
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
                                                                                    {log.findings.map((finding: string, idx: number) => (
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
                                                                onClick={() => downloadPDFReport(log)}
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </Button>

                                                            {profile?.role === 'admin' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0"
                                                                    title="Token Usage"
                                                                    onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                                                                >
                                                                    <Zap className={`h-4 w-4 ${expandedRow === log.id ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>

                                                {expandedRow === log.id && (
                                                    <TableRow className="bg-[#FBFAF5] hover:bg-[#FBFAF5]">
                                                        <TableCell colSpan={4} className="p-0 border-b-0">
                                                            <div className="px-6 py-4 grid grid-cols-3 max-w-md gap-4 border-l-4 border-l-[#606C5A]">
                                                                <div>
                                                                    <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Prompt Tokens</div>
                                                                    <div className="text-sm font-semibold">{log.prompt_tokens.toLocaleString()}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Completion Tokens</div>
                                                                    <div className="text-sm font-semibold">{log.completion_tokens.toLocaleString()}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Total Tokens</div>
                                                                    <div className="text-sm font-semibold">{log.total_tokens.toLocaleString()}</div>
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
                </TabsContent>
            </Tabs>
        </div>
    );
};
