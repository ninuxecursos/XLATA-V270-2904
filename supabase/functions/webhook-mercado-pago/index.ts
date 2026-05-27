import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://xlata.site',
  'https://www.xlata.site',
  'https://oxawvjcckmbevjztyfgp.supabase.co',
  'http://localhost:5173',
  'http://localhost:3000'
];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-request-id',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

// Sanitize webhook data for logging
const sanitizeForLog = (data: any): any => {
  if (!data) return data;
  const sanitized = { ...data };
  
  if (sanitized.payer_email) {
    sanitized.payer_email = `${sanitized.payer_email.substring(0, 3)}***`;
  }
  
  return sanitized;
};

// Get webhook secret from database with fallback to env
const getWebhookSecret = async (supabase: any): Promise<string | null> => {
  try {
    // First try to get from database
    const { data: config } = await supabase
      .from('payment_gateway_config')
      .select('webhook_secret')
      .eq('gateway_name', 'mercado_pago')
      .single()
    
    if (config?.webhook_secret) {
      console.log('🔑 Using webhook secret from database')
      return config.webhook_secret
    }
  } catch (error) {
    console.log('⚠️ Could not fetch webhook secret from database, trying env fallback')
  }
  
  // Fallback to environment variable
  const envSecret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET')
  if (envSecret) {
    console.log('🔑 Using webhook secret from environment variable')
    return envSecret
  }
  
  return null
}

// Get access token from database with fallback to env
const getAccessToken = async (supabase: any): Promise<string | null> => {
  try {
    // First try to get from database
    const { data: config } = await supabase
      .from('payment_gateway_config')
      .select('access_token_encrypted')
      .eq('gateway_name', 'mercado_pago')
      .single()
    
    if (config?.access_token_encrypted) {
      console.log('🔑 Using access token from database')
      return config.access_token_encrypted
    }
  } catch (error) {
    console.log('⚠️ Could not fetch access token from database, trying env fallback')
  }
  
  // Fallback to environment variable
  const envToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
  if (envToken) {
    console.log('🔑 Using access token from environment variable')
    return envToken
  }
  
  return null
}

