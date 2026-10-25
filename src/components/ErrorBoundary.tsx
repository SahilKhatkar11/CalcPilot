import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public props: Props;
  public state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in CalcPilot:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020408] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <span className="text-2xl text-red-400">⚠️</span>
          </div>
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-400 max-w-md mb-6">
            CalcPilot encountered an unexpected issue while rendering.
          </p>
          <button
            onClick={() => {
              try {
                localStorage.clear();
              } catch (e) {
                // ignore
              }
              window.location.reload();
            }}
            className="px-5 py-2.5 rounded-xl bg-[#ff9f0a] hover:bg-[#ffb340] text-black font-semibold text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-[#ff9f0a]/20"
          >
            Reset & Reload App
          </button>
          {this.state.error && (
            <pre className="mt-6 p-4 rounded-xl bg-black/60 border border-white/5 text-xs text-red-300 font-mono text-left max-w-lg overflow-auto">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
