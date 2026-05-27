import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpCircle, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FEATURE_LABELS, FEATURE_MIN_TIER, type FeatureKey, type TierName } from '@/constants/featureAccess';
import { FEATURE_UPGRADE_MESSAGES, URGENCY_MESSAGES } from '@/constants/featureMessages';
import { cn } from '@/lib/utils';

const TIER_COLORS: Record<TierName, string> = {
  essencial: 'from-blue-600/20 to-blue-800/10 border-blue-500/30',
  pro: 'from-amber-600/20 to-amber-800/10 border-amber-500/30',
};

const TIER_BADGE: Record<TierName, string> = {
  essencial: 'bg-blue-500/20 text-blue-300',
  pro: 'bg-amber-500/20 text-amber-300',
};

const TIER_LABEL: Record<TierName, string> = {
  essencial: 'Essencial',
  pro: 'Pro',
};

interface UpgradePromptBannerProps {
  feature: FeatureKey;
  className?: string;
  compact?: boolean;
}

/**
 * Non-intrusive upgrade banner shown inline near locked features.
 * Uses contextual messaging based on the specific feature.
 */
export const UpgradePromptBanner = memo(function UpgradePromptBanner({
  feature,
  className,
  compact = false,
}: UpgradePromptBannerProps) {
  const navigate = useNavigate();
  const { hasFeature, loading } = useFeatureAccess();

  if (loading || hasFeature(feature)) return null;

  const requiredTier = FEATURE_MIN_TIER[feature];
  const msg = FEATURE_UPGRADE_MESSAGES[feature];
  const urgency = URGENCY_MESSAGES[Math.floor(Math.random() * URGENCY_MESSAGES.length)];

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-gradient-to-r',
        TIER_COLORS[requiredTier],
        className
      )}>
        <ArrowUpCircle className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs text-slate-300">
            {msg?.headline || FEATURE_LABELS[feature]} — 
            <span className={cn('ml-1 font-semibold', TIER_BADGE[requiredTier]?.split(' ')[1])}>
              Plano {TIER_LABEL[requiredTier]}
            </span>
          </span>
        </div>
        <Button
          onClick={() => navigate('/planos')}
          size="sm"
          className="bg-amber-500 hover:bg-amber-400 text-black text-xs h-7 px-3"
        >
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-2xl border p-5 bg-gradient-to-r',
      TIER_COLORS[requiredTier],
      className
    )}>
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-white font-semibold text-sm">{msg?.headline || FEATURE_LABELS[feature]}</h4>
            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', TIER_BADGE[requiredTier])}>
              {TIER_LABEL[requiredTier]}
            </span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">{msg?.description}</p>
          {msg?.benefit && (
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {msg.benefit}
            </p>
          )}
          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={() => navigate('/planos')}
              size="sm"
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
            >
              Fazer Upgrade
            </Button>
            <span className="text-[10px] text-amber-400/70 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" />
              {urgency}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
