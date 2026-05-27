import { supabase } from '@/integrations/supabase/client';

export interface Subscription {
  id: string;
  user_id: string;
  is_active: boolean;
  plan_type: 'trial' | 'monthly' | 'quarterly' | 'annual';
  expires_at: string;
  activated_at: string;
  created_at?: string;
  activation_method?: 'admin_manual' | 'payment' | 'trial';
  period_days?: number;
  tier?: string;
}

// Helper function to ensure user is authenticated
const ensureAuthenticated = async () => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }
  return userData.user;
};

// Initialize subscriptions table (check if it exists)
export const initializeSubscriptionsTable = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Subscriptions table not accessible:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking subscriptions table:', error);
    return false;
  }
};

// Check if user has ever used trial (including expired ones)
export const hasUserUsedTrial = async (userId: string): Promise<boolean> => {
  try {
    console.log('🔍 Verificando se usuário já usou teste gratuito:', userId);

    // Supabase is the source of truth
    const { data: trialRecord, error } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('plan_type', 'trial')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error checking trial usage in Supabase:', error);
      // Only fallback to localStorage when Supabase check fails
      return localStorage.getItem(`trial_used_${userId}`) === 'true';
    }

    if (trialRecord) {
      console.log('✅ Teste gratuito encontrado no Supabase (usado)');
      localStorage.setItem(`trial_used_${userId}`, 'true');
      return true;
    }

    // If no record exists anymore (e.g. admin cleared), reset local cache
    localStorage.removeItem(`trial_used_${userId}`);
    console.log('❌ Usuário ainda não usou teste gratuito');
    return false;
  } catch (error) {
    console.error('Error checking trial usage:', error);
    // Fallback only on unexpected runtime error
    return localStorage.getItem(`trial_used_${userId}`) === 'true';
  }
};

// Get user subscription with enhanced logging - prioritize real data
export const getUserSubscription = async (userId: string): Promise<Subscription | null> => {
  try {
    console.log('🔍 Buscando assinatura para usuário:', userId);
    
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }

    console.log('📋 Resultado da busca de assinatura:', {
      userId,
      found: !!data,
      data: data
    });

    if (!data) return null;

    return {
      id: data.id,
      user_id: data.user_id || userId,
      is_active: data.is_active || false,
      plan_type: (data.plan_type as any) || 'trial',
      expires_at: data.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      activated_at: data.activated_at || new Date().toISOString(),
      created_at: data.created_at || undefined,
      activation_method: (data as any).activation_method || 'trial',
      period_days: getPeriodDaysFromPlanType(data.plan_type) || 7
    };
  } catch (error) {
    console.error('Error in getUserSubscription:', error);
    return null;
  }
};

// Helper function to get period days from plan type
const getPeriodDaysFromPlanType = (planType: string | null): number => {
  switch (planType) {
    case 'trial': return 7;
    case 'monthly': return 30;
    case 'quarterly': return 90;
    case 'annual': return 365;
    default: return 7;
  }
};

// Get all subscriptions (admin only) with enhanced filtering and real data priority
export const getAllSubscriptions = async (): Promise<Subscription[]> => {
  try {
    const user = await ensureAuthenticated();
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single();

    if (!profile || profile.status !== 'admin') {
      throw new Error('Access denied: Admin privileges required');
    }

    console.log('🔍 Admin buscando todas as assinaturas diretamente da tabela user_subscriptions...');

    // Get all subscriptions directly from user_subscriptions table
    const { data: subscriptionsData, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all subscriptions:', error);
      return [];
    }

    console.log('📋 Raw subscription data from Supabase:', subscriptionsData);

    // Also get user data for reference
    const { data: usersData } = await supabase
      .from('profiles')
      .select('id, email, name');

    const userMap = new Map(usersData?.map(u => [u.id, u]) || []);

    const mappedSubscriptions = subscriptionsData?.map(item => {
      const user = userMap.get(item.user_id || '');
      console.log(`📋 Processing subscription for user ${user?.email}:`, {
        is_active: item.is_active,
        plan_type: item.plan_type,
        expires_at: item.expires_at,
        user_id: item.user_id
      });

      return {
        id: item.id,
        user_id: item.user_id || '',
        is_active: item.is_active || false,
        plan_type: (item.plan_type as any) || 'trial',
        expires_at: item.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        activated_at: item.activated_at || new Date().toISOString(),
        created_at: item.created_at || undefined,
        activation_method: (item as any).activation_method || 'trial',
        period_days: getPeriodDaysFromPlanType(item.plan_type) || 7
      };
    }) || [];

    console.log('📋 Final mapped subscriptions:', {
      total: mappedSubscriptions.length,
      active: mappedSubscriptions.filter(s => s.is_active && new Date(s.expires_at) > new Date()).length
    });

    return mappedSubscriptions;
  } catch (error) {
    console.error('Error in getAllSubscriptions:', error);
    return [];
  }
};

