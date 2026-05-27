import React from 'react';
import { useLazySection } from '@/hooks/useLazySection';
import { cn } from '@/lib/utils';

interface LazySectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-in' | 'scale-in' | 'slide-left' | 'slide-right';
  delay?: number;
  id?: string;
  minHeight?: string;
}

export const LazySection: React.FC<LazySectionProps> = ({
  children,
  className,
  animation = 'fade-up',
  delay = 0,
  id,
  minHeight = '300px'
}) => {
  const { ref, isVisible } = useLazySection({ threshold: 0.1 });
  
  // Animações seguras usando apenas transform e opacity (não causam CLS)
  const animationClasses = {
    'fade-up': 'translate-y-8 opacity-0',
    'fade-in': 'opacity-0',
    'scale-in': 'scale-95 opacity-0',
    'slide-left': '-translate-x-8 opacity-0',
    'slide-right': 'translate-x-8 opacity-0'
  };
  
  const visibleClasses = 'translate-y-0 translate-x-0 scale-100 opacity-100';
  
  return (
    <div
      ref={ref}
      id={id}
      className={cn(
        'transition-all duration-700 ease-out will-change-transform',
        isVisible ? visibleClasses : animationClasses[animation],
        className
      )}
      style={{ 
        transitionDelay: isVisible ? `${delay}ms` : '0ms',
        contain: 'layout'
      }}
    >
      {isVisible ? children : (
        <div 
          className="md:min-h-[400px]" 
          style={{ minHeight }}
          role="presentation"
          aria-hidden="true"
        />
      )}
    </div>
  );
};
