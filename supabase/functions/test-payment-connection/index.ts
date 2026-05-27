import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ConnectionTestResult {
  success: boolean
  message: string
  environment?: 'sandbox' | 'production'
  payment_methods?: Array<{
    id: string
    name: string
    payment_type_id: string
    status: string
    thumbnail: string
  }>
  account_info?: {
    id: number
    email: string
    site_id: string
  }
  error_code?: string
  timestamp: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify JWT authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: 'Não autorizado', timestamp: new Date().toISOString() }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Token inválido', timestamp: new Date().toISOString() }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check admin role
    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, message: 'Acesso negado. Apenas administradores.', timestamp: new Date().toISOString() }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch payment gateway config from database
    const { data: config, error: configError } = await supabase
      .from('payment_gateway_config')
      .select('access_token_encrypted, environment, is_active')
      .eq('gateway_name', 'mercado_pago')
      .single()

    if (configError || !config) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Configuração de pagamento não encontrada no banco de dados.',
          error_code: 'CONFIG_NOT_FOUND',
          timestamp: new Date().toISOString() 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!config.access_token_encrypted) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Access Token não configurado. Adicione o token nas configurações.',
          error_code: 'TOKEN_NOT_CONFIGURED',
          timestamp: new Date().toISOString() 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const accessToken = config.access_token_encrypted

    console.log(`🔍 Testing Mercado Pago connection (environment: ${config.environment})`)

    // Test 1: Validate token by fetching account info
    const userInfoResponse = await fetch('https://api.mercadopago.com/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.json().catch(() => ({}))
      console.error('❌ Mercado Pago authentication failed:', errorData)
      
      let errorMessage = 'Access Token inválido ou expirado.'
      if (userInfoResponse.status === 401) {
        errorMessage = 'Access Token inválido. Verifique se está correto e tente novamente.'
      } else if (userInfoResponse.status === 403) {
        errorMessage = 'Access Token sem permissões necessárias.'
      }
      
      // Update test status in database
      await supabase
        .from('payment_gateway_config')
        .update({
          last_test_at: new Date().toISOString(),
          last_test_status: 'invalid_token'
        })
        .eq('gateway_name', 'mercado_pago')

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: errorMessage,
          error_code: 'INVALID_TOKEN',
          timestamp: new Date().toISOString() 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const accountInfo = await userInfoResponse.json()
    console.log(`✅ Account validated: ID ${accountInfo.id}, Site: ${accountInfo.site_id}`)

    // Determine environment based on token prefix
    const detectedEnvironment = accessToken.startsWith('TEST-') ? 'sandbox' : 'production'

    // Test 2: Fetch available payment methods
    const paymentMethodsResponse = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    let paymentMethods: any[] = []
    if (paymentMethodsResponse.ok) {
      const allMethods = await paymentMethodsResponse.json()
      // Filter to most relevant methods (PIX, credit cards, debit cards)
      paymentMethods = allMethods
        .filter((m: any) => ['credit_card', 'debit_card', 'bank_transfer'].includes(m.payment_type_id) && m.status === 'active')
        .slice(0, 15) // Limit to 15 methods
        .map((m: any) => ({
          id: m.id,
          name: m.name,
          payment_type_id: m.payment_type_id,
          status: m.status,
          thumbnail: m.secure_thumbnail || m.thumbnail
        }))
      
      console.log(`✅ Found ${paymentMethods.length} active payment methods`)
    }

    // Update test status in database
    await supabase
      .from('payment_gateway_config')
      .update({
        last_test_at: new Date().toISOString(),
        last_test_status: 'success'
      })
      .eq('gateway_name', 'mercado_pago')

    const result: ConnectionTestResult = {
      success: true,
      message: 'Conexão com Mercado Pago estabelecida com sucesso!',
      environment: detectedEnvironment,
      payment_methods: paymentMethods,
      account_info: {
        id: accountInfo.id,
        email: accountInfo.email,
        site_id: accountInfo.site_id
      },
      timestamp: new Date().toISOString()
    }

    console.log('✅ Connection test completed successfully')

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Connection test error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Erro ao testar conexão: ${error.message}`,
        error_code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString() 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
