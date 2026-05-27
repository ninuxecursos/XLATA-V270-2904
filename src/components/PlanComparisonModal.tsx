import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import {
  FEATURE_KEYS,
  FEATURE_LABELS,
  TIER_FEATURES,
  type FeatureKey,
  type TierName,
} from '@/constants/featureAccess';
import { cn } from '@/lib/utils';

const ALL_FEATURES = Object.values(FEATURE_KEYS) as FeatureKey[];

const TIER_CONFIG: Record<TierName, { label: string; color: string; bg: string; border: string }> = {
  essencial: { label: 'Essencial', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  pro: { label: 'Pro', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
};

interface PlanComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedTier?: TierName;
}

export const PlanComparisonModal = memo(function PlanComparisonModal({
  open,
  onOpenChange,
  suggestedTier,
}: PlanComparisonModalProps) {
  const navigate = useNavigate();
  const { tier } = useFeatureAccess();

  const currentTier: TierName = tier || 'essencial';
  const recommendedTier: TierName = suggestedTier || 'pro';
  const currentConfig = TIER_CONFIG[currentTier];
  const recommendedConfig = TIER_CONFIG[recommendedTier];

  const currentFeatures = TIER_FEATURES[currentTier];
  const recommendedFeatures = TIER_FEATURES[recommendedTier];

  const newFeatures = recommendedFeatures.filter(f => !currentFeatures.includes(f));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f1729] border-slate-700/50 text-white max-w-[95vw] sm:max-w-3xl lg:max-w-4xl p-0 rounded-2xl overflow-y-auto max-h-[90vh] lg:max-h-none lg:overflow-visible">
        <DialogHeader className="px-5 sm:px-8 pt-5 sm:pt-8 pb-3 sm:pb-5">
          <DialogTitle className="text-base sm:text-xl lg:text-2xl font-bold text-center text-white">
            Compare seu plano
          </DialogTitle>
          <DialogDescription className="text-center text-slate-400 text-xs sm:text-sm">
            Veja o que você ganha fazendo upgrade
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 sm:px-8 pb-3 sm:pb-5">
          <div className="grid grid-cols-2 gap-2 sm:gap-5">
            {/* Current Plan */}
            <div className={cn('rounded-xl border p-3 sm:p-5 lg:p-6', currentConfig.border, 'bg-[#111827]')}>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 mb-0.5 sm:mb-1">Seu plano atual</p>
              <h3 className={cn('text-lg sm:text-2xl font-bold', currentConfig.color)}>{currentConfig.label}</h3>
              <div className="mt-3 sm:mt-5 space-y-1.5 sm:space-y-2.5">
                {ALL_FEATURES.map(f => {
                  const has = currentFeatures.includes(f);
                  return (
                    <div key={f} className="flex items-start gap-1.5 sm:gap-2.5">
                      {has ? (
                        <Check className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-slate-700 shrink-0 mt-0.5" />
                      )}
                      <span className={cn('text-[11px] sm:text-sm leading-tight', has ? 'text-slate-300' : 'text-slate-600')}>
                        {FEATURE_LABELS[f]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommended Plan */}
            <div className={cn('rounded-xl border p-3 sm:p-5 lg:p-6 relative', recommendedConfig.border, 'bg-[#111827]')}>
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 sm:px-4 py-0.5 sm:py-1 rounded-full bg-emerald-500 text-[9px] sm:text-xs font-bold text-white uppercase tracking-wide whitespace-nowrap">
                Recomendado
              </div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 mb-0.5 sm:mb-1">Upgrade para</p>
              <h3 className={cn('text-lg sm:text-2xl font-bold', recommendedConfig.color)}>{recommendedConfig.label}</h3>
              <div className="mt-3 sm:mt-5 space-y-1.5 sm:space-y-2.5">
                {ALL_FEATURES.map(f => {
                  const has = recommendedFeatures.includes(f);
                  const isNew = newFeatures.includes(f);
                  return (
                    <div key={f} className="flex items-start gap-1.5 sm:gap-2.5">
                      {has ? (
                        <Check className={cn('w-3.5 h-3.5 sm:w-5 sm:h-5 shrink-0 mt-0.5', isNew ? 'text-amber-400' : 'text-emerald-500')} />
                      ) : (
                        <X className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-slate-700 shrink-0 mt-0.5" />
                      )}
                      <span className={cn('text-[11px] sm:text-sm leading-tight', has ? (isNew ? 'text-amber-300 font-semibold' : 'text-slate-300') : 'text-slate-600')}>
                        {FEATURE_LABELS[f]}
                        {isNew && ' ✨'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* New features highlight + CTA */}
        <div className="px-4 sm:px-8 pb-5 sm:pb-8 space-y-3 sm:space-y-4 border-t border-slate-700/40 pt-3 sm:pt-5">
          {newFeatures.length > 0 && (
            <div className="p-2.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-[11px] sm:text-sm font-semibold text-amber-400 flex items-center gap-1 sm:gap-2 mb-1.5 sm:mb-2">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                +{newFeatures.length} funcionalidade{newFeatures.length > 1 ? 's' : ''} nova{newFeatures.length > 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                {newFeatures.map(f => (
                  <span key={f} className="text-[9px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-amber-500/20 text-amber-300">
                    {FEATURE_LABELS[f]}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => { onOpenChange(false); navigate('/planos'); }}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl h-11 sm:h-14 text-sm sm:text-base"
            size="lg"
          >
            Fazer Upgrade Agora
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
