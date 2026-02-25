import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, ShieldCheck, FileText, AlertTriangle, Zap, CheckCircle2, LayoutDashboard, Activity } from 'lucide-react';
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState<'audit' | 'usage' | 'admin'>('audit');
  const [authView, setAuthView] = useState<'login' | 'request'>('login');

  const [file, setFile] = useState<File | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [result, setResult] = useState<{ risk_score: number; findings: string[] } | null>(null);
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
                Usage
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

            <Badge
              variant="outline"
              className="cursor-pointer bg-white px-3 py-1 font-mono hover:bg-zinc-100 transition-colors"
              onClick={() => setCurrentTab('usage')}
            >
              <Zap className="w-3.5 h-3.5 mr-1.5 fill-yellow-400 text-yellow-500" />
              {totalTokens.toLocaleString()} Session Usage
            </Badge>

            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()} className="text-zinc-500 hover:text-zinc-900">
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
              <h1 className="text-3xl font-bold tracking-tight">API Usage Dashboard</h1>
              <p className="text-zinc-500 mt-2">Monitor your AI token consumption and audit history.</p>
            </div>
            <UsageDashboard token={session?.access_token} dailyLimit={profile?.daily_audit_limit} />
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
                        className="mt-6 w-full max-w-sm font-medium transition-all"
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
                    <Button variant="outline" size="sm" onClick={() => { setResult(null); setFile(null); }}>
                      Audit Another Policy
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Risk Score Card */}
                    <Card className={`md:col-span-1 border-t-4 ${result.risk_score > 70 ? 'border-t-red-500' : result.risk_score > 40 ? 'border-t-yellow-500' : 'border-t-emerald-500'}`}>
                      <CardHeader>
                        <CardTitle className="text-lg text-zinc-700">Overall Risk Score</CardTitle>
                        <CardDescription>Probability of compliance violation</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
                        <span className={`text-6xl font-black ${result.risk_score > 70 ? 'text-red-600' : result.risk_score > 40 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                          {result.risk_score}
                        </span>
                        <Progress
                          value={result.risk_score}
                          className="h-3 w-full"
                        />
                        <Badge variant={'outline'} className="mt-2 text-sm font-medium px-4 py-1">
                          {result.risk_score > 70 ? 'Critical Risk' : result.risk_score > 40 ? 'Moderate Risk' : 'Low Risk / Compliant'}
                        </Badge>
                      </CardContent>
                    </Card>

                    {/* Findings */}
                    <div className="md:col-span-2 space-y-4">
                      {result.risk_score > 70 ? (
                        <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Action Required</AlertTitle>
                          <AlertDescription>
                            This policy contains critical legal violations. Please review the findings below immediately.
                          </AlertDescription>
                        </Alert>
                      ) : result.risk_score === 0 ? (
                        <Alert className="bg-emerald-50 text-emerald-900 border-emerald-200">
                          <CheckCircle2 className="h-4 w-4" color="#059669" />
                          <AlertTitle className="text-emerald-800">Fully Compliant</AlertTitle>
                          <AlertDescription className="text-emerald-700">
                            Excellent! No violations were found in this document based on the provided legal context.
                          </AlertDescription>
                        </Alert>
                      ) : null}

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
