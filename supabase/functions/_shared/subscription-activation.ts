/**
 * Shared subscription activation logic for Edge Functions
 * Used by: get-payment-status, webhook-mercado-pago
 */

export interface PaymentData {
  payment_id: string;
  external_reference: string;
  payer_email?: string;
  transaction_amount?: number;
}

export interface ActivationResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
  userId?: string;
  planType?: string;
  expiresAt?: string;
}

/**
 * Activates a subscription for a user based on payment data
 * Includes idempotency checks to prevent duplicate activations
 */
export async function activateSubscription(
  supabase: any,
  payment: PaymentData
): Promise<ActivationResult> {
  const { payment_id, external_reference } = payment;
  
  console.log(`🔑 Processing subscription activation for payment ${payment_id}`);

  // CRITICAL: Check idempotency FIRST before any other operations
  const { data: existingPaymentSub } = await supabase
    .from('user_subscriptions')
    .select('id, payment_reference')
    .eq('payment_reference', payment_id)
    .maybeSingle();

  if (existingPaymentSub) {
    console.log(`ℹ️ Subscription already activated for payment ${payment_id}, skipping...`);
    return { success: true, skipped: true };
  }

  // Parse external_reference to extract user_id and plan_type
  if (!external_reference) {
    console.error('❌ No external_reference found in payment');
    return { success: false, error: 'No external_reference' };
  }

  console.log(`📋 External reference: ${external_reference}`);

  // Parse external_reference: "user_UUID_plan_PLANTYPE"
  const parts = external_reference.split('_');
  if (parts.length < 4 || parts[0] !== 'user' || parts[2] !== 'plan') {
    console.error(`❌ Invalid external_reference format: ${external_reference}`);
    return { success: false, error: 'Invalid external_reference format' };
  }

  const userId = parts[1];
  const planTypeFromRef = parts.slice(3).join('_');

  console.log(`👤 User ID: ${userId}, Plan Type from ref: ${planTypeFromRef}`);

  // Verify user exists
  const { data: userProfile, error: userError } = await supabase
    .from('profiles')
    .select('id, email, name')
    .eq('id', userId)
    .single();

  if (userError || !userProfile) {
    console.error(`❌ User not found with ID: ${userId}`, userError);
    return { success: false, error: 'User not found' };
  }

  console.log(`👤 Found user: ${userProfile.name || userProfile.email}`);

  // ==== PROMOTIONAL CAMPAIGN HANDLING ====
  // Format: campaign-<campaignId>-<periodDays>-<tier>
  let campaignId: string | null = null;
  let campaignTier: string | null = null;
  let campaignPeriodDays: number | null = null;
  let campaignBasePlanType: string | null = null;

  if (planTypeFromRef.startsWith('campaign-')) {
    // Parse: campaign, <uuid 5 parts>, <days>, <tier>
    // UUID has 4 dashes -> 5 segments. Total parts split by '-': 1 + 5 + 1 + 1 = 8
    const camParts = planTypeFromRef.split('-');
    if (camParts.length >= 8) {
      campaignId = camParts.slice(1, 6).join('-');
      campaignPeriodDays = parseInt(camParts[6]) || null;
      campaignTier = camParts[7] || 'pro';
      console.log(`🎯 Campaign payment detected: id=${campaignId}, days=${campaignPeriodDays}, tier=${campaignTier}`);

      // Buscar campanha no banco para validar e obter base_plan_id
      const { data: campaign } = await supabase
        .from('promotional_campaigns')
        .select('id, base_plan_id, promo_period_days')
        .eq('id', campaignId)
        .maybeSingle();

      if (campaign) {
        // Respect periodDays from external_reference (user may have picked a smaller promo option)
        campaignPeriodDays = campaignPeriodDays || campaign.promo_period_days;
        // Pegar plan_type real do plano base
        const { data: basePlan } = await supabase
          .from('subscription_plans')
          .select('plan_type, tier')
          .eq('plan_id', campaign.base_plan_id)
          .maybeSingle();
        campaignBasePlanType = basePlan?.plan_type || 'monthly';
        if (basePlan?.tier) campaignTier = basePlan.tier;
      }
    }
  }

  // Get plan details - USE period_days column as source of truth
  let planData: any = null;
  let periodDays = 30; // Default fallback

  if (campaignId && campaignPeriodDays) {
    periodDays = campaignPeriodDays;
    planData = { plan_type: campaignBasePlanType || 'monthly', tier: campaignTier || 'pro' };
    console.log(`📅 Using campaign period: ${periodDays} days, tier: ${campaignTier}`);
  } else {
    // Strategy 1: Search by plan_type + is_active
    console.log(`🔍 Looking for plan with plan_type='${planTypeFromRef}'`);
    const { data: planByType } = await supabase
      .from('subscription_plans')
      .select('*, period_days')
      .eq('plan_type', planTypeFromRef)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (planByType) {
      planData = planByType;
      console.log(`✅ Found plan: ${planData.name}, period_days: ${planData.period_days}`);
    } else {
      // Strategy 2: Search by plan_id
      const { data: planById } = await supabase
        .from('subscription_plans')
        .select('*, period_days')
        .eq('plan_id', planTypeFromRef)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (planById) {
        planData = planById;
        console.log(`✅ Found plan by plan_id: ${planData.name}, period_days: ${planData.period_days}`);
      }
    }

    // Get period days - PRIORITIZE period_days column
    if (planData?.period_days && planData.period_days > 0) {
      periodDays = planData.period_days;
    } else {
      periodDays = getPeriodDaysByType(planTypeFromRef);
    }
  }

  console.log(`📅 Final period days: ${periodDays}`);


  // Get existing active subscription to calculate remaining days BEFORE any changes
  const { data: existingActiveSub } = await supabase
    .from('user_subscriptions')
    .select('id, expires_at, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Calculate base date for new subscription
  const now = new Date();
  let baseDate = now;

  // If user has an active subscription with future expiration, accumulate from that date
  if (existingActiveSub?.expires_at) {
    const existingExpires = new Date(existingActiveSub.expires_at);
    if (existingExpires > now) {
      baseDate = existingExpires;
      console.log(`📅 User has ${Math.ceil((existingExpires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days remaining, accumulating from: ${existingExpires.toISOString()}`);
    }
  }

  // Calculate expiration date
  const expiresAt = new Date(baseDate);
  expiresAt.setDate(expiresAt.getDate() + periodDays);

  console.log(`📅 Creating subscription: ${baseDate.toISOString()} + ${periodDays} days = ${expiresAt.toISOString()}`);

  // Insert new subscription with unique payment_reference
  // Determine tier from plan data
  const tier = planData?.tier || determineTierFromPlanType(planData?.plan_type || planTypeFromRef);

  const { data: newSub, error: insertError } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan_type: planData?.plan_type || planTypeFromRef,
      tier,
      is_active: true,
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      payment_reference: payment_id,
      payment_method: 'mercadopago_pix'
    })
    .select()
    .single();

  if (insertError) {
    // Check if it's a unique constraint violation (already inserted by another process)
    if (insertError.code === '23505') {
      console.log(`ℹ️ Subscription already inserted by another process for payment ${payment_id}`);
      return { success: true, skipped: true };
    }
    console.error('❌ Error inserting subscription:', insertError);
    return { success: false, error: insertError.message };
  }

  console.log(`✅ Subscription created! ID: ${newSub.id}, Expires: ${expiresAt.toISOString()}, Days: ${periodDays}`);

  // NOW deactivate all OTHER active subscriptions (after successful insert)
  const { error: deactivateError } = await supabase
    .from('user_subscriptions')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true)
    .neq('id', newSub.id); // Don't deactivate the one we just created!

  if (deactivateError) {
    console.error('⚠️ Error deactivating old subscriptions:', deactivateError);
  } else {
    console.log(`🔄 Deactivated other active subscriptions for user ${userId}`);
  }

  // Mark promotional campaign view as converted (if applicable)
  if (campaignId) {
    const { error: convErr } = await supabase
      .from('promotional_campaign_views')
      .update({ converted: true })
      .eq('campaign_id', campaignId)
      .eq('user_id', userId);
    if (convErr) {
      console.error('⚠️ Error marking campaign view as converted:', convErr);
    } else {
      console.log(`🎯 Campaign ${campaignId} marked as converted for user ${userId}`);
    }

    // Link payment to campaign for analytics
    await supabase
      .from('mercado_pago_payments')
      .update({ campaign_id: campaignId })
      .eq('payment_id', payment_id);
  }


  return {
    success: true,
    userId,
    planType: planData?.plan_type || planTypeFromRef,
    expiresAt: expiresAt.toISOString()
  };
}

