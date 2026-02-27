import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, ShieldCheck, FileText, AlertTriangle, Zap, CheckCircle2, LayoutDashboard, Activity, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const [file, setFile] = useState<File | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [result, setResult] = useState<{ compliance_score: number; findings: string[] } | null>(null);
  const [totalTokens, setTotalTokens] = useState<number>(0);
  const [scanMessage, setScanMessage] = useState(SCAN_MESSAGES[0]);
  const [scanProgress, setScanProgress] = useState(0);
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

  useEffect(() => {
    fetchTotalTokens();
  }, [currentTab]); // Refresh when tab changes

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      } else {
        alert("Please upload a PDF file.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBorderColor = (score: number) => {
    if (score >= 80) return 'border-t-emerald-500';
    if (score >= 50) return 'border-t-yellow-500';
    return 'border-t-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Compliant';
    if (score >= 50) return 'Moderate Risk';
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
    setScanMessage(SCAN_MESSAGES[0]);

    // Simulate scanning progress UX
    let messageIndex = 0;
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) return 90; // Hold at 90% until API returns
        return prev + 5;
      });

      messageIndex = (messageIndex + 1) % SCAN_MESSAGES.length;
      setScanMessage(SCAN_MESSAGES[messageIndex]);
    }, 2000);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/audit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(data.detail || "Access Denied.");
        }
        throw new Error(data.detail || 'Audit failed. Ensure the backend is running.');
      }

      // Snap to 100% and clear interval
      clearInterval(progressInterval);
      setScanProgress(100);
      setScanMessage("Audit Complete!");

      // Brief delay to show 100% before transitioning
      setTimeout(async () => {
        setResult(data);
        setIsAuditing(false);
        await fetchTotalTokens();
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
      <div className="min-h-screen bg-zinc-50 relative">
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <CheckStatus />
          <Button variant="outline" onClick={() => setAuthView(authView === 'login' ? 'request' : 'login')} className="bg-white/50 backdrop-blur-sm shadow-sm">
            {authView === 'login' ? 'Request Access' : 'Sign In'}
          </Button>
        </div>
        {authView === 'login' ? <Login onLoginSuccess={() => { }} /> : <RequestAccess />}
      </div>
    );
  }

  if (profile?.is_deleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 selection:bg-zinc-200 p-4">
        <Card className="max-w-md w-full border-red-200 shadow-xl">
          <CardContent className="pt-10 pb-8 text-center space-y-4">
            <div className="mx-auto bg-zinc-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-zinc-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Access Revoked</h1>
            <p className="text-zinc-500">
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 selection:bg-zinc-200 p-4">
        <Card className="max-w-md w-full border-red-200 shadow-xl">
          <CardContent className="pt-10 pb-8 text-center space-y-4">
            <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Account Locked</h1>
            <p className="text-zinc-500">
              Your organization's access to the Labour Code Auditor has been temporarily suspended.
            </p>
            <p className="text-sm text-zinc-400">Please contact your system administrator.</p>
            <div className="pt-4">
              <Button variant="outline" onClick={() => supabase.auth.signOut()} className="w-full">Sign Out</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-200">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-zinc-900">
            <ShieldCheck className="w-6 h-6 text-zinc-900" />
            AuditAI
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-sm font-medium">
              <button
                onClick={() => setCurrentTab('audit')}
                className={`flex items-center gap-2 transition-colors ${currentTab === 'audit' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Auditor
              </button>
              <button
                onClick={() => setCurrentTab('usage')}
                className={`flex items-center gap-2 transition-colors ${currentTab === 'usage' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                <Activity className="w-4 h-4" />
                Audit Logs
              </button>
              {profile?.role === 'admin' && (
                <button
                  onClick={() => setCurrentTab('admin')}
                  className={`flex items-center gap-2 transition-colors ${currentTab === 'admin' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
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

            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()} className="text-zinc-500 hover:text-zinc-900 transition-all hover:scale-[1.05] active:scale-[0.95]">
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
        ) : (
          <div className="max-w-4xl mx-auto align-top">
            <AnimatePresence mode="wait">
              {!isAuditing && !result && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-3 mb-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight lg:text-5xl">
                      Labour Code Compliance Auditor
                    </h1>
                    <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
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
                        <div className="bg-zinc-100 p-4 rounded-full mb-4 group-hover:bg-zinc-200 transition-colors">
                          <UploadCloud className="w-8 h-8 text-zinc-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-zinc-900 mb-1">
                          {file ? file.name : "Click or drag your PDF here"}
                        </h3>
                        <p className="text-sm text-zinc-500">
                          {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB • Ready to audit` : "Only PDF files are supported up to 10MB"}
                        </p>
                      </div>

                      <Button
                        size="lg"
                        className="mt-6 w-full max-w-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
                        disabled={!file}
                        onClick={(e) => { e.stopPropagation(); handleAudit(); }}
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" />
                          Run Compliance Audit
                        </span>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Cinematic Scanner */}
              {isAuditing && (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center justify-center py-20 min-h-[50vh]"
                >
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-zinc-900 rounded-full animate-ping opacity-20 duration-1000" />
                    <div className="bg-zinc-900 text-white p-6 rounded-full relative z-10 shadow-2xl">
                      <ShieldCheck className="w-12 h-12" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight mb-2">Scanning Document...</h2>
                  <p className="text-zinc-500 animate-pulse font-medium h-6">{scanMessage}</p>

                  <div className="w-full max-w-md mt-8">
                    <Progress value={scanProgress} className="h-2 w-full transition-all duration-1000" />
                  </div>
                </motion.div>
              )}

              {/* Results Section */}
              {result && !isAuditing && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="space-y-6"
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
                        <CardTitle className="text-lg text-zinc-700">Compliance Score</CardTitle>
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
                        <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Immediate Action Required</AlertTitle>
                          <AlertDescription>
                            This policy has critical compliance violations. Legal review and corrective action needed immediately.
                          </AlertDescription>
                        </Alert>
                      ) : result.compliance_score >= 80 ? (
                        <Alert className="bg-emerald-50 text-emerald-900 border-emerald-200">
                          <CheckCircle2 className="h-4 w-4" color="#059669" />
                          <AlertTitle className="text-emerald-800">Strong Compliance</AlertTitle>
                          <AlertDescription className="text-emerald-700">
                            This policy is largely compliant with the Indian Labour Codes. Review any findings below for minor improvements.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert className="bg-yellow-50 text-yellow-900 border-yellow-200">
                          <AlertTriangle className="h-4 w-4" color="#ca8a04" />
                          <AlertTitle className="text-yellow-800">Moderate Compliance Gaps</AlertTitle>
                          <AlertDescription className="text-yellow-700">
                            Corrective action is recommended. Review the findings below and update the policy accordingly.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
                        <div className="bg-zinc-50 border-b px-4 py-3 font-semibold text-zinc-700 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Detailed Findings
                        </div>
                        <Accordion type="single" collapsible className="w-full px-4">
                          {result.findings.map((finding, index) => (
                            <AccordionItem key={index} value={`item-${index}`} className="last:border-b-0">
                              <AccordionTrigger className="text-left font-medium text-sm hover:no-underline hover:text-blue-600 transition-colors">
                                <span className="flex items-start gap-3">
                                  <span className="flex-shrink-0 bg-red-100 text-red-700 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
        }
      </main >
    </div >
  );
}
