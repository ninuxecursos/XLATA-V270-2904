import React from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useNavigate } from 'react-router-dom';
import { Clock, Crown, AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FEATURE_LABELS, FEATURE_KEYS, TIER_FEATURES } from '@/constants/featureAccess';

const PRO_EXCLUSIVE_FEATURES = [
  FEATURE_KEYS.ADVANCED_DASHBOARD,
  FEATURE_KEYS.PROFIT_PROJECTIONS,
  FEATURE_KEYS.ADVANCED_ANALYTICS,
  FEATURE_KEYS.EXPORT_CSV_EXCEL,
];

export const TrialCountdownBanner: React.FC = () => {
  const { isTrial, trialDaysRemaining, trialExpired } = useFeatureAccess();
  const navigate = useNavigate();

  if (!isTrial) return null;

  // Trial expired → show post-trial upgrade prompt
  if (trialExpired) {
    return (
      <div className="bg-gradient-to-r from-red-950/80 to-orange-950/80 border border-red-500/30 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-500/20 rounded-lg shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-red-300">
              Seu teste Pro expirou
            </h3>
            <p className="text-xs text-red-200/70 mt-1">
              Você perdeu acesso a funcionalidades avançadas:
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRO_EXCLUSIVE_FEATURES.map((feature) => (
                <span
                  key={feature}
                  className="text-[10px] px-2 py-0.5 bg-red-500/15 text-red-300 rounded-full border border-red-500/20"
                >
                  ✕ {FEATURE_LABELS[feature]}
                </span>
              ))}
            </div>
            <Button
              size="sm"
              onClick={() => navigate('/planos')}
              className="mt-3 h-7 text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
            >
              <Crown className="h-3 w-3 mr-1" />
              Fazer upgrade agora
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Active trial → show countdown
  const isUrgent = trialDaysRemaining !== null && trialDaysRemaining <= 2;

  return (
    <div
      className={`border rounded-xl p-4 mb-4 ${
        isUrgent
          ? 'bg-gradient-to-r from-amber-950/80 to-red-950/80 border-amber-500/30'
          : 'bg-gradient-to-r from-violet-950/60 to-indigo-950/60 border-violet-500/20'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-lg shrink-0 ${isUrgent ? 'bg-amber-500/20' : 'bg-violet-500/20'}`}>
            {isUrgent ? (
              <Clock className="h-5 w-5 text-amber-400" />
            ) : (
              <Zap className="h-5 w-5 text-violet-400" />
            )}
          </div>
          <div>
            <h3 className={`text-sm font-bold ${isUrgent ? 'text-amber-300' : 'text-violet-300'}`}>
              {isUrgent
                ? `⚡ Teste Pro termina em ${trialDaysRemaining} dia${trialDaysRemaining !== 1 ? 's' : ''}!`
                : `Teste Pro — ${trialDaysRemaining} dia${trialDaysRemaining !== 1 ? 's' : ''} restante${trialDaysRemaining !== 1 ? 's' : ''}`}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isUrgent
                ? 'Faça upgrade para não perder suas funcionalidades avançadas'
                : 'Você tem acesso completo a todas as funcionalidades Pro'}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/planos')}
          variant={isUrgent ? 'default' : 'outline'}
          className={`shrink-0 h-7 text-xs ${
            isUrgent
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0'
              : 'border-violet-500/30 text-violet-300 hover:bg-violet-500/10'
          }`}
        >
          <Crown className="h-3 w-3 mr-1" />
          Ver Planos
        </Button>
      </div>
    </div>
  );
};
