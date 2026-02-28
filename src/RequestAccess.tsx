import React, { useState } from 'react';
import { supabase } from './lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Button } from './components/ui/button';
import { Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function RequestAccess() {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            full_name: formData.get('full_name') as string,
            email: formData.get('email') as string,
            company_name: formData.get('company_name') as string,
            company_size: formData.get('company_size') as string,
            industry: formData.get('industry') as string,
        };

        const { error: insertError } = await supabase
            .from('waiting_list')
            .insert([data]);

        if (insertError) {
            console.error("Error submitting request:", insertError);
            if (insertError.code === '23505') {
                toast.error('You have already submitted a request with this email.');
            } else {
                toast.error('Failed to submit request. Please try again.');
            }
        } else {
            setSubmitted(true);
            toast.success("Request submitted successfully!");
        }

        setLoading(false);
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="text-emerald-600 w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">Request Received</h2>
                <p className="text-zinc-500 text-center max-w-sm">
                    Thank you for your interest in the Labour Code Auditor. Our team will review your application and contact you with access credentials soon.
                </p>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md border-zinc-200 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-blue-500" />
                <CardHeader className="space-y-3 pb-6 text-center">
                    <div className="mx-auto bg-zinc-100 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                        <Shield className="text-zinc-900 w-6 h-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Request Access</CardTitle>
                    <CardDescription className="text-zinc-500">
                        Join the exclusive waitlist for the enterprise Indian Labour Code compliance Engine.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input id="full_name" name="full_name" required placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Work Email</Label>
                            <Input id="email" name="email" type="email" required placeholder="john@company.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company_name">Company Name</Label>
                            <Input id="company_name" name="company_name" required placeholder="Acme Corp" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="company_size">Company Size</Label>
                                <Input id="company_size" name="company_size" required placeholder="e.g. 50-200" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="industry">Industry</Label>
                                <Input id="industry" name="industry" required placeholder="e.g. Technology" />
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800 text-white" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Request"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
