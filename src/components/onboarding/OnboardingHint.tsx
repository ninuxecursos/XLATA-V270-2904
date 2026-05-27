import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface OnboardingHintProps {
  targetSelector: string;
  message: string;
  isActive: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function OnboardingHint({ 
  targetSelector, 
  message, 
  isActive,
  position = 'top'
}: OnboardingHintProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isActive) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        setRect(element.getBoundingClientRect());
      }
    };

    const timer = setTimeout(updateRect, 100);

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [targetSelector, isActive]);

  if (!isActive || !rect) return null;

  const offset = isMobile ? 12 : 8;

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return {
          top: rect.top - offset,
          left: rect.left + rect.width / 2,
          transform: 'translate(-50%, -100%)'
        };
      case 'bottom':
        return {
          top: rect.bottom + offset,
          left: rect.left + rect.width / 2,
          transform: 'translateX(-50%)'
        };
      case 'left':
        return {
          top: rect.top + rect.height / 2,
          left: rect.left - offset,
          transform: 'translate(-100%, -50%)'
        };
      case 'right':
        return {
          top: rect.top + rect.height / 2,
          left: rect.right + offset,
          transform: 'translateY(-50%)'
        };
      default:
        return {};
    }
  };

  const arrowClasses = {
    top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-t-green-600 border-x-transparent border-b-transparent',
    bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-b-green-600 border-x-transparent border-t-transparent',
    left: 'right-0 top-1/2 translate-x-full -translate-y-1/2 border-l-green-600 border-y-transparent border-r-transparent',
    right: 'left-0 top-1/2 -translate-x-full -translate-y-1/2 border-r-green-600 border-y-transparent border-l-transparent'
  };

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={getPositionStyles()}
    >
      <div className={cn(
        "relative bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-xl animate-fade-in",
        isMobile 
          ? "text-sm px-4 py-3 rounded-xl max-w-[280px]" 
          : "text-xs px-3 py-1.5 rounded-lg max-w-[200px]"
      )}>
        <span className={cn(
          isMobile && "font-medium"
        )}>
          {message}
        </span>
        <div 
          className={cn(
            "absolute w-0 h-0",
            isMobile ? "border-[6px]" : "border-4",
            arrowClasses[position]
          )}
        />
      </div>
    </div>
  );
}
