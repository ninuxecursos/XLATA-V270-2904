import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = user.id

    // Use service role to fetch all user data
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Collect all user data in parallel
    const [
      profile,
      orders,
      orderItems,
      materials,
      customers,
      cashRegisters,
      cashTransactions,
      subscriptions,
      consents,
      errorReports
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('orders').select('*').eq('user_id', userId),
      supabase.from('order_items').select('*').eq('user_id', userId),
      supabase.from('materials').select('*').eq('user_id', userId),
      supabase.from('customers').select('*').eq('user_id', userId),
      supabase.from('cash_registers').select('*').eq('user_id', userId),
      supabase.from('cash_transactions').select('*').eq('user_id', userId),
      supabase.from('user_subscriptions').select('*').eq('user_id', userId),
      supabase.from('user_consents').select('*').eq('user_id', userId),
      supabase.from('error_reports').select('*').eq('user_id', userId)
    ])

    const exportData = {
      export_info: {
        exported_at: new Date().toISOString(),
        user_id: userId,
        email: user.email,
        format_version: '1.0',
        legal_basis: 'LGPD Art. 18, II - Portabilidade de dados'
      },
      profile: profile.data,
      orders: orders.data,
      order_items: orderItems.data,
      materials: materials.data,
      customers: customers.data,
      cash_registers: cashRegisters.data,
      cash_transactions: cashTransactions.data,
      subscriptions: subscriptions.data,
      consents: consents.data,
      error_reports: errorReports.data
    }

    const filename = `xlata-dados-${userId.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.json`

    return new Response(
      JSON.stringify(exportData, null, 2),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      }
    )
  } catch (error) {
    console.error('Export error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
