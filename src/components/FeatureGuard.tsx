import React, { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowUpCircle, Sparkles, Zap, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FEATURE_LABELS, FEATURE_MIN_TIER, type FeatureKey, type TierName } from '@/constants/featureAccess';
import { FEATURE_UPGRADE_MESSAGES } from '@/constants/featureMessages';
import { PlanComparisonModal } from '@/components/PlanComparisonModal';
import { cn } from '@/lib/utils';

// Offline build: respeita o tier vindo de useFeatureAccess (que lê license.json)

const TIER_DISPLAY: Record<TierName, { label: string; color: string }> = {
  essencial: { label: 'Essencial', color: 'text-blue-400' },
  pro: { label: 'Pro', color: 'text-amber-400' },
};

interface FeatureGuardProps {
  feature: FeatureKey;
  children: React.ReactNode;
  showPreview?: boolean;
  lockedMessage?: string;
  className?: string;
  hideWhenLocked?: boolean;
}

export const FeatureGuard = memo(function FeatureGuard({
  feature,
  children,
  className,
  hideWhenLocked = false,
}: FeatureGuardProps) {
  const navigate = useNavigate();
  const { hasFeature, getRequiredTier, loading } = useFeatureAccess();
  const [showComparison, setShowComparison] = useState(false);

  if (loading) return <>{children}</>;

  const allowed = hasFeature(feature);
  if (allowed) return <>{children}</>;
  if (hideWhenLocked) return null;

  const requiredTier = getRequiredTier(feature);
  const tierInfo = TIER_DISPLAY[requiredTier];
  const msg = FEATURE_UPGRADE_MESSAGES[feature];

  return (
    <div className={cn('relative min-h-[60vh]', className)}>
      {/* Render children blurred behind overlay */}
      <div className="filter blur-md pointer-events-none select-none opacity-60">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-lg">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6 py-8">
          <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-white">
              {msg?.headline || FEATURE_LABELS[feature] || feature}
            </span>
          </div>

          <p className="text-sm text-slate-300">
            {msg?.description || `Faça upgrade para o plano ${tierInfo.label} para desbloquear.`}
          </p>

          {msg?.benefit && (
            <p className="text-xs text-amber-400/80 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {msg.benefit}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ArrowUpCircle className="w-4 h-4" />
            <span>Plano mínimo: <strong className={tierInfo.color}>{tierInfo.label}</strong></span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full mt-2">
            <Button
              onClick={() => navigate('/planos')}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold"
              size="lg"
            >
              Ver Planos
            </Button>
            <Button
              onClick={() => setShowComparison(true)}
              variant="ghost"
              size="lg"
              className="flex-1 text-slate-400 hover:text-white"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Comparar
            </Button>
          </div>
        </div>
      </div>

      <PlanComparisonModal
        open={showComparison}
        onOpenChange={setShowComparison}
        suggestedTier={requiredTier}
      />
    </div>
  );
});

export const FeatureGate = memo(function FeatureGate({
  feature,
  children,
  fallback,
}: {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasFeature, loading } = useFeatureAccess();

  if (loading) return <>{children}</>;
  if (hasFeature(feature)) return <>{children}</>;

  return fallback ? <>{fallback}</> : null;
});
