import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, ShieldCheck, FileText, Download } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { TextLoop } from '../components/ui/text-loop';
import { toast } from 'sonner';

/**
 * AuditorPage
 * 
 * The primary interface for performing AI-powered compliance audits of Labour Code policies.
 */
interface AuditorPageProps {
    session: any;
    profile: any;
    apiUrl: string;
}

export const AuditorPage: React.FC<AuditorPageProps> = ({ session, profile, apiUrl }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isAuditing, setIsAuditing] = useState(false);
    const [result, setResult] = useState<{ compliance_score: number; findings: string[] } | null>(null);
    const [scanProgress, setScanProgress] = useState(0);
    const [auditStatus, setAuditStatus] = useState<{ usage_today: number; daily_limit: number; remaining: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB Serverless limit

    useEffect(() => {
        fetchAuditStatus();
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

    const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile?.type === 'application/pdf') {
            if (droppedFile.size > MAX_FILE_SIZE) {
                toast.error("File is too large (> 4.5MB).");
            } else {
                setFile(droppedFile);
            }
        } else {
            toast.error("Please upload a PDF file.");
        }
    };

    const handleAudit = async () => {
        if (!file) return;
        setIsAuditing(true);
        setResult(null);
        setScanProgress(0);

        const progressInterval = setInterval(() => {
            setScanProgress(p => (p >= 90 ? 90 : p + 5));
        }, 2000);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('model_id', 'gemini-1.5-pro');

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
          ${result.findings.map(f => `<div class="finding">${f}</div>`).join('')}
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="max-w-[800px] mx-auto bg-white p-8 md:p-12 rounded-lg shadow-[0_1px_3px_rgba(95,87,80,0.07)] border border-[#E6E4E0] my-4 fade-in">
            <AnimatePresence mode="wait">
                {!isAuditing && !result && (
                    <div className="space-y-8 fade-in">
                        <div className="text-center space-y-3 mb-10">
                            <h1 className="font-serif text-4xl tracking-tight text-[#2C2A28]">Labour Code Auditor</h1>
                            <p className="text-[14px] text-[#5E5E5E]">Identify compliance risks against 2025 Labour Regulations.</p>
                        </div>
                        <Card className="border-2 border-dashed border-zinc-200" onDragOver={e => e.preventDefault()} onDrop={handleFileDrop} onClick={() => fileInputRef.current?.click()}>
                            <CardContent className="p-10 text-center">
                                <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
                                <UploadCloud className="w-8 h-8 mx-auto text-[#606C5A] mb-4" />
                                <h3 className="text-lg font-semibold">{file ? file.name : "Drop PDF here"}</h3>
                                <Progress value={file ? 100 : 0} className="h-1 mt-4" />
                                <Button className="mt-6 w-full max-w-sm" disabled={!file || (auditStatus?.remaining === 0 && profile?.role !== 'admin')} onClick={e => { e.stopPropagation(); handleAudit(); }}>
                                    Run Audit
                                </Button>
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
                            {result.findings.map((f, i) => (
                                <Alert key={i}>
                                    <FileText className="h-4 w-4" />
                                    <AlertTitle>Finding {i + 1}</AlertTitle>
                                    <AlertDescription>{f}</AlertDescription>
                                </Alert>
                            ))}
                        </div>
                        <Button className="w-full" variant="outline" onClick={() => { setResult(null); setFile(null); }}>Audit Another</Button>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
