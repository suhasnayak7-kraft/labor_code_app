import React, { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        console.error('[ErrorBoundary] Caught error:', error);
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary] Error:', error);
        console.error('[ErrorBoundary] Error details:', errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-[#F3F3F2]">
                    <div className="text-center max-w-md">
                        <AlertCircle className="w-12 h-12 text-[#8B4A42] mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-[#2C2A28] mb-2">Something went wrong</h1>
                        <p className="text-[#5E5E5E] mb-4">{this.state.error?.message || 'An unexpected error occurred'}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-[#606C5A] text-white rounded hover:bg-[#505B4A]"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
