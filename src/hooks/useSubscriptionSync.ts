import { useCallback, useRef, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from './useAuth';

export const useSubscriptionSync = () => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user ?? null;
  const lastSyncRef = useRef<number>(0);
  const SYNC_DEBOUNCE = 2000;

  const syncSubscriptionData = useCallback(async () => {
    if (!user) return;

    const now = Date.now();
    if (now - lastSyncRef.current < SYNC_DEBOUNCE) {
      return;
    }
    lastSyncRef.current = now;

    try {
      const { data: subscriptions, error } = await supabase
        .from('user_subscriptions')
        .select('id, is_active, expires_at, plan_type, activated_at, tier')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('expires_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Erro ao buscar assinatura:', error);
        return;
      }

      const subscription = subscriptions?.[0];

      if (subscription) {
        const isValid = subscription.is_active && new Date(subscription.expires_at) > new Date();
        
        if (isValid) {
          const validPlanTypes = ['trial', 'monthly', 'quarterly', 'annual', 'biannual', 'triennial'];
          const planType = validPlanTypes.includes(subscription.plan_type) ? subscription.plan_type : 'trial';
          
          const subscriptionData = {
            is_active: subscription.is_active,
            expires_at: subscription.expires_at,
            plan_type: planType,
            tier: subscription.tier || 'pro',
            activated_at: subscription.activated_at,
            period_days: getPeriodDays(planType),
            user_id: user.id,
            sync_timestamp: new Date().toISOString()
          };

          localStorage.setItem(`subscription_${user.id}`, JSON.stringify(subscriptionData));
          
          window.dispatchEvent(new CustomEvent('subscriptionSynced', {
            detail: { userId: user.id, subscription: subscriptionData }
          }));
        } else {
          clearSubscriptionData(user.id);
          window.dispatchEvent(new CustomEvent('subscriptionCleared', { detail: { userId: user.id } }));
        }
      } else {
        clearSubscriptionData(user.id);
        window.dispatchEvent(new CustomEvent('subscriptionCleared', { detail: { userId: user.id } }));
      }
    } catch (error) {
      console.error('Erro ao sincronizar assinatura:', error);
    }
  }, [user]);

  const getPeriodDays = (planType: string): number => {
    const periods: Record<string, number> = {
      trial: 7, monthly: 30, quarterly: 90, biannual: 180, annual: 365, triennial: 1095
    };
    return periods[planType] || 7;
  };

  const clearSubscriptionData = (userId: string) => {
    localStorage.removeItem(`subscription_${userId}`);
    localStorage.removeItem(`user_subscription_${userId}`);
    localStorage.removeItem(`subscription_status_${userId}`);
    // Disparar evento para limpar caches em memória (AuthGuardOptimized, SubscriptionOptimizedContext)
    window.dispatchEvent(new CustomEvent('subscriptionCleared', { detail: { userId } }));
  };

  return { syncSubscriptionData };
};
