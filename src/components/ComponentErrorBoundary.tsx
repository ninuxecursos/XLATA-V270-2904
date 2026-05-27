import React, { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { safeLogger } from '@/utils/safeLogger';

interface ComponentErrorBoundaryProps {
  children: ReactNode;
  componentName: string;
}

/**
 * Error boundary for individual components
 * Provides component-specific fallback UI
 */
export const ComponentErrorBoundary: React.FC<ComponentErrorBoundaryProps> = ({ 
  children, 
  componentName 
}) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded">
          <p className="text-destructive text-sm">
            Erro ao carregar {componentName}
          </p>
        </div>
      }
      onError={(error) => {
        safeLogger.error(`Erro no componente ${componentName}:`, error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
