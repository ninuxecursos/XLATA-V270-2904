import React, { Component, ErrorInfo, ReactNode } from 'react';
import { safeLogger } from '@/utils/safeLogger';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary component
 * Catches unhandled errors and provides fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    safeLogger.error('Erro capturado pelo Error Boundary:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    this.setState({
      error,
      errorInfo
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Algo deu errado</h1>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            Desculpe, ocorreu um erro inesperado. Nossa equipe foi notificada.
          </p>
          <div className="flex gap-4">
            <Button onClick={this.handleReset} variant="default">
              Tentar Novamente
            </Button>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Voltar ao Início
            </Button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-8 p-4 bg-muted rounded max-w-2xl w-full">
              <summary className="cursor-pointer font-semibold">
                Detalhes do Erro (Apenas em Dev)
              </summary>
              <pre className="mt-2 text-xs overflow-auto">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