// Create or update subscription with validated plan_type
export const upsertSubscription = async (subscription: Omit<Subscription, 'id' | 'created_at'>): Promise<Subscription | null> => {
  try {
    const user = await ensureAuthenticated();
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single();

    if (!profile || profile.status !== 'admin') {
      throw new Error('Access denied: Admin privileges required');
    }

    console.log('✅ Admin verification passed, creating subscription for user:', subscription.user_id);

    // First, deactivate any existing active subscriptions for this user
    console.log('🔄 Deactivating existing subscriptions...');
    
    const { error: deactivateError } = await supabase
      .from('user_subscriptions')
      .update({ is_active: false })
      .eq('user_id', subscription.user_id)
      .eq('is_active', true);

    if (deactivateError) {
      console.error('⚠️ Error deactivating existing subscriptions:', deactivateError);
    } else {
      console.log('✅ Existing subscriptions deactivated');
    }

    // Ensure plan_type is valid according to database constraints
    const validPlanTypes = ['trial', 'monthly', 'quarterly', 'annual'];
    const planType = validPlanTypes.includes(subscription.plan_type) ? subscription.plan_type : 'trial';
    
    console.log('📝 Creating new subscription with validated plan_type:', {
      user_id: subscription.user_id,
      plan_type: planType,
      original_plan_type: subscription.plan_type,
      expires_at: subscription.expires_at,
      activated_at: subscription.activated_at,
      is_active: subscription.is_active
    });

    const insertData = {
      user_id: subscription.user_id,
      is_active: subscription.is_active,
      plan_type: planType,
      expires_at: subscription.expires_at,
      activated_at: subscription.activated_at || new Date().toISOString()
    };

    const { data: createdData, error: insertError } = await supabase
      .from('user_subscriptions')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating subscription:', insertError);
      throw new Error(`Failed to create subscription: ${insertError.message}`);
    }

    console.log('🎉 Subscription created successfully in user_subscriptions:', createdData);
    
    // Trigger immediate synchronization for the target user
    console.log('⚡ Triggering immediate sync for user:', subscription.user_id);
    
    // Dispatch custom event to trigger sync on all connected clients
    window.dispatchEvent(new CustomEvent('adminSubscriptionCreated', {
      detail: { 
        userId: subscription.user_id,
        subscription: createdData
      }
    }));
    
    const result = {
      id: createdData.id,
      user_id: createdData.user_id || subscription.user_id,
      is_active: createdData.is_active || false,
      plan_type: (createdData.plan_type as any) || planType,
      expires_at: createdData.expires_at || subscription.expires_at,
      activated_at: createdData.activated_at || subscription.activated_at,
      created_at: createdData.created_at || undefined,
      activation_method: subscription.activation_method || 'admin_manual',
      period_days: subscription.period_days || getPeriodDaysFromPlanType(planType)
    };
    
    return result;
    
  } catch (error) {
    console.error('💥 Error in upsertSubscription:', error);
    throw error;
  }
};

