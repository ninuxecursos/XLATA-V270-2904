import React from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureLockProps {
  feature: string;
  children: React.ReactNode;
  lockedMessage?: string;
  showLockIcon?: boolean;
  hideWhenLocked?: boolean;
  className?: string;
}

export function FeatureLock({
  feature,
  children,
  lockedMessage = "Complete as etapas anteriores para desbloquear",
  showLockIcon = true,
  hideWhenLocked = false,
  className
}: FeatureLockProps) {
  const { isFeatureUnlocked, isLoading } = useOnboarding();

  // Durante o loading, mostrar o conteúdo normalmente
  if (isLoading) {
    return <>{children}</>;
  }

  const isUnlocked = isFeatureUnlocked(feature);

  if (!isUnlocked && hideWhenLocked) {
    return null;
  }

  if (!isUnlocked) {
    return (
      <div className={cn("relative", className)}>
        {/* Conteúdo bloqueado com overlay */}
        <div className="opacity-50 pointer-events-none select-none blur-[1px]">
          {children}
        </div>
        
        {/* Overlay de bloqueio */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 rounded-lg">
          {showLockIcon && (
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
              <Lock className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <p className="text-gray-400 text-sm text-center px-4 max-w-[200px]">
            {lockedMessage}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
