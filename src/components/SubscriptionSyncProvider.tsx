
import React, { useEffect, useContext } from 'react';
import { useSubscriptionSync } from '@/hooks/useSubscriptionSync';
import { AuthContext } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionSyncProviderProps {
  children: React.ReactNode;
}

export const SubscriptionSyncProvider: React.FC<SubscriptionSyncProviderProps> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user ?? null;
  const { syncSubscriptionData } = useSubscriptionSync();

  useEffect(() => {
    if (!user) return;

    syncSubscriptionData();
    
    const channel = supabase
      .channel(`subscription-sync-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          syncSubscriptionData();
        }
      )
      .subscribe();

    const handleSubscriptionUpdate = () => syncSubscriptionData();
    window.addEventListener('subscriptionUpdate', handleSubscriptionUpdate);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('subscriptionUpdate', handleSubscriptionUpdate);
    };
  }, [user?.id]);

  return <>{children}</>;
};
