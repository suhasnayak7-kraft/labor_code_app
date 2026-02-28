import { useState } from 'react';
import { supabase } from './lib/supabase';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Loader2, CheckCircle2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";

export function CheckStatus() {
    const [statusEmail, setStatusEmail] = useState("");
    const [statusResult, setStatusResult] = useState<string | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    const handleCheckStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!statusEmail) return;

        setStatusLoading(true);
        setStatusResult(null);

        const { data, error } = await supabase
            .from('waiting_list')
            .select('status')
            .eq('email', statusEmail)
            .single();

        if (error || !data) {
            setStatusResult('not_found');
        } else {
            setStatusResult(data.status);
        }

        setStatusLoading(false);
    };

    return (
        <Dialog onOpenChange={(open) => { if (!open) { setStatusResult(null); setStatusEmail(""); } }}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="text-zinc-500 hover:text-zinc-900 transition-colors">
                    Check Status
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>View Application Status</DialogTitle>
                    <DialogDescription>Enter the work email you used to request access.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCheckStatus} className="py-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <Input
                            type="email"
                            required
                            placeholder="john@company.com"
                            value={statusEmail}
                            onChange={(e) => setStatusEmail(e.target.value)}
                        />
                        <Button type="submit" disabled={statusLoading}>
                            {statusLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                    </div>

                    {statusResult && (
                        <div className={`p-4 rounded-md flex items-center gap-3 border animate-in fade-in slide-in-from-top-2 ${statusResult === 'pending' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                            statusResult === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                statusResult === 'rejected' ? 'bg-red-50 border-red-200 text-red-800' :
                                    'bg-zinc-50 border-zinc-200 text-zinc-600'
                            }`}>
                            {statusResult === 'pending' && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
                            {statusResult === 'approved' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                            {statusResult === 'not_found' && <Search className="h-5 w-5 text-zinc-400" />}
                            <div className="flex-1">
                                <p className="font-semibold capitalize">
                                    {statusResult === 'not_found' ? 'Email Not Found' : statusResult}
                                </p>
                                <p className="text-sm opacity-80 mt-0.5">
                                    {statusResult === 'pending' && 'Your application is currently under review.'}
                                    {statusResult === 'approved' && 'You have been approved! Please return to login.'}
                                    {statusResult === 'rejected' && 'Your application has been declined.'}
                                    {statusResult === 'not_found' && 'No application exists for this email address.'}
                                </p>
                            </div>
                        </div>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}
