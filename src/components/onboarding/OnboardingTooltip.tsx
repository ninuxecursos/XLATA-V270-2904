import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingTooltipProps {
  targetRef: React.RefObject<HTMLElement>;
  title: string;
  description: string;
  step: number;
  totalSteps: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  onNext?: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
  isVisible?: boolean;
}

export function OnboardingTooltip({
  targetRef,
  title,
  description,
  step,
  totalSteps,
  position = 'bottom',
  onNext,
  onPrev,
  onSkip,
  isVisible = true
}: OnboardingTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  // Estado reativo para mobile/tablet
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!targetRef.current || !isVisible) return;

    const updatePosition = () => {
      const targetRect = targetRef.current!.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isMobileNow = viewportWidth < 1024;
      
      let top = 0;
      let left = 0;

      // Em mobile, SEMPRE usar left=16 e right=16 (CSS cuida da largura)
      if (isMobileNow) {
        left = 16;
        
        // Altura estimada do tooltip (será ajustada pelo CSS)
        const tooltipHeight = 200;
        
        // Decidir posição vertical baseado no espaço disponível
        const spaceBelow = viewportHeight - targetRect.bottom;
        const spaceAbove = targetRect.top;
        
        if (spaceBelow > tooltipHeight + 20 || spaceBelow > spaceAbove) {
          top = targetRect.bottom + 12;
        } else {
          top = Math.max(16, targetRect.top - tooltipHeight - 12);
        }
        
        // Garantir que não saia da tela verticalmente (considerando nav bottom)
        top = Math.max(16, Math.min(top, viewportHeight - tooltipHeight - 80));
      } else {
        // Desktop: calcular após ter dimensões
        requestAnimationFrame(() => {
          if (!tooltipRef.current) return;
          const tooltipRect = tooltipRef.current.getBoundingClientRect();
          
          switch (position) {
            case 'top':
              top = targetRect.top - tooltipRect.height - 12;
              left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
              break;
            case 'bottom':
              top = targetRect.bottom + 12;
              left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
              break;
            case 'left':
              top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
              left = targetRect.left - tooltipRect.width - 12;
              break;
            case 'right':
              top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
              left = targetRect.right + 12;
              break;
          }

          // Manter dentro da viewport
          const padding = 16;
          left = Math.max(padding, Math.min(left, viewportWidth - tooltipRect.width - padding));
          top = Math.max(padding, Math.min(top, viewportHeight - tooltipRect.height - padding));

          setCoords({ top, left });
        });
        return;
      }

      setCoords({ top, left });
    };

    // Executar após render
    requestAnimationFrame(updatePosition);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [targetRef, position, isVisible]);

  if (!isVisible) return null;

  const arrowClasses = {
    top: 'bottom-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
    bottom: 'top-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
    left: 'right-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
    right: 'left-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800'
  };

  return (
    <div
      ref={tooltipRef}
      className={cn(
        "fixed z-[9999] bg-gray-800 border border-gray-700 rounded-xl shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200",
        !isMobile && "w-80 max-w-sm"
      )}
      style={{ 
        top: coords.top, 
        left: isMobile ? 16 : coords.left,
        right: isMobile ? 16 : 'auto',
        width: isMobile ? 'calc(100% - 32px)' : undefined
      }}
    >
      {/* Arrow - apenas em desktop */}
      {!isMobile && (
        <div className={cn(
          "absolute w-0 h-0 border-[6px]",
          arrowClasses[position]
        )} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">
            {step}/{totalSteps}
          </span>
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        {onSkip && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-gray-300 text-sm">{description}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-gray-700 bg-gray-800/50">
        <div>
          {onPrev && step > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrev}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onSkip && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-gray-500 hover:text-gray-300"
            >
              Pular
            </Button>
          )}
          {onNext && (
            <Button
              size="sm"
              onClick={onNext}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {step === totalSteps ? 'Concluir' : 'Próximo'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
