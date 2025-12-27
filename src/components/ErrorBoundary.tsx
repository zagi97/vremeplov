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
  isChunkError: boolean;
  reloadAttempted: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isChunkError: false, reloadAttempted: false };
  }

  static isChunkLoadError(error: Error): boolean {
    const message = error.message || '';
    return message.includes('dynamically imported module') ||
           message.includes('Loading chunk') ||
           message.includes('Failed to fetch');
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunkError = ErrorBoundary.isChunkLoadError(error);

    // Check if we already attempted reload
    const reloadKey = 'chunk_error_reload';
    const lastReload = sessionStorage.getItem(reloadKey);
    const now = Date.now();
    const reloadAttempted = lastReload ? (now - parseInt(lastReload)) < 10000 : false;

    return {
      hasError: true,
      error,
      isChunkError,
      reloadAttempted
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Handle chunk error reload
    if (this.state.isChunkError && !this.state.reloadAttempted) {
      const reloadKey = 'chunk_error_reload';
      const now = Date.now();

      sessionStorage.setItem(reloadKey, now.toString());
      console.log('🔄 Chunk loading error detected, reloading...');
      window.location.reload();
    }
  }

  handleReset = () => {
    if (this.state.isChunkError) {
      // Clear the reload key and force reload
      sessionStorage.removeItem('chunk_error_reload');
      window.location.reload();
      return;
    }

    this.setState({ hasError: false, error: undefined, isChunkError: false, reloadAttempted: false });
    this.props.onReset?.();
  };

  handleGoHome = () => {
    // Clear any reload keys when going home
    sessionStorage.removeItem('chunk_error_reload');
    window.location.href = '/';
  };

  // Loading UI shown while auto-reload is in progress for chunk errors
  renderChunkErrorLoading() {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Ažuriranje aplikacije...</p>
        </div>
      </div>
    );
  }

  // Fallback UI shown when auto-reload failed (e.g., reload already attempted)
  renderChunkErrorFallback() {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
          <div className="mb-6">
            <RefreshCw className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Nova verzija dostupna
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Aplikacija je ažurirana. Molimo osvježite stranicu za nastavak.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Osvježi stranicu
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              Početna
            </button>
          </div>

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Ili pritisnite <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+Shift+R</kbd> za hard refresh
          </p>
        </div>
      </div>
    );
  }

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
      // For chunk errors: show loading while reload is happening, fallback if reload failed
      if (this.state.isChunkError) {
        return this.state.reloadAttempted
          ? this.renderChunkErrorFallback()
          : this.renderChunkErrorLoading();
      }

      return this.props.fallbackUI === 'inline'
        ? this.renderInlineError()
        : this.renderFullPageError();
    }

    return this.props.children;
  }
}

export default ErrorBoundary;