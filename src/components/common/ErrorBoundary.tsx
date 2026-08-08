import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ServerErrorView } from './ServerErrorView';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-screen bg-slate-100/70 flex items-center justify-center p-4">
          <div className="bg-white p-6 md:p-12 rounded-3xl shadow-xl border border-slate-200 max-w-2xl w-full">
             <ServerErrorView error={this.state.error} resetError={this.handleReset} />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
