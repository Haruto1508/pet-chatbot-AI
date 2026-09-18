import React, { Component, ErrorInfo, ReactNode } from 'react';
import { MaintenanceView } from './MaintenanceView';

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
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <MaintenanceView 
          error={this.state.error} 
          resetError={this.handleReset}
          isCrash={true}
        />
      );
    }

    return this.props.children;
  }
}

