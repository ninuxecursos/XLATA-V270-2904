import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface OnboardingPulseProps {
  targetSelector: string;
  isActive: boolean;
  intensity?: 'subtle' | 'normal' | 'strong';
}

export function OnboardingPulse({ 
  targetSelector, 
  isActive, 
  intensity = 'subtle' 
}: OnboardingPulseProps) {
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

    // Delay inicial para garantir que o elemento está renderizado
    const timer = setTimeout(updateRect, 100);

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    // Observer para mudanças no DOM
    const observer = new MutationObserver(updateRect);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
      observer.disconnect();
    };
  }, [targetSelector, isActive]);

  if (!isActive || !rect) return null;

  const intensityClasses = {
    subtle: 'animate-pulse-subtle',
    normal: 'animate-pulse-normal',
    strong: 'animate-pulse-strong'
  };

  // Ajustes responsivos para mobile
  const borderWidth = isMobile ? 3 : 2;
  const offset = isMobile ? 6 : 4;

  return (
    <div
      className={cn(
        "fixed pointer-events-none z-40 border-green-500",
        isMobile ? "rounded-xl" : "rounded-lg",
        intensityClasses[intensity]
      )}
      style={{
        top: rect.top - offset,
        left: rect.left - offset,
        width: rect.width + (offset * 2),
        height: rect.height + (offset * 2),
        borderWidth: `${borderWidth}px`,
        borderStyle: 'solid',
      }}
    />
  );
}