// Activate free trial for user - ENHANCED with permanent trial usage tracking
export const activateFreeTrial = async (userId: string): Promise<Subscription | null> => {
  try {
    console.log('🎯 Ativando teste gratuito para usuário:', userId);
    
    // CRITICAL: Check if user already used trial (including expired ones)
    const hasUsedTrial = await hasUserUsedTrial(userId);
    if (hasUsedTrial) {
      console.log('❌ Usuário já utilizou o teste gratuito anteriormente');
      throw new Error('Usuário já utilizou o teste gratuito de 7 dias');
    }

    // Check if user currently has any active subscription
    const currentSubscription = await getUserSubscription(userId);
    if (currentSubscription && currentSubscription.is_active && new Date(currentSubscription.expires_at) > new Date()) {
      console.log('❌ Usuário já possui assinatura ativa');
      throw new Error('Usuário já possui uma assinatura ativa');
    }

    // Deactivate any existing active subscriptions
    const { error: deactivateError } = await supabase
      .from('user_subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (deactivateError) {
      console.error('⚠️ Error deactivating existing subscriptions:', deactivateError);
    }

    // Create trial subscription
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const trialData = {
      user_id: userId,
      is_active: true,
      plan_type: 'trial',
      tier: 'pro',
      expires_at: expiresAt.toISOString(),
      activated_at: now.toISOString()
    };

    console.log('📝 Criando assinatura de teste:', trialData);

    const { data: createdTrial, error: createError } = await supabase
      .from('user_subscriptions')
      .insert(trialData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating trial subscription:', createError);
      throw new Error(`Falha ao ativar teste gratuito: ${createError.message}`);
    }

    console.log('🎉 Teste gratuito ativado com sucesso:', createdTrial);

    // CRITICAL: Permanently mark trial as used
    localStorage.setItem(`trial_used_${userId}`, 'true');
    console.log('✅ Teste gratuito marcado como usado permanentemente');

    // Update localStorage for immediate sync
    const subscriptionData = {
      is_active: true,
      expires_at: createdTrial.expires_at,
      plan_type: 'trial',
      activated_at: createdTrial.activated_at,
      activation_method: 'trial',
      period_days: 7,
      user_id: userId,
      sync_timestamp: new Date().toISOString()
    };

    localStorage.setItem(`subscription_${userId}`, JSON.stringify(subscriptionData));
    localStorage.setItem(`user_subscription_${userId}`, JSON.stringify({
      hasActiveSubscription: true,
      subscriptionType: 'trial',
      expiresAt: createdTrial.expires_at,
      isTrialUsed: true,
      activatedBy: 'user',
      activatedAt: createdTrial.activated_at,
      periodDays: 7,
      sync_timestamp: new Date().toISOString()
    }));
    localStorage.setItem(`subscription_status_${userId}`, JSON.stringify({
      isActive: true,
      type: 'trial',
      expiresAt: createdTrial.expires_at,
      periodDays: 7,
      sync_timestamp: new Date().toISOString()
    }));

    // Dispatch sync event
    window.dispatchEvent(new CustomEvent('subscriptionSynced', {
      detail: { 
        userId: userId,
        subscription: subscriptionData
      }
    }));

    return {
      id: createdTrial.id,
      user_id: createdTrial.user_id,
      is_active: createdTrial.is_active,
      plan_type: 'trial',
      expires_at: createdTrial.expires_at,
      activated_at: createdTrial.activated_at,
      created_at: createdTrial.created_at,
      activation_method: 'trial',
      period_days: 7
    };

  } catch (error) {
    console.error('💥 Error in activateFreeTrial:', error);
    throw error;
  }
};

// Deactivate subscription with immediate sync
export const deactivateSubscription = async (userId: string): Promise<boolean> => {
  try {
    const user = await ensureAuthenticated();
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single();

    if (!profile || profile.status !== 'admin') {
      throw new Error('Access denied: Admin privileges required');
    }

    console.log('🗑️ Admin deactivating subscription for user:', userId);

    const { error } = await supabase
      .from('user_subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error deactivating subscription:', error);
      return false;
    }

    console.log('✅ Subscription deactivated successfully for user:', userId);
    
    // Trigger immediate sync for the target user
    window.dispatchEvent(new CustomEvent('adminSubscriptionDeactivated', {
      detail: { userId }
    }));
    
    return true;
  } catch (error) {
    console.error('Error in deactivateSubscription:', error);
    return false;
  }
};

// Check if user has active subscription with real-time verification
export const hasActiveSubscription = async (userId: string): Promise<boolean> => {
  try {
    console.log('🔍 Verificando assinatura ativa em tempo real para:', userId);
    
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      console.log('❌ Nenhuma assinatura encontrada');
      return false;
    }
    
    const now = new Date();
    const expiresAt = new Date(subscription.expires_at);
    const isActive = subscription.is_active && expiresAt > now;
    
    console.log('🔍 Resultado da verificação:', {
      userId,
      isActive,
      expires_at: subscription.expires_at,
      current_time: now.toISOString()
    });
    
    return isActive;
  } catch (error) {
    console.error('Error checking active subscription:', error);
    return false;
  }
};

// Force sync subscription for a specific user (admin function)
export const forceSyncUserSubscription = async (userId: string): Promise<boolean> => {
  try {
    const user = await ensureAuthenticated();
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single();

    if (!profile || profile.status !== 'admin') {
      throw new Error('Access denied: Admin privileges required');
    }

    console.log('🔄 Admin forcing sync for user:', userId);
    
    // Trigger sync event for the specific user
    window.dispatchEvent(new CustomEvent('forceUserSync', {
      detail: { userId }
    }));
    
    return true;
  } catch (error) {
    console.error('Error in forceSyncUserSubscription:', error);
    return false;
  }
};

export const migrateLocalStorageToSupabase = async () => {
  console.log('Migration not needed - using only Supabase now');
  return { success: 0, failed: 0 };
};
