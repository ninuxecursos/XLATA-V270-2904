import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureUnlockBadgeProps {
  feature: string;
  isNew?: boolean;
  className?: string;
}

export function FeatureUnlockBadge({ 
  feature, 
  isNew = false,
  className 
}: FeatureUnlockBadgeProps) {
  const [isVisible, setIsVisible] = useState(isNew);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);

  useEffect(() => {
    if (isNew && !hasBeenSeen) {
      setIsVisible(true);
      
      // Marcar como visto após 10 segundos
      const timer = setTimeout(() => {
        setHasBeenSeen(true);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [isNew, hasBeenSeen]);

  const handleClick = () => {
    setIsVisible(false);
    setHasBeenSeen(true);
    // Salvar no localStorage que já foi visto
    const seenFeatures = JSON.parse(localStorage.getItem('seen_features') || '[]');
    if (!seenFeatures.includes(feature)) {
      localStorage.setItem('seen_features', JSON.stringify([...seenFeatures, feature]));
    }
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        "bg-gradient-to-r from-yellow-500 to-orange-500 text-white",
        "animate-pulse shadow-lg shadow-yellow-500/30",
        "hover:from-yellow-600 hover:to-orange-600 transition-all",
        className
      )}
    >
      <Sparkles className="w-3 h-3" />
      <span>NOVO</span>
    </button>
  );
}

// Badge simples para menu
export function NewBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
        "bg-gradient-to-r from-yellow-500 to-orange-500 text-white",
        "animate-pulse",
        className
      )}
    >
      🆕
    </span>
  );
}
