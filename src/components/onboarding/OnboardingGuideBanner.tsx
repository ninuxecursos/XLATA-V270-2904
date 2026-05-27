import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Lightbulb, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface InstructionItem {
  text: string;
  done?: boolean;
}

interface OnboardingGuideBannerProps {
  /** Numero da etapa (1, 2 ou 3) */
  step: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
  instructions: InstructionItem[];
  /** Mensagem de sucesso quando todas instructions estiverem done */
  successMessage?: string;
  onSkip?: () => void;
  className?: string;
}

/**
 * Banner instrucional simples, responsivo e à prova de bugs.
 *
 * Substitui os antigos tutoriais com spotlight/MutationObserver — em vez de
 * tentar destacar elementos específicos (que somem quando o usuário abre um
 * modal), mostra uma lista clara de instruções no topo da página com
 * checkmarks que ligam automaticamente conforme o usuário avança.
 */
export function OnboardingGuideBanner({
  step,
  totalSteps = 3,
  title,
  subtitle,
  instructions,
  successMessage,
  onSkip,
  className,
}: OnboardingGuideBannerProps) {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);

  const completed = instructions.filter((i) => i.done).length;
  const allDone = instructions.length > 0 && completed === instructions.length;

  return (
    <div
      className={cn(
        'relative w-full rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/90 via-slate-900/95 to-slate-900/95 shadow-lg backdrop-blur-sm overflow-hidden',
        className
      )}
      data-onboarding-guide={step}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          {allDone ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <Lightbulb className="w-5 h-5 text-emerald-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
              Passo {step} de {totalSteps}
            </span>
            {!collapsed && (
              <span className="text-[11px] text-emerald-300/70">
                · {completed}/{instructions.length}
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base font-semibold text-white truncate">
            {title}
          </p>
          {!isMobile && subtitle && (
            <p className="text-xs text-slate-400 line-clamp-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onSkip && !isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSkip();
              }}
              className="h-8 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Pular guia
              <X className="w-3 h-3 ml-1" />
            </Button>
          )}
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="px-4 pb-4 pt-1 space-y-2">
          {subtitle && isMobile && (
            <p className="text-xs text-slate-400">{subtitle}</p>
          )}
          <ul className="space-y-1.5">
            {instructions.map((item, idx) => (
              <li
                key={idx}
                className={cn(
                  'flex items-start gap-2.5 text-sm rounded-lg px-2 py-1.5 transition-colors',
                  item.done
                    ? 'text-emerald-300 bg-emerald-500/10'
                    : 'text-slate-200'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 text-[10px] font-bold',
                    item.done
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-600 text-slate-400'
                  )}
                >
                  {item.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                </span>
                <span
                  className={cn(
                    'leading-snug',
                    item.done && 'line-through opacity-80'
                  )}
                >
                  {item.text}
                </span>
              </li>
            ))}
          </ul>

          {allDone && successMessage && (
            <div className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {onSkip && isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="w-full h-9 mt-2 text-xs text-slate-400 hover:text-white"
            >
              Pular guia de configuração
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
