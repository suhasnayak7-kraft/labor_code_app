import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, ShieldCheck, FileText, AlertTriangle, Zap, CheckCircle2, LayoutDashboard, Activity, Download } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Progress } from './components/ui/progress';
import { Badge } from './components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/ui/accordion';
import { UsageDashboard } from './Usage';
import { supabase } from './lib/supabase';
import { Login } from './Login';
import { RequestAccess } from './RequestAccess';
import { CheckStatus } from './CheckStatus';
import { AdminDashboard } from './AdminDashboard';
import { toast } from 'sonner';
import { TextLoop } from './components/ui/text-loop';
import ShimmerText from './components/kokonutui/shimmer-text';

const SCAN_MESSAGES = [
  "Extracting Policy Text...",
  "Consulting Indian Labour Codes...",
  "Identifying Risk Patterns...",
  "Finalizing Compliance Report..."
];

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '/api');

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState<'audit' | 'usage' | 'admin'>('audit');
  const [authView, setAuthView] = useState<'login' | 'request'>('login');
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [result, setResult] = useState<{ compliance_score: number; findings: string[] } | null>(null);
  const [totalTokens, setTotalTokens] = useState<number>(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [auditStatus, setAuditStatus] = useState<{ usage_today: number; daily_limit: number; remaining: number; is_admin: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  // Fetch initial token usage to display in the badge
  const fetchTotalTokens = async () => {
    if (!session?.access_token) return;
    try {
      const response = await fetch(`${API_URL}/logs`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          const sum = data.reduce((acc, log) => acc + log.total_tokens, 0);
          setTotalTokens(sum);
        }
      }
    } catch (error) {
      console.error("Failed to fetch session tokens", error);
    }
  };

  const fetchAuditStatus = async () => {
    if (!session?.access_token) return;
    try {
      const response = await fetch(`${API_URL}/audit/status`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAuditStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch audit status", error);
    }
  };

  useEffect(() => {
    fetchTotalTokens();
    fetchAuditStatus();
  }, [currentTab]); // Refresh when tab changes

  const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB absolute Vercel Serverless payload limit

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type !== 'application/pdf') {
        alert("Please upload a PDF file.");
        return;
      }
      if (droppedFile.size > MAX_FILE_SIZE) {
        alert("File is too large. Vercel allows a maximum of 4.5MB for free tier serverless endpoints. Please compress your PDF.");
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > MAX_FILE_SIZE) {
        alert("File is too large. Vercel allows a maximum of 4.5MB for free tier serverless endpoints. Please compress your PDF.");
        // Clear the input so they can select again
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setFile(selectedFile);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#606C5A]';
    if (score >= 50) return 'text-[#A68B2C]';
    return 'text-[#8B4A42]';
  };

  const getScoreBorderColor = (score: number) => {
    if (score >= 80) return 'border-t-[#606C5A]';
    if (score >= 50) return 'border-t-[#D4A827]';
    return 'border-t-[#8B4A42]';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Likely Compliant';
    if (score >= 70) return 'Moderate Risk';
    if (score >= 50) return 'Significant Gaps';
    return 'Critical Non-Compliance';
  };

  const handleDownloadReport = () => {
    if (!result || !file) return;
    const score = result.compliance_score;
    const auditDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Labour Code Compliance Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; background: #fff; padding: 48px; max-width: 800px; margin: 0 auto; }
          .header { border-bottom: 3px solid #111; padding-bottom: 20px; margin-bottom: 32px; }
          .header h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
          .header p { font-size: 13px; color: #555; margin-top: 4px; }
          .meta { display: flex; gap: 32px; margin-bottom: 32px; }
          .meta-item { font-size: 13px; }
          .meta-item .label { color: #777; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
          .meta-item .value { font-weight: 600; }
          .score-section { background: ${score >= 80 ? '#f0fdf4' : score >= 50 ? '#fefce8' : '#fef2f2'}; border: 1px solid ${score >= 80 ? '#bbf7d0' : score >= 50 ? '#fde68a' : '#fecaca'}; border-radius: 8px; padding: 24px; margin-bottom: 32px; display: flex; align-items: center; gap: 32px; }
          .score-number { font-size: 64px; font-weight: 900; color: ${score >= 80 ? '#059669' : score >= 50 ? '#ca8a04' : '#dc2626'}; line-height: 1; }
          .score-details h2 { font-size: 18px; font-weight: 700; color: ${score >= 80 ? '#059669' : score >= 50 ? '#ca8a04' : '#dc2626'}; }
          .score-details p { font-size: 13px; color: #555; margin-top: 4px; max-width: 400px; }
          .progress-bar { width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin-top: 12px; }
          .progress-fill { height: 100%; border-radius: 4px; background: ${score >= 80 ? '#059669' : score >= 50 ? '#ca8a04' : '#dc2626'}; width: ${score}%; }
          .findings-section h2 { font-size: 15px; font-weight: 700; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
          .finding { display: flex; gap: 12px; margin-bottom: 16px; align-items: flex-start; }
          .finding-num { background: ${score >= 80 ? '#059669' : score >= 50 ? '#ca8a04' : '#dc2626'}; color: white; border-radius: 50%; width: 22px; height: 22px; min-width: 22px; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin-top: 1px; }
          .finding-text { font-size: 13px; line-height: 1.6; color: #333; }
          .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 11px; color: #999; }
          @media print { body { padding: 24px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🛡️ Labour Code Compliance Report</h1>
          <p>Generated by AuditAI · Indian Labour Code Compliance Platform</p>
        </div>
        <div class="meta">
          <div class="meta-item"><div class="label">Document Audited</div><div class="value">${file.name}</div></div>
          <div class="meta-item"><div class="label">Audit Date</div><div class="value">${auditDate}</div></div>
          <div class="meta-item"><div class="label">Legal Framework</div><div class="value">4 Indian Labour Codes (2025)</div></div>
        </div>
        <div class="score-section">
          <div class="score-number">${score}</div>
          <div class="score-details">
            <h2>${getScoreLabel(score)}</h2>
            <p>${score >= 80 ? 'This policy demonstrates strong compliance with the Indian Labour Codes. Minor gaps may still need attention.' : score >= 50 ? 'This policy has moderate compliance gaps. Corrective action is recommended before a formal audit.' : 'This policy has critical compliance violations. Immediate legal review and corrective action is required.'}</p>
            <div class="progress-bar"><div class="progress-fill"></div></div>
          </div>
        </div>
        <div class="findings-section">
          <h2>Detailed Findings (${result.findings.length} issues identified)</h2>
          ${result.findings.map((f, i) => `
            <div class="finding">
              <div class="finding-num">${i + 1}</div>
              <div class="finding-text">${f}</div>
            </div>
          `).join('')}
        </div>
        <div class="footer">
          <strong>Disclaimer:</strong> This report is generated by AI for informational purposes only and does not constitute legal advice.
          Consult a qualified labour law professional before making compliance decisions.
          AuditAI is not liable for actions taken based on this report.
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const handleAudit = async () => {
    if (!file) return;

    setIsAuditing(true);
    setResult(null);
    setScanProgress(0);

    // Simulate scanning progress UX
    let messageIndex = 0;
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) return 90; // Hold at 90% until API returns
        return prev + 5;
      });

      messageIndex = (messageIndex + 1) % SCAN_MESSAGES.length;
    }, 2000);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_id', 'gemini-1.5-flash');

    try {
      const response = await fetch(`${API_URL}/audit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      // Safe parse — Vercel Gateway may return HTML or plain text on native crashes (like 4.5MB payload limit)
      const ct = response.headers.get('content-type') || '';
      let data: any = {};
      if (ct.includes('application/json')) {
        try {
          data = await response.json();
        } catch (err) {
          data = { detail: "Server returned malformed JSON." };
        }
      } else {
        const text = await response.text();
        data = { detail: text.substring(0, 100) }; // Capture Vercel's plain text error string
      }

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(data.detail || "Access Denied. You may have reached your daily limit.");
        }
        if (response.status === 400 || response.status === 413) {
          throw new Error(data.detail || "Invalid file or request (File must be < 4.5MB).");
        }
        throw new Error(`Audit failed on server: ${data.detail || 'Service unavailable.'}`);
      }

      // Snap to 100% and clear interval
      clearInterval(progressInterval);
      setScanProgress(100);

      // Brief delay to show 100% before transitioning
      setTimeout(async () => {
        setResult(data);
        setIsAuditing(false);
        await fetchTotalTokens();
        await fetchAuditStatus();
      }, 800);

    } catch (error: any) {
      clearInterval(progressInterval);
      console.error(error);
      toast.error(error.message || "An error occurred during the audit.");
      setIsAuditing(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F3F3F2] relative">
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <CheckStatus />
          <Button variant="outline" onClick={() => setAuthView(authView === 'login' ? 'request' : 'login')} className="bg-[#FFFFFC] shadow-sm border-[#E6E4E0]">
            {authView === 'login' ? 'Request Access' : 'Sign In'}
          </Button>
        </div>
        {authView === 'login' ? <Login onLoginSuccess={() => { }} /> : <RequestAccess />}
      </div>
    );
  }

  if (profile?.is_deleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F3F2] p-4">
        <Card className="max-w-md w-full border-[#E6E4E0] shadow-xl bg-[#FFFFFC]">
          <CardContent className="pt-10 pb-8 text-center space-y-4">
            <div className="mx-auto bg-[#F5ECEA] w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-[#8B4A42]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#2C2A28]">Access Revoked</h1>
            <p className="text-[#8F837A]">
              Your organization's access to the Labour Code Auditor has been removed.
            </p>
            <div className="pt-4">
              <Button variant="outline" onClick={() => supabase.auth.signOut()} className="w-full">Sign Out</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile?.is_locked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F3F2] p-4">
        <Card className="max-w-md w-full border-[#E6E4E0] shadow-xl bg-[#FFFFFC]">
          <CardContent className="pt-10 pb-8 text-center space-y-4">
            <div className="mx-auto bg-[#F5ECEA] w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-[#8B4A42]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#2C2A28]">Account Locked</h1>
            <p className="text-[#8F837A]">
              Your organization's access to the Labour Code Auditor has been temporarily suspended.
            </p>
            <p className="text-sm text-[#C0B4A8]">Please contact your system administrator.</p>
            <div className="pt-4">
              <Button variant="outline" onClick={() => supabase.auth.signOut()} className="w-full">Sign Out</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F3F2] text-[#2C2A28] font-sans">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full border-b border-[#E6E4E0] bg-[#FFFFFC]">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-[#2C2A28]">
            <ShieldCheck className="w-6 h-6 text-[#606C5A]" />
            AuditAI
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-sm font-medium">
              <button
                onClick={() => setCurrentTab('audit')}
                className={`flex items-center gap-2 transition-colors ${currentTab === 'audit' ? 'text-[#2C2A28]' : 'text-[#8F837A] hover:text-[#2C2A28]'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Auditor
              </button>
              <button
                onClick={() => setCurrentTab('usage')}
                className={`flex items-center gap-2 transition-colors ${currentTab === 'usage' ? 'text-[#2C2A28]' : 'text-[#8F837A] hover:text-[#2C2A28]'}`}
              >
                <Activity className="w-4 h-4" />
                Audit Logs
              </button>
              {profile?.role === 'admin' && (
                <button
                  onClick={() => setCurrentTab('admin')}
                  className={`flex items-center gap-2 transition-colors ${currentTab === 'admin' ? 'text-[#2C2A28]' : 'text-[#8F837A] hover:text-[#2C2A28]'}`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </button>
              )}
            </div>

            {profile?.role === 'admin' && (
              <Badge
                variant="outline"
                className="cursor-pointer bg-white px-3 py-1 font-mono hover:bg-zinc-100 transition-colors"
                onClick={() => setCurrentTab('usage')}
              >
                <Zap className="w-3.5 h-3.5 mr-1.5 fill-yellow-400 text-yellow-500" />
                {totalTokens.toLocaleString()} Session Usage
              </Badge>
            )}

            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()} className="text-[#8F837A] hover:text-[#2C2A28] transition-colors">
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 py-8">
        {currentTab === 'admin' && profile?.role === 'admin' ? (
          <AdminDashboard session={session} adminProfile={profile} />
        ) : currentTab === 'usage' ? (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Audit Logs & History</h1>
              <p className="text-zinc-500 mt-2">Monitor your compliance audit history and details.</p>
            </div>
            <UsageDashboard token={session?.access_token} dailyLimit={profile?.daily_audit_limit} role={profile?.role} />
          </div>
        ) : activeTool === null ? (
          <div className="max-w-6xl mx-auto py-8 fade-in">
            <div className="mb-10 text-center">
              <h1 className="font-serif text-4xl text-[#2C2A28]">Compliance Hub</h1>
              <p className="text-[#5E5E5E] mt-3 max-w-2xl mx-auto">
                Select a tool to analyze your documents, calculate liabilities, and ensure complete compliance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Labour Code Auditor Card */}
              <div
                className="bg-[#FFFFFC] border border-[#E6E4E0] rounded-lg shadow-[0_1px_3px_rgba(95,87,80,0.07),0_1px_2px_rgba(95,87,80,0.04)] p-5 cursor-pointer flex flex-col items-start text-left h-full min-h-[220px] transition-colors duration-120 hover:border-[#C0B4A8] group"
                onClick={() => setActiveTool('labor')}
              >
                <div className="w-10 h-10 rounded-full bg-[#ECF0E8] flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5 text-[#606C5A]" />
                </div>
                <span className="font-semibold text-[11px] uppercase tracking-[0.08em] text-[#606C5A] mb-2">LABOUR CODE</span>
                <h3 className="font-serif text-[17px] text-[#2C2A28] mb-2">Labour Compliance Auditor</h3>
                <p className="text-[13px] text-[#8F837A] mb-6 flex-grow">
                  Check your policies against the 2025 Indian Labour Codes.
                </p>
                <span className="text-[13px] text-[#606C5A] font-medium flex items-center mt-auto group-hover:text-[#4F5A4A] transition-colors">
                  Scan my policy <span className="ml-1">→</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-[800px] mx-auto bg-white p-8 md:p-12 rounded-lg shadow-[0_1px_3px_rgba(95,87,80,0.07)] border border-[#E6E4E0] my-4 fade-in">
            <div className="mb-6 flex items-center text-[13px] text-[#8F837A]">
              <button
                onClick={() => setActiveTool(null)}
                className="hover:text-[#2C2A28] transition-colors font-medium mr-2"
              >
                Hub
              </button>
              <span className="mr-2">→</span>
              <span className="text-[#2C2A28] font-medium">Labour Code</span>
            </div>

            <AnimatePresence mode="wait">
              {!isAuditing && !result && (
                <div
                  key="upload"
                  className="space-y-8 fade-in"
                >
                  <div className="text-center space-y-3 mb-10">
                    <h1 className="font-serif text-4xl tracking-tight text-[#2C2A28]">
                      Labour Code Auditor
                    </h1>
                    <p className="text-[14px] leading-[1.6] text-[#5E5E5E] max-w-2xl mx-auto">
                      Upload your Employee Policy or Code of Conduct to instantly identify compliance risks against the latest 2025 Labour Regulations.
                    </p>
                  </div>

                  {/* Drop Zone */}
                  <Card className="border-2 border-dashed border-zinc-200 bg-white/50 hover:bg-zinc-50/50 transition-colors shadow-none">
                    <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                      <div
                        className="w-full max-w-md p-8 flex flex-col items-center justify-center cursor-pointer rounded-xl"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleFileDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                        <div className="bg-[#ECF0E8] p-4 rounded-full mb-4 transition-colors">
                          <UploadCloud className="w-8 h-8 text-[#606C5A]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#2C2A28] mb-1">
                          {file ? file.name : "Click or drag your PDF here"}
                        </h3>
                        <p className="text-sm text-zinc-500">
                          {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB • Ready to audit` : "Only PDF files are supported up to 4.5MB"}
                        </p>
                      </div>


                      <Button
                        size="lg"
                        className="mt-4 w-full max-w-sm font-medium transition-colors shadow-md hover:shadow-lg"
                        disabled={!file || (auditStatus !== null && !auditStatus.is_admin && auditStatus.remaining === 0)}
                        onClick={(e) => { e.stopPropagation(); handleAudit(); }}
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" />
                          Run Compliance Audit
                        </span>
                      </Button>

                      {/* Remaining audits indicator */}
                      {auditStatus && !auditStatus.is_admin && (
                        <p className={`mt-2 text-xs ${auditStatus.remaining === 0 ? 'text-[#8B4A42]' : 'text-[#8F837A]'}`}>
                          {auditStatus.remaining === 0
                            ? 'Daily limit reached. Contact your administrator.'
                            : `${auditStatus.remaining} audit${auditStatus.remaining !== 1 ? 's' : ''} remaining today (${auditStatus.usage_today}/${auditStatus.daily_limit} used)`}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {isAuditing && (
                <div
                  key="scanning"
                  className="flex flex-col items-center justify-center py-20 min-h-[50vh] fade-in"
                >
                  <div className="relative mb-8">
                    <div className="bg-[#606C5A] text-white p-6 rounded-full relative z-10 shadow-[0_1px_3px_rgba(95,87,80,0.07)]">
                      <ShieldCheck className="w-12 h-12" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight mb-2 text-[#2C2A28]">Scanning Document...</h2>
                  <div className="font-medium h-6 text-zinc-500 flex justify-center w-full">
                    <TextLoop>
                      <span>Extracting Policy Text...</span>
                      <span>Consulting Indian Labour Codes...</span>
                      <span>Identifying Risk Patterns...</span>
                      <span>Finalizing Compliance Report...</span>
                    </TextLoop>
                  </div>

                  <div className="w-full max-w-md mt-8">
                    <Progress value={scanProgress} className="h-2 w-full transition-all duration-1000" />
                  </div>
                </div>
              )}

              {result && !isAuditing && (
                <div
                  key="results"
                  className="space-y-6 fade-in"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <h2 className="text-2xl font-bold tracking-tight">Audit Results</h2>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleDownloadReport}>
                        <Download className="w-4 h-4 mr-1.5" />
                        Download Report
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setResult(null); setFile(null); }}>
                        Audit Another Policy
                      </Button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Compliance Score Card */}
                    <Card className={`md:col-span-1 border-t-4 ${getScoreBorderColor(result.compliance_score)}`}>
                      <CardHeader>
                        <CardTitle className="text-lg text-zinc-700">
                          <ShimmerText text="Compliance Score" className="p-0 justify-start !text-lg !font-semibold" />
                        </CardTitle>
                        <CardDescription>100 = Fully compliant · 0 = Critical violations</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
                        <span className={`text-6xl font-black ${getScoreColor(result.compliance_score)}`}>
                          {result.compliance_score}
                        </span>
                        <Progress
                          value={result.compliance_score}
                          className="h-3 w-full"
                        />
                        <Badge variant={'outline'} className="mt-2 text-sm font-medium px-4 py-1">
                          {getScoreLabel(result.compliance_score)}
                        </Badge>
                      </CardContent>
                    </Card>

                    {/* Findings */}
                    <div className="md:col-span-2 space-y-4">
                      {result.compliance_score < 50 ? (
                        <Alert className="bg-[#F5ECEA] text-[#2C2A28] border-[#E8C4C0]">
                          <AlertTriangle className="h-4 w-4 text-[#8B4A42]" />
                          <AlertTitle className="text-[#8B4A42]">Immediate Action Required</AlertTitle>
                          <AlertDescription className="text-[#5E5E5E]">
                            This policy has critical compliance violations. Legal review and corrective action needed immediately.
                          </AlertDescription>
                        </Alert>
                      ) : result.compliance_score >= 70 ? (
                        <Alert className="bg-[#ECF0E8] text-[#2C2A28] border-[#DCE4D5]">
                          <CheckCircle2 className="h-4 w-4 text-[#606C5A]" />
                          <AlertTitle className="text-[#606C5A]">Strong Compliance</AlertTitle>
                          <AlertDescription className="text-[#5E5E5E]">
                            This policy is largely compliant with the Indian Labour Codes. Review any findings below for minor improvements.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert className="bg-[#F8F0DE] text-[#2C2A28] border-[#E8D5A3]">
                          <AlertTriangle className="h-4 w-4 text-[#A68B2C]" />
                          <AlertTitle className="text-[#A68B2C]">Moderate Compliance Gaps</AlertTitle>
                          <AlertDescription className="text-[#5E5E5E]">
                            Corrective action is recommended. Review the findings below and update the policy accordingly.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
                        <div className="bg-[#F3F3F2] border-b border-[#E6E4E0] px-4 py-3 font-semibold text-[#5E5E5E] flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Detailed Findings
                          </span>
                          <span className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-mono bg-zinc-200/50 text-zinc-600">
                              {result.findings.length}
                            </Badge>
                            Issues
                          </span>
                        </div>
                        <Accordion type="single" collapsible className="w-full px-4">
                          {result.findings.map((finding, index) => (
                            <AccordionItem key={index} value={`item-${index}`} className="last:border-b-0">
                              <AccordionTrigger className="text-left font-medium text-sm hover:no-underline hover:text-[#606C5A] transition-colors">
                                <span className="flex items-start gap-3">
                                  <span className="flex-shrink-0 bg-[#F5ECEA] text-[#8B4A42] h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                    {index + 1}
                                  </span>
                                  <span className="leading-snug">
                                    {finding.split('.')[0]}. {/* Show snippet in header */}
                                  </span>
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="text-zinc-600 pl-9 pb-4 leading-relaxed whitespace-pre-line">
                                {finding}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    </div>
                  </div>

                  {/* Door Navigation */}
                  <div className="mt-12 pt-8 border-t border-[#E6E4E0]">
                    <button
                      className="text-left group w-full"
                      onClick={() => toast("Wage Simulator is coming in Tier 2.", { icon: "🚧" })}
                    >
                      <div className="text-[#5E5E5E] text-[13px] mb-1">Your wage structure may be contributing to this.</div>
                      <div className="text-[#606C5A] font-medium group-hover:text-[#4F5A4A] transition-colors">
                        Run a Wage Simulation to check. →
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )
        }
      </main >
    </div >
  );
}
