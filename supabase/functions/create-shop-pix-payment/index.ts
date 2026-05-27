import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://xlata.site',
  'https://www.xlata.site',
  'https://oxawvjcckmbevjztyfgp.supabase.co',
  'https://lovable.dev',
  'http://localhost:5173',
  'http://localhost:3000'
];

const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

const sanitizeForLog = (data: any): any => {
  if (!data) return data;
  const sanitized = { ...data };
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
    // NO JWT validation - this is for shop users (ShopAuthContext)
    const { payer, transaction_amount, description, external_reference, order_id } = await req.json()

    // Validate required fields
    if (!payer || !transaction_amount || !order_id) {
      throw new Error('Missing required fields: payer, transaction_amount, order_id')
    }

    if (!payer.name || !payer.email || !payer.phone || !payer.identification) {
      throw new Error('Missing required payer fields: name, email, phone, identification')
    }

    // SECURITY: Ignore transaction_amount from frontend, use order total from DB
    // This prevents payment manipulation attacks

    // Create service role client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate order exists and belongs to shop
    const { data: orderData, error: orderError } = await supabase
      .from('shop_orders')
      .select('id, total, status')
      .eq('id', order_id)
      .single();

    if (orderError || !orderData) {
      console.error('❌ Order not found:', order_id, orderError);
      throw new Error('Order not found');
    }

    if (orderData.status === 'paid') {
      throw new Error('Order already paid');
    }

    // SECURITY: Use the order total from the database, not from the request
    const amount = parseFloat(orderData.total);
    if (isNaN(amount) || amount <= 0 || amount > 100000) {
      throw new Error('Invalid order amount in database');
    }

    // Get Access Token from database or env
    const { data: configData } = await supabase
      .from('payment_gateway_config')
      .select('access_token_encrypted')
      .eq('gateway_name', 'mercado_pago')
      .eq('is_active', true)
      .single();

    const MERCADO_PAGO_ACCESS_TOKEN = 
      configData?.access_token_encrypted || 
      Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    
    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      throw new Error('Mercado Pago Access Token not configured')
    }

    const shopExternalReference = external_reference || `shop_order_${order_id}`;

    console.log('Creating Shop PIX payment:', sanitizeForLog({
      amount: transaction_amount,
      payer,
      external_reference: shopExternalReference
    }));

    // Clean and format phone number
    const cleanPhone = payer.phone.replace(/\D/g, '');
    const areaCode = cleanPhone.substring(0, 2);
    const phoneNumber = cleanPhone.substring(2);

    // Split full name
    const fullName = payer.name.trim();
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'Nome';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Sobrenome';

    // Create payment on Mercado Pago
    const paymentData = {
      transaction_amount: amount,
      description: description || `Pedido XLata Shop #${order_id.substring(0, 8)}`,
      payment_method_id: 'pix',
      external_reference: shopExternalReference,
      payer: {
        first_name: firstName,
        last_name: lastName,
        email: payer.email.trim().toLowerCase(),
        phone: {
          area_code: areaCode,
          number: phoneNumber
        },
        identification: {
          type: payer.identification.type || 'CPF',
          number: payer.identification.number.replace(/\D/g, '')
        }
      },
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-mercado-pago`
    }

    console.log('Payment data prepared (sanitized):', sanitizeForLog(paymentData))

    const idempotencyKey = `shop_pix_${order_id}_${Date.now()}_${crypto.randomUUID()}`;
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
    const { error: dbError } = await supabase
      .from('mercado_pago_payments')
      .insert({
        payment_id: paymentResult.id,
        external_reference: shopExternalReference,
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

    console.log('✅ Shop PIX payment created:', {
      id: paymentResult.id,
      status: paymentResult.status,
      order_id
    });

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
    console.error('Error creating Shop PIX payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
