import React, { useState } from 'react';
import { supabase } from './lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Button } from './components/ui/button';
import { Loader2, LockKeyhole } from 'lucide-react';

export function Login({ onLoginSuccess }: { onLoginSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
        } else {
            onLoginSuccess();
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md border-zinc-200 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-700 to-zinc-900" />
                <CardHeader className="space-y-3 pb-6 text-center">
                    <div className="mx-auto bg-zinc-100 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                        <LockKeyhole className="text-zinc-900 w-6 h-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Sign In</CardTitle>
                    <CardDescription className="text-zinc-500">
                        Enter your credentials to access the Labour Code Auditor.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Work Email</Label>
                            <Input id="email" name="email" type="email" required placeholder="name@company.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md text-center">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800 text-white" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Secure Log In"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
