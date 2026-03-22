import React from 'react';

/**
 * Error Boundary — catches React render errors and prevents white-screen crashes.
 * Wraps any component tree. Shows a user-friendly error UI instead of crashing.
 */
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error('[ErrorBoundary] Component error caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 m-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                    <h2 className="text-lg font-bold text-red-400 mb-2">⚠️ Something went wrong</h2>
                    <p className="text-sm text-slate-300 mb-4">
                        This section encountered an error. Your data is safe.
                    </p>
                    <details className="text-xs text-slate-500">
                        <summary className="cursor-pointer hover:text-slate-300">Technical Details</summary>
                        <pre className="mt-2 p-3 bg-slate-900 rounded-lg overflow-auto max-h-40">
                            {this.state.error?.toString()}
                            {this.state.errorInfo?.componentStack}
                        </pre>
                    </details>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                        className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
