import React, { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Button } from './ui/button';

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Error boundary for route-level errors
 * Provides route-specific fallback UI
 */
export const RouteErrorBoundary: React.FC<RouteErrorBoundaryProps> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center h-screen bg-background text-foreground">
          <div className="text-center">
            <h2 className="text-xl mb-4">Erro ao carregar a página</h2>
            <Button onClick={() => window.location.reload()}>Recarregar</Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};
