import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface OnboardingSpotlightProps {
  targetRef: React.RefObject<HTMLElement>;
  isActive?: boolean;
  padding?: number;
  borderRadius?: number;
  onClick?: () => void;
}

export function OnboardingSpotlight({
  targetRef,
  isActive = true,
  padding = 8,
  borderRadius = 8,
  onClick
}: OnboardingSpotlightProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
  }, []);

  useEffect(() => {
    if (!targetRef.current || !isActive) return;

    const updateRect = () => {
      const targetRect = targetRef.current!.getBoundingClientRect();
      setRect(targetRect);
      setIsMobile(window.innerWidth < 640);
    };

    updateRect();

    // Scroll element into view com offset para mobile
    setTimeout(() => {
      targetRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }, 100);

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [targetRef, isActive]);

  // Reduzir padding em mobile
  const effectivePadding = isMobile ? Math.min(padding, 6) : padding;

  if (!isActive || !rect) return null;

  const spotlightStyle = {
    top: rect.top - effectivePadding,
    left: rect.left - effectivePadding,
    width: rect.width + effectivePadding * 2,
    height: rect.height + effectivePadding * 2,
    borderRadius: borderRadius
  };

  return (
    <>
      {/* Overlay escuro - pointer-events-none para não bloquear cliques */}
      <div 
        className="fixed inset-0 z-[9997] pointer-events-none"
        style={{
          background: `radial-gradient(
            ellipse at ${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px,
            transparent ${Math.max(rect.width, rect.height) / 2 + effectivePadding}px,
            rgba(0, 0, 0, 0.85) ${Math.max(rect.width, rect.height) / 2 + effectivePadding + (isMobile ? 30 : 50)}px
          )`
        }}
      />

      {/* Borda do spotlight - pointer-events-none para permitir cliques */}
      <div 
        className="fixed z-[9997] pointer-events-none border-2 border-green-500"
        style={spotlightStyle}
      >
        {/* Animação de pulso */}
        <div 
          className="absolute inset-0 border-2 border-green-400 animate-ping opacity-75"
          style={{ borderRadius: borderRadius }}
        />
      </div>
    </>
  );
}