// Validate webhook signature using HMAC-SHA256
const validateWebhookSignature = async (
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secret: string
): Promise<boolean> => {
  try {
    if (!secret) {
      console.error('❌ Webhook secret not available - rejecting webhook');
      return false;
    }

    const parts = xSignature.split(',');
    const ts = parts.find(p => p.startsWith('ts='))?.substring(3);
    const hash = parts.find(p => p.startsWith('v1='))?.substring(3);
    
    if (!ts || !hash) {
      console.error('❌ Invalid signature format - missing ts or hash');
      return false;
    }

    // Validate timestamp (reject webhooks older than 5 minutes)
    const timestampMs = parseInt(ts) * 1000;
    const now = Date.now();
    if (Math.abs(now - timestampMs) > 5 * 60 * 1000) {
      console.error('❌ Webhook timestamp too old or in future:', { 
        webhook_ts: new Date(timestampMs).toISOString(), 
        now: new Date(now).toISOString() 
      });
      return false;
    }

    // Create manifest string according to Mercado Pago docs
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    
    // Generate HMAC-SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(manifest);
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const computedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const isValid = computedHash === hash;
    
    if (!isValid) {
      console.error('❌ Webhook signature mismatch:', { 
        computed: computedHash.substring(0, 10) + '...', 
        received: hash.substring(0, 10) + '...' 
      });
    } else {
      console.log('✅ Webhook signature validated successfully');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Error validating webhook signature:', error);
    return false;
  }
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Create Supabase client early so we can use it for config
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Validate webhook signature
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    
    const webhookData = await req.json()
    
    if (xSignature && xRequestId && webhookData.data?.id) {
      // Get webhook secret from database or env
      const webhookSecret = await getWebhookSecret(supabase)
      
      if (!webhookSecret) {
        console.error('❌ No webhook secret configured in database or environment')
        return new Response(
          JSON.stringify({ error: 'Webhook secret not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const isValid = await validateWebhookSignature(xSignature, xRequestId, webhookData.data.id, webhookSecret);
      if (!isValid) {
        console.error('❌ Invalid webhook signature - rejecting request');
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (Deno.env.get('ENVIRONMENT') === 'production') {
      console.error('❌ Missing signature headers in production');
      return new Response(
        JSON.stringify({ error: 'Missing signature headers' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('📥 Webhook received (sanitized):', sanitizeForLog(webhookData))

    // Only process payment notifications
    if (webhookData.type !== 'payment') {
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    const paymentId = webhookData.data.id
    
    // Get access token from database or env
    const accessToken = await getAccessToken(supabase)
    if (!accessToken) {
      console.error('❌ No access token configured in database or environment')
      return new Response(
        JSON.stringify({ error: 'Access token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // IDEMPOTENCY CHECK FIRST - Check if subscription already exists for this payment
    const { data: existingPaymentSub } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('payment_reference', paymentId.toString())
      .maybeSingle()

    // Also check employee_slots for idempotency
    const { data: existingSlot } = await supabase
      .from('employee_slots')
      .select('id')
      .eq('payment_reference', paymentId.toString())
      .maybeSingle()

    if (existingPaymentSub || existingSlot) {
      console.log(`ℹ️ Record already exists for payment ${paymentId} - webhook idempotent return`)
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    // Get payment details from Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch payment: ${response.status}`)
    }

    const paymentData = await response.json()
    
    console.log(`📋 Payment from MP: status=${paymentData.status}, external_reference=${paymentData.external_reference}`)

    // Update payment status in database
    const { error } = await supabase
      .from('mercado_pago_payments')
      .update({
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        updated_at: new Date().toISOString()
      })
      .eq('payment_id', paymentId)

    if (error) {
      console.error('❌ Error updating payment status:', error)
      throw error
    }

    // Record in immutable payment_ledger for financial audit trail
    const externalRefParts = paymentData.external_reference?.split('_') || []
    const ledgerUserId = externalRefParts.length >= 2 && externalRefParts[0] === 'user' 
      ? externalRefParts[1] 
      : null

    if (ledgerUserId) {
      const { error: ledgerError } = await supabase
        .from('payment_ledger')
        .insert({
          user_id: ledgerUserId,
          amount: paymentData.transaction_amount,
          currency: paymentData.currency_id || 'BRL',
          provider: 'mercadopago',
          provider_event_id: paymentId.toString(),
          operation_type: 'payment',
          status: paymentData.status,
          metadata: {
            external_reference: paymentData.external_reference,
            payment_method: paymentData.payment_method_id,
            payer_email: sanitizeForLog({ payer_email: paymentData.payer?.email }).payer_email,
            status_detail: paymentData.status_detail
          }
        })

      if (ledgerError && ledgerError.code !== '23505') {
        console.error('⚠️ Failed to record in payment_ledger:', ledgerError)
      } else if (!ledgerError) {
        console.log('📒 Payment recorded in immutable ledger')
      }
    }

    console.log(`✅ Payment status updated to: ${paymentData.status}`)

    // If payment is approved, process based on external_reference type
    if (paymentData.status === 'approved') {
      console.log(`✅ Payment APPROVED!`)
      
      const externalRef = paymentData.external_reference || '';
      
      // Check if it's a shop order payment
      if (externalRef.startsWith('shop_order_')) {
        const orderId = externalRef.replace('shop_order_', '');
        console.log(`🛒 Processing shop order payment: ${orderId}`);
        
        // Decrement stock atomically now that payment is confirmed
        const { error: stockError } = await supabase.rpc('shop_confirm_order_stock', {
          p_order_id: orderId
        });
        
        if (stockError) {
          console.error(`⚠️ Error decrementing stock for order ${orderId}:`, stockError);
          // Don't fail the webhook - payment is approved, log the issue
        } else {
          console.log(`✅ Stock decremented for order ${orderId}`);
        }
        
        // Update order status to paid
        const { error: orderUpdateError } = await supabase
          .from('shop_orders')
          .update({ 
            status: 'paid',
            payment_method: 'pix',
            payment_id: paymentId.toString()
          })
          .eq('id', orderId);
        
        if (orderUpdateError) {
          console.error(`❌ Error updating shop order ${orderId}:`, orderUpdateError);
        } else {
          console.log(`✅ Shop order ${orderId} updated to paid status`);
        }
      } 
      // Check if it's an employee slot payment
      else if (externalRef.startsWith('employee_slot_')) {
        console.log(`👤 Processing employee slot payment...`)
        await activateEmployeeSlot(supabase, {
          payment_id: paymentId.toString(),
          external_reference: paymentData.external_reference,
          transaction_amount: paymentData.transaction_amount
        })
      }
      // Otherwise, process as subscription activation
      else if (externalRef.startsWith('user_')) {
        console.log(`📦 Processing subscription activation...`)
        await activateSubscription(supabase, {
          payment_id: paymentId.toString(),
          external_reference: paymentData.external_reference,
          payer_email: paymentData.payer?.email,
          transaction_amount: paymentData.transaction_amount
        })
      }
    }

    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    const origin = req.headers.get('origin');
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function activateEmployeeSlot(supabase: any, payment: any) {
  console.log(`👤 Processing employee slot for payment ${payment.payment_id}`)

  // Idempotency: check if slot already exists for this payment
  const { data: existingSlot } = await supabase
    .from('employee_slots')
    .select('id')
    .eq('payment_reference', payment.payment_id)
    .maybeSingle()

  if (existingSlot) {
    console.log(`ℹ️ Employee slot already exists for payment ${payment.payment_id}, skipping...`)
    return
  }

  // Parse external_reference: "employee_slot_UUID_TIMESTAMP"
  const parts = payment.external_reference.split('_')
  // employee_slot_UUID_TIMESTAMP => parts[0]='employee', parts[1]='slot', parts[2]=UUID, parts[3]=timestamp
  if (parts.length < 3) {
    console.error(`❌ Invalid employee_slot external_reference: ${payment.external_reference}`)
    return
  }

  const ownerId = parts[2]

  // Verify owner exists
  const { data: owner, error: ownerError } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('id', ownerId)
    .single()

  if (ownerError || !owner) {
    console.error(`❌ Owner not found: ${ownerId}`, ownerError)
    return
  }

  // Create slot with 30-day expiration
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + 30)

  const { data: newSlot, error: insertError } = await supabase
    .from('employee_slots')
    .insert({
      owner_user_id: ownerId,
      payment_reference: payment.payment_id,
      is_active: true,
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      amount_paid: payment.transaction_amount || 79.90,
    })
    .select()
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      console.log(`ℹ️ Employee slot already created by another process`)
      return
    }
    console.error('❌ Error creating employee slot:', insertError)
    return
  }

  console.log(`✅ Employee slot created! ID: ${newSlot.id}, Expires: ${expiresAt.toISOString()}`)
}

async function activateSubscription(supabase: any, payment: any) {
  console.log(`🔑 Processing subscription activation for payment ${payment.payment_id}`)

  // CRITICAL: Check idempotency FIRST before any other operations
  const { data: existingPaymentSub } = await supabase
    .from('user_subscriptions')
    .select('id, payment_reference')
    .eq('payment_reference', payment.payment_id)
    .maybeSingle()

  if (existingPaymentSub) {
    console.log(`ℹ️ Subscription already activated for payment ${payment.payment_id}, skipping...`)
    return
  }

  const externalRef = payment.external_reference
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

  // Get plan details
  let planData = null
  let periodDays = 30

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

  // Get period days
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

  // Insert new subscription - this will be the active one
  const { data: newSub, error: insertError } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan_type: planData?.plan_type || planTypeFromRef,
      is_active: true,
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      payment_reference: payment.payment_id,
      payment_method: 'mercadopago_pix'
    })
    .select()
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      console.log(`ℹ️ Subscription already inserted by another process for payment ${payment.payment_id}`)
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