/**
 * Fallback function to determine subscription period based on plan type string
 */
export function getPeriodDaysByType(planType: string): number {
  const typeLower = planType?.toLowerCase() || '';

  if (typeLower.includes('trial') || typeLower.includes('weekly') || typeLower.includes('semanal')) {
    return 7;
  }
  if (typeLower.includes('monthly') || typeLower.includes('mensal')) {
    return 30;
  }
  if (typeLower.includes('quarterly') || typeLower.includes('trimestral')) {
    return 90;
  }
  if (typeLower.includes('biannual') || typeLower.includes('semi') || typeLower.includes('semestral')) {
    return 180;
  }
  if (typeLower.includes('annual') || typeLower.includes('anual') || typeLower.includes('yearly')) {
    return 365;
  }
  if (typeLower.includes('triennial') || typeLower.includes('trienal')) {
    return 1095;
}

/**
 * Determine the tier (essencial/controle/pro) from a plan_type string.
 * Plans map to tiers based on naming conventions.
 */
export function determineTierFromPlanType(planType: string): string {
  const typeLower = planType?.toLowerCase() || '';
  
  if (typeLower.includes('essencial')) return 'essencial';
  if (typeLower.includes('controle')) return 'controle';
  if (typeLower.includes('pro')) return 'pro';
  
  // Default: trial → essencial, paid plans → pro
  if (typeLower.includes('trial')) return 'essencial';
  
  return 'pro';
}

  console.warn(`⚠️ Unknown plan type '${planType}', defaulting to 30 days`);
  return 30;
}
