import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  onResetView?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || 'Error desconocido' };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onResetView) {
      this.props.onResetView();
    }
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ maxWidth: '600px', margin: '40px auto', padding: '32px', textAlign: 'center' }}>
          <div style={{ color: 'var(--danger)', marginBottom: '16px' }}>
            <AlertTriangle size={48} style={{ margin: '0 auto' }} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
            Ocurrió un error inesperado en esta vista
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px', background: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace' }}>
            {this.state.errorMessage}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={this.handleReset}>
              <RefreshCw size={16} /> Reintentar
            </button>
            <button className="btn btn-primary" onClick={this.handleGoHome}>
              <Home size={16} /> Volver al Inicio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

