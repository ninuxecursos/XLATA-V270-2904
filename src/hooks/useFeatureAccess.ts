import { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from '@/hooks/useAuth';
import { TIER_FEATURES, FEATURE_MIN_TIER, type FeatureKey, type TierName } from '@/constants/featureAccess';

interface UseFeatureAccessReturn {
  tier: TierName | null;
  hasFeature: (feature: FeatureKey) => boolean;
  hasAllFeatures: (features: FeatureKey[]) => boolean;
  hasAnyFeature: (features: FeatureKey[]) => boolean;
  getRequiredTier: (feature: FeatureKey) => TierName;
  availableFeatures: FeatureKey[];
  loading: boolean;
  isTrial: boolean;
  trialDaysRemaining: number | null;
  trialExpired: boolean;
}

const TIER_HIERARCHY: Record<TierName, number> = {
  essencial: 1,
  pro: 2,
};

/** Map legacy 'controle' tier to 'pro', keep 'essencial' as-is */
function normalizeTier(raw: string | null | undefined): TierName | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  if (lower === 'essencial') return 'essencial';
  if (lower === 'controle' || lower === 'pro') return 'pro';
  // Unknown tier — return null so user gets no features (safe default)
  return null;
}

const IS_OFFLINE_BUILD = (import.meta as any).env?.VITE_OFFLINE_BUILD === 'true';

export function useFeatureAccess(): UseFeatureAccessReturn {
  const authContext = useContext(AuthContext);
  const user = authContext?.user ?? null;
  const [tier, setTier] = useState<TierName | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTrial, setIsTrial] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);
  const [trialExpired, setTrialExpired] = useState(false);

  useEffect(() => {
    // ===== OFFLINE BUILD: TIER VEM DA LICENÇA LOCAL =====
    // O license.json empacotado decide o plano (essencial|pro). FeatureGuard
    // respeita esse tier exatamente como no online — quem comprou Essencial vê
    // os módulos PRO bloqueados, quem comprou Pro tem tudo liberado.
    if (IS_OFFLINE_BUILD) {
      setIsTrial(false);
      setTrialDaysRemaining(null);
      setTrialExpired(false);
      fetch('/api/license', { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data && data.valid) {
            setTier(normalizeTier(data.plan) || 'essencial');
          } else {
            setTier(null);
          }
        })
        .catch(err => {
          console.error('Offline license fetch error:', err);
          setTier(null);
        })
        .finally(() => setLoading(false));
      return;
    }

    if (!user) {
      setTier(null);
      setIsTrial(false);
      setTrialDaysRemaining(null);
      setTrialExpired(false);
      setLoading(false);
      return;
    }

    const fetchTier = async () => {
      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('tier, is_active, expires_at, plan_type')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('expires_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user tier:', error);
          setTier(null);
          setIsTrial(false);
          setTrialDaysRemaining(null);
          setTrialExpired(false);
        } else if (data && data.is_active) {
          const now = new Date();
          const expiresAt = new Date(data.expires_at);
          const isTrialPlan = data.plan_type === 'trial';
          const isExpired = expiresAt <= now;

          if (!isExpired) {
            if (isTrialPlan) {
              setTier('pro');
              setIsTrial(true);
              setTrialExpired(false);
              const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              setTrialDaysRemaining(Math.max(0, daysLeft));
            } else {
              setTier(normalizeTier(data.tier));
              setIsTrial(false);
              setTrialExpired(false);
              setTrialDaysRemaining(null);
            }
          } else {
            setTier(null);
            setIsTrial(isTrialPlan);
            setTrialExpired(isTrialPlan);
            setTrialDaysRemaining(isTrialPlan ? 0 : null);
          }
        } else {
          const { data: expiredTrial } = await supabase
            .from('user_subscriptions')
            .select('id, tier, plan_type')
            .eq('user_id', user.id)
            .eq('plan_type', 'trial')
            .limit(1)
            .maybeSingle();

          if (expiredTrial) {
            setTier(null);
            setIsTrial(true);
            setTrialExpired(true);
            setTrialDaysRemaining(0);
          } else {
            setTier(null);
            setIsTrial(false);
            setTrialDaysRemaining(null);
            setTrialExpired(false);
          }
        }
      } catch (err) {
        console.error('Error in useFeatureAccess:', err);
        setTier(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTier();

    const channel = supabase
      .channel(`feature-access-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_subscriptions',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchTier();
      })
      .subscribe();

    const handleSync = () => fetchTier();
    window.addEventListener('subscriptionSynced', handleSync);
    window.addEventListener('subscriptionCleared', handleSync);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('subscriptionSynced', handleSync);
      window.removeEventListener('subscriptionCleared', handleSync);
    };
  }, [user?.id]);

  const availableFeatures = useMemo<FeatureKey[]>(() => {
    if (!tier) return [];
    return TIER_FEATURES[tier] || [];
  }, [tier]);

  const hasFeature = useCallback((feature: FeatureKey): boolean => {
    if (!tier) return false;
    const requiredTier = FEATURE_MIN_TIER[feature];
    if (!requiredTier) return false;
    return TIER_HIERARCHY[tier] >= TIER_HIERARCHY[requiredTier];
  }, [tier]);

  const hasAllFeatures = useCallback((features: FeatureKey[]): boolean => {
    return features.every(f => hasFeature(f));
  }, [hasFeature]);

  const hasAnyFeature = useCallback((features: FeatureKey[]): boolean => {
    return features.some(f => hasFeature(f));
  }, [hasFeature]);

  const getRequiredTier = useCallback((feature: FeatureKey): TierName => {
    return FEATURE_MIN_TIER[feature] || 'pro';
  }, []);

  return {
    tier,
    hasFeature,
    hasAllFeatures,
    hasAnyFeature,
    getRequiredTier,
    availableFeatures,
    loading,
    isTrial,
    trialDaysRemaining,
    trialExpired,
  };
}
