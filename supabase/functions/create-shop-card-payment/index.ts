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
    // NO JWT validation - this is for shop users (ShopAuthContext)
    const { 
      token, 
      order_id,
      transaction_amount, 
      description, 
      installments,
      payment_method_id,
      issuer_id,
      payer 
    } = await req.json()

    // Validate required fields
    if (!token || !transaction_amount || !order_id || !payer) {
      throw new Error('Missing required fields: token, transaction_amount, order_id, payer')
    }

    if (!payer.email || !payer.identification) {
      throw new Error('Missing required payer fields: email, identification')
    }

    // SECURITY: Ignore transaction_amount from frontend, use order total from DB

    // Create service role client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate order exists
    const { data: orderData, error: orderError } = await supabase
      .from('shop_orders')
      .select('id, total_amount, status')
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
    const amount = parseFloat(orderData.total_amount || orderData.total);
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

    const shopExternalReference = `shop_order_${order_id}`;

    console.log('Creating Shop Card payment:', {
      amount: transaction_amount,
      payer_email: payer.email ? `${payer.email.substring(0, 3)}***` : 'unknown',
      external_reference: shopExternalReference,
      installments
    });

    // Create payment on Mercado Pago with card token
    const paymentData: Record<string, unknown> = {
      transaction_amount: amount,
      token,
      description: description || `Pedido XLata Shop #${order_id.substring(0, 8)}`,
      installments: installments || 1,
      payment_method_id,
      external_reference: shopExternalReference,
      payer: {
        email: payer.email.trim().toLowerCase(),
        identification: {
          type: payer.identification.type || 'CPF',
          number: payer.identification.number.replace(/\D/g, '')
        }
      },
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-mercado-pago`
    }

    if (issuer_id) {
      paymentData.issuer_id = issuer_id;
    }

    const idempotencyKey = `shop_card_${order_id}_${Date.now()}_${crypto.randomUUID()}`;
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
    const { error: dbError } = await supabase
      .from('mercado_pago_payments')
      .insert({
        payment_id: paymentResult.id,
        external_reference: shopExternalReference,
        status: paymentResult.status,
        transaction_amount: paymentResult.transaction_amount,
        payer_email: payer.email,
        payment_method_id: paymentResult.payment_method_id,
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Database error:', dbError)
    }

    // If payment is immediately approved, update order status
    if (paymentResult.status === 'approved') {
      const { error: orderUpdateError } = await supabase
        .from('shop_orders')
        .update({ 
          status: 'paid',
          payment_method: 'card',
          payment_id: paymentResult.id.toString()
        })
        .eq('id', order_id);

      if (orderUpdateError) {
        console.error('Error updating order status:', orderUpdateError);
      } else {
        console.log(`✅ Order ${order_id} marked as paid`);
      }
    }

    console.log('✅ Shop Card payment created:', {
      id: paymentResult.id,
      status: paymentResult.status,
      status_detail: paymentResult.status_detail,
      order_id
    });

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
    console.error('Error creating Shop Card payment:', error)
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
