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

// Sanitize data for logging (remove sensitive information)
const sanitizeForLog = (data: any): any => {
  if (!data) return data;
  const sanitized = { ...data };
  
  // Remove sensitive fields
  const sensitiveFields = ['access_token', 'authorization', 'token', 'password', 'secret', 'api_key'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  // Sanitize nested payer info
  if (sanitized.payer) {
    sanitized.payer = {
      ...sanitized.payer,
      email: sanitized.payer.email ? `${sanitized.payer.email.substring(0, 3)}***` : undefined,
      identification: sanitized.payer.identification ? { type: sanitized.payer.identification.type, number: '***' } : undefined
    };
  }
  
  return sanitized;
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

    const { payer, transaction_amount, description, external_reference, payment_method_id } = await req.json()

    // SECURITY: Validate that external_reference contains the authenticated user's ID
    if (external_reference && !external_reference.includes(user.id)) {
      console.error(`❌ User ${user.id} tried to create payment for different user: ${external_reference}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot create payment for another user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Validate required fields
    if (!payer || !transaction_amount || !description || !external_reference) {
      throw new Error('Missing required fields: payer, transaction_amount, description, external_reference')
    }

    if (!payer.name || !payer.email || !payer.phone || !payer.identification) {
      throw new Error('Missing required payer fields: name, email, phone, identification')
    }

    // Validate transaction amount (prevent negative or zero values)
    const amount = parseFloat(transaction_amount);
    if (isNaN(amount) || amount <= 0 || amount > 100000) {
      throw new Error('Invalid transaction amount: must be between 0.01 and 100000')
    }

    // SECURITY: For employee_slot payments, validate amount against admin config (backend-only)
    if (external_reference?.startsWith('employee_slot_')) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      const { data: adminCfg } = await supabaseAdmin
        .from('admin_system_config')
        .select('employee_slot_price')
        .limit(1)
        .maybeSingle();
      const expected = Number(adminCfg?.employee_slot_price ?? 79.90);
      if (Math.abs(amount - expected) > 0.01) {
        console.error(`❌ employee_slot price mismatch: got ${amount}, expected ${expected}`);
        return new Response(
          JSON.stringify({ error: 'Invalid amount for employee slot payment' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
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

    console.log('Creating PIX payment:', {
      amount: transaction_amount,
      payer_email: payer.email ? `${payer.email.substring(0, 3)}***` : 'unknown',
      external_reference
    })

    // Clean and format phone number
    const cleanPhone = payer.phone.replace(/\D/g, '');
    const areaCode = cleanPhone.substring(0, 2);
    const phoneNumber = cleanPhone.substring(2);

    // Split full name into first and last name
    const fullName = payer.name.trim();
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'Nome';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Sobrenome';

    // Create payment on Mercado Pago
    const paymentData = {
      transaction_amount: amount,
      description,
      payment_method_id,
      external_reference,
      payer: {
        first_name: firstName,
        last_name: lastName,
        email: payer.email.trim().toLowerCase(),
        phone: {
          area_code: areaCode,
          number: phoneNumber
        },
        identification: {
          type: payer.identification.type,
          number: payer.identification.number
        }
      },
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-mercado-pago`
    }

    console.log('Payment data prepared (sanitized):', sanitizeForLog(paymentData))

    // Generate unique idempotency key for each payment request
    // This ensures a NEW payment is created each time, even for the same user/plan
    const idempotencyKey = `${external_reference}_${Date.now()}_${crypto.randomUUID()}`;
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

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Mercado Pago API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      
      let errorMessage = 'Erro na API do Mercado Pago'
      if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData.cause && errorData.cause.length > 0) {
        errorMessage = errorData.cause[0].description || errorMessage
      }
      
      throw new Error(`${errorMessage} (Status: ${response.status})`)
    }

    const paymentResult = await response.json()

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
        qr_code: paymentResult.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: paymentResult.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: paymentResult.point_of_interaction?.transaction_data?.ticket_url,
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Database error:', dbError)
    }

    return new Response(
      JSON.stringify({
        id: paymentResult.id,
        status: paymentResult.status,
        qr_code: paymentResult.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: paymentResult.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: paymentResult.point_of_interaction?.transaction_data?.ticket_url
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating PIX payment:', error)
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
