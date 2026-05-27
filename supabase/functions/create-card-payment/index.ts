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

    const jwtToken = authHeader.replace('Bearer ', '');
    
    // Create Supabase client with user's token to validate authentication
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${jwtToken}` } } }
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

    const { 
      token, 
      transaction_amount, 
      description, 
      external_reference, 
      installments,
      payment_method_id,
      issuer_id,
      payer 
    } = await req.json()

    // SECURITY: Validate that external_reference contains the authenticated user's ID
    if (external_reference && !external_reference.includes(user.id)) {
      console.error(`❌ User ${user.id} tried to create payment for different user: ${external_reference}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot create payment for another user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Validate required fields
    if (!token || !transaction_amount || !description || !external_reference || !payer) {
      throw new Error('Missing required fields: token, transaction_amount, description, external_reference, payer')
    }

    // Validate transaction amount (prevent negative or zero values)
    const amount = parseFloat(transaction_amount);
    if (isNaN(amount) || amount <= 0 || amount > 100000) {
      throw new Error('Invalid transaction amount: must be between 0.01 and 100000')
    }

    // Create service role client to fetch access token from database
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Try to get Access Token from database first, then fallback to env
    const { data: configData } = await supabaseService
      .from('payment_gateway_config')
      .select('access_token_encrypted')
      .eq('gateway_name', 'mercado_pago')
      .eq('is_active', true)
      .single();

    const MERCADO_PAGO_ACCESS_TOKEN = 
      configData?.access_token_encrypted || 
      Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    
    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      throw new Error('Mercado Pago Access Token not configured. Configure via admin panel or Supabase secrets.')
    }

    console.log('Creating card payment:', {
      amount: transaction_amount,
      payer_email: payer.email ? `${payer.email.substring(0, 3)}***` : 'unknown',
      external_reference,
      installments
    })

    // Create payment on Mercado Pago with card token
    const paymentData: Record<string, unknown> = {
      transaction_amount: amount,
      token,
      description,
      installments: installments || 1,
      payment_method_id,
      external_reference,
      payer: {
        email: payer.email.trim().toLowerCase(),
        identification: payer.identification
      },
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-mercado-pago`
    }

    // Add issuer_id if provided
    if (issuer_id) {
      paymentData.issuer_id = issuer_id;
    }

    // Generate unique idempotency key for each payment request
    const idempotencyKey = `card_${external_reference}_${Date.now()}_${crypto.randomUUID()}`;
    console.log('Using idempotency key:', idempotencyKey);

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(paymentData)
    })

    const paymentResult = await response.json()

    if (!response.ok) {
      console.error('Mercado Pago API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: paymentResult
      })
      
      let errorMessage = 'Erro na API do Mercado Pago'
      if (paymentResult.message) {
        errorMessage = paymentResult.message
      } else if (paymentResult.cause && paymentResult.cause.length > 0) {
        errorMessage = paymentResult.cause[0].description || errorMessage
      }
      
      throw new Error(`${errorMessage} (Status: ${response.status})`)
    }

    // Save payment info to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: dbError } = await supabase
      .from('mercado_pago_payments')
      .insert({
        payment_id: paymentResult.id,
        external_reference,
        status: paymentResult.status,
        transaction_amount: paymentResult.transaction_amount,
        payer_email: payer.email,
        payment_method_id: paymentResult.payment_method_id,
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Database error:', dbError)
    }

    console.log('Card payment created:', {
      id: paymentResult.id,
      status: paymentResult.status,
      status_detail: paymentResult.status_detail
    })

    return new Response(
      JSON.stringify({
        id: paymentResult.id,
        status: paymentResult.status,
        status_detail: paymentResult.status_detail
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating card payment:', error)
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
