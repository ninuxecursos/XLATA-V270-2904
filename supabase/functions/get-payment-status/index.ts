import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Allowed origins for CORS - production and Lovable preview domains
const ALLOWED_ORIGINS = [
  'https://xlata.site',
  'https://www.xlata.site',
  'https://oxawvjcckmbevjztyfgp.supabase.co',
  'https://lovable.dev',
  'http://localhost:5173',
  'http://localhost:3000'
];

// Check if origin is allowed (including Lovable preview domains)
const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow Lovable preview domains
  if (origin.endsWith('.lovable.app') || 
      origin.endsWith('.lovable.dev') || 
      origin.endsWith('.lovableproject.com')) {
    return true;
  }
  return false;
};

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = isAllowedOrigin(origin) ? origin! : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // SECURITY: Validate JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authentication token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client with user's token to validate authentication
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Validate token and get user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('❌ Invalid token or user not found:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid authentication token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log(`🔐 Authenticated user: ${user.id}`);

    const { payment_id } = await req.json()

    if (!payment_id) {
      throw new Error('Payment ID is required')
    }

    console.log(`🔍 Checking payment status for: ${payment_id}`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get payment status from database
    const { data, error } = await supabase
      .from('mercado_pago_payments')
      .select('payment_id, status, status_detail, payer_email, external_reference, transaction_amount')
      .eq('payment_id', payment_id)
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      throw error
    }

    if (!data) {
      throw new Error('Payment not found')
    }

    console.log(`📋 Local payment status: ${data.status}, external_reference: ${data.external_reference}`)

   // SECURITY: Validate that the payment belongs to the authenticated user OR is a shop order
    const externalRef = data.external_reference || '';
   
   // Shop orders use "shop_order_UUID" format - these are public shop payments
   const isShopOrder = externalRef.startsWith('shop_order_');
   
   // User payments use "user_UUID_plan_TYPE" format - these require ownership validation
   if (!isShopOrder) {
     const paymentUserId = externalRef.split('_')[1];
     if (paymentUserId && paymentUserId !== user.id) {
       console.error(`❌ User ${user.id} tried to access payment from user ${paymentUserId}`);
       return new Response(
         JSON.stringify({ error: 'Forbidden - You can only access your own payments' }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
       );
     }
   } else {
     console.log(`✅ Shop order payment - skipping user ownership check`);
    }

    // IDEMPOTENCY CHECK FIRST - Check if subscription already exists for this payment
    const { data: existingPaymentSub } = await supabase
      .from('user_subscriptions')
      .select('id, expires_at, plan_type')
      .eq('payment_reference', payment_id)
      .maybeSingle()

    if (existingPaymentSub) {
      console.log(`ℹ️ Subscription already exists for payment ${payment_id} - returning status without re-activation`)
      return new Response(
        JSON.stringify({
          id: data.payment_id,
          status: data.status === 'pending' ? 'approved' : data.status, // If sub exists, payment was approved
          status_detail: data.status_detail,
          subscription_already_activated: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // If status is still pending, check with Mercado Pago API
    if (data.status === 'pending') {
      console.log(`🔄 Payment ${payment_id} is pending, checking with Mercado Pago API...`)
      
      const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
      if (!accessToken) {
        console.error('❌ MERCADOPAGO_ACCESS_TOKEN not configured')
        return new Response(
          JSON.stringify({
            id: data.payment_id,
            status: data.status,
            status_detail: data.status_detail
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      // Check payment status with Mercado Pago API
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (mpResponse.ok) {
        const paymentData = await mpResponse.json()
        const newStatus = paymentData.status
        const newStatusDetail = paymentData.status_detail

        console.log(`📡 Mercado Pago API response - Status: ${newStatus}, Detail: ${newStatusDetail}`)

        // Update payment status in database
        await supabase
          .from('mercado_pago_payments')
          .update({
            status: newStatus,
            status_detail: newStatusDetail,
            updated_at: new Date().toISOString()
          })
          .eq('payment_id', payment_id)

        console.log(`✅ Database updated with new status: ${newStatus}`)

        // If approved, activate subscription
        if (newStatus === 'approved') {
          await activateSubscription(supabase, { ...data, status: newStatus }, payment_id)
        }

        return new Response(
          JSON.stringify({
            id: payment_id,
            status: newStatus,
            status_detail: newStatusDetail
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      } else {
        console.error(`⚠️ Mercado Pago API error: ${mpResponse.status}`)
      }
    }

    // If payment is already approved but subscription might not be activated, try to activate
    if (data.status === 'approved') {
      console.log(`✅ Payment ${payment_id} is approved, attempting activation...`)
      await activateSubscription(supabase, data, payment_id)
    }

    // Return current status from database
    return new Response(
      JSON.stringify({
        id: data.payment_id,
        status: data.status,
        status_detail: data.status_detail
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Error getting payment status:', error)
    const origin = req.headers.get('origin');
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function activateSubscription(supabase: any, data: any, payment_id: string) {
  console.log(`🔑 Processing subscription activation for payment ${payment_id}`)

  // CRITICAL: Check idempotency FIRST before any other operations
  const { data: existingPaymentSub } = await supabase
    .from('user_subscriptions')
    .select('id, payment_reference')
    .eq('payment_reference', payment_id)
    .maybeSingle()

  if (existingPaymentSub) {
    console.log(`ℹ️ Subscription already activated for payment ${payment_id}, skipping...`)
    return
  }

  // Parse external_reference to extract user_id and plan_type
  const externalRef = data.external_reference
  if (!externalRef) {
    console.error('❌ No external_reference found in payment')
    return
  }

  console.log(`📋 External reference: ${externalRef}`)

  // Parse external_reference: "user_UUID_plan_PLANTYPE"
  const parts = externalRef.split('_')
  if (parts.length < 4 || parts[0] !== 'user' || parts[2] !== 'plan') {
    console.error(`❌ Invalid external_reference format: ${externalRef}`)
    return
  }

  const userId = parts[1]
  const planTypeFromRef = parts.slice(3).join('_')

  console.log(`👤 User ID: ${userId}, Plan Type from ref: ${planTypeFromRef}`)

  // Verify user exists
  const { data: userProfile, error: userError } = await supabase
    .from('profiles')
    .select('id, email, name')
    .eq('id', userId)
    .single()

  if (userError || !userProfile) {
    console.error(`❌ User not found with ID: ${userId}`, userError)
    return
  }

  console.log(`👤 Found user: ${userProfile.name || userProfile.email}`)

  // Get plan details - USE period_days column as source of truth
  let planData = null
  let periodDays = 30 // Default fallback

  // Strategy 1: Search by plan_type + is_active
  console.log(`🔍 Looking for plan with plan_type='${planTypeFromRef}'`)
  const { data: planByType } = await supabase
    .from('subscription_plans')
    .select('*, period_days')
    .eq('plan_type', planTypeFromRef)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (planByType) {
    planData = planByType
    console.log(`✅ Found plan: ${planData.name}, period_days: ${planData.period_days}`)
  } else {
    // Strategy 2: Search by plan_id
    const { data: planById } = await supabase
      .from('subscription_plans')
      .select('*, period_days')
      .eq('plan_id', planTypeFromRef)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (planById) {
      planData = planById
      console.log(`✅ Found plan by plan_id: ${planData.name}, period_days: ${planData.period_days}`)
    }
  }

  // Get period days - PRIORITIZE period_days column
  if (planData?.period_days && planData.period_days > 0) {
    periodDays = planData.period_days
  } else {
    periodDays = getPeriodDaysByType(planTypeFromRef)
  }

  console.log(`📅 Final period days: ${periodDays}`)

  // Get existing active subscription to calculate remaining days BEFORE any changes
  const { data: existingActiveSub } = await supabase
    .from('user_subscriptions')
    .select('id, expires_at, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Calculate base date for new subscription
  const now = new Date()
  let baseDate = now

  // If user has an active subscription with future expiration, accumulate from that date
  if (existingActiveSub?.expires_at) {
    const existingExpires = new Date(existingActiveSub.expires_at)
    if (existingExpires > now) {
      baseDate = existingExpires
      console.log(`📅 User has ${Math.ceil((existingExpires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days remaining, accumulating from: ${existingExpires.toISOString()}`)
    }
  }

  // Calculate expiration date first
  const expiresAt = new Date(baseDate)
  expiresAt.setDate(expiresAt.getDate() + periodDays)

  console.log(`📅 Creating subscription: ${baseDate.toISOString()} + ${periodDays} days = ${expiresAt.toISOString()}`)

  // Insert new subscription with unique payment_reference - this will be the active one
  const { data: newSub, error: insertError } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan_type: planData?.plan_type || planTypeFromRef,
      is_active: true,
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      payment_reference: payment_id,
      payment_method: 'mercadopago_pix'
    })
    .select()
    .single()

  if (insertError) {
    // Check if it's a unique constraint violation (already inserted)
    if (insertError.code === '23505') {
      console.log(`ℹ️ Subscription already inserted by another process for payment ${payment_id}`)
      return
    }
    console.error('❌ Error inserting subscription:', insertError)
    return
  }

  console.log(`✅ Subscription created! ID: ${newSub.id}, Expires: ${expiresAt.toISOString()}, Days: ${periodDays}`)

  // NOW deactivate all OTHER active subscriptions (after successful insert)
  const { error: deactivateError } = await supabase
    .from('user_subscriptions')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true)
    .neq('id', newSub.id) // Don't deactivate the one we just created!

  if (deactivateError) {
    console.error('⚠️ Error deactivating old subscriptions:', deactivateError)
  } else {
    console.log(`🔄 Deactivated other active subscriptions for user ${userId}`)
  }
}

// Fallback function based on plan_type string
function getPeriodDaysByType(planType: string): number {
  const typeLower = planType?.toLowerCase() || ''

  if (typeLower.includes('trial') || typeLower.includes('weekly') || typeLower.includes('semanal')) {
    return 7
  }
  if (typeLower.includes('monthly') || typeLower.includes('mensal')) {
    return 30
  }
  if (typeLower.includes('quarterly') || typeLower.includes('trimestral')) {
    return 90
  }
  if (typeLower.includes('biannual') || typeLower.includes('semi') || typeLower.includes('semestral')) {
    return 180
  }
  if (typeLower.includes('annual') || typeLower.includes('anual') || typeLower.includes('yearly')) {
    return 365
  }
  if (typeLower.includes('triennial') || typeLower.includes('trienal')) {
    return 1095
  }

  console.warn(`⚠️ Unknown plan type '${planType}', defaulting to 30 days`)
  return 30
}
