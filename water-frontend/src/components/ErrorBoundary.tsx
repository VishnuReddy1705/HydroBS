import React, { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

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
    console.error("Uncaught boundary error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans">
          <div className="border border-white/10 rounded-3xl bg-white/5 backdrop-blur-md p-8 max-w-md w-full text-center space-y-6 shadow-2xl animate-fade-in">
            <div className="h-16 w-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertTriangle className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold tracking-wide text-white">Something Went Wrong</h2>
              <p className="text-xs text-white/60 leading-relaxed">
                The application encountered an unexpected rendering error. Stale dashboard data or rendering formats might have triggered a validation check.
              </p>
            </div>

            {this.state.error && (
              <div className="text-[10px] font-mono text-left bg-black/40 p-4 rounded-2xl border border-white/5 max-h-32 overflow-y-auto text-rose-300 leading-relaxed">
                {this.state.error.message || "Unknown error details"}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-900 font-bold py-3 px-4 rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all hover:scale-[1.02] shadow-lg shadow-cyan-500/25 active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
