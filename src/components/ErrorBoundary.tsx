import React, { Component, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackUI?: 'full' | 'inline';
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  renderFullPageError() {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
          <div className="mb-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Ups! Nešto nije u redu
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Došlo je do neočekivane greške. Pokušajte ponovo ili se vratite na početnu stranicu.
            </p>
          </div>

          {this.state.error && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 mb-2">
                Detalji greške
              </summary>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm font-mono text-red-800 dark:text-red-300 break-all mb-2">
                  {this.state.error.message}
                </p>
                <pre className="text-xs text-red-700 dark:text-red-400 overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              </div>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Pokušaj ponovo
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              Početna
            </button>
          </div>
        </div>
      </div>
    );
  }

  renderInlineError() {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
              Greška pri učitavanju
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              {this.state.error?.message || 'Došlo je do neočekivane greške'}
            </p>
            <button
              onClick={this.handleReset}
              className="text-sm text-red-700 dark:text-red-300 underline hover:no-underline"
            >
              Pokušaj ponovo
            </button>
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallbackUI === 'inline'
        ? this.renderInlineError()
        : this.renderFullPageError();
    }

    return this.props.children;
  }
}

export default ErrorBoundary;