'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="card p-6 border-functional-error/50 bg-functional-error/10">
          <div className="flex items-center gap-3 text-functional-error mb-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="font-semibold">Something went wrong</h3>
          </div>
          <p className="text-sm text-white/70 mb-4">
            We couldn't load this section. It might be a temporary connectivity issue.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="btn-ghost text-xs bg-white/5 hover:bg-white/10"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
