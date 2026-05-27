import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

    // Find abandoned pending orders older than 30 minutes
    const { data: abandonedOrders, error: fetchError } = await supabase
      .from('shop_orders')
      .select('id, order_number, created_at')
      .eq('status', 'pending')
      .lt('created_at', thirtyMinutesAgo)
      .limit(100)

    if (fetchError) {
      console.error('Error fetching abandoned orders:', fetchError)
      throw fetchError
    }

    if (!abandonedOrders || abandonedOrders.length === 0) {
      console.log('✅ No abandoned orders found')
      return new Response(
        JSON.stringify({ message: 'No abandoned orders', cancelled: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${abandonedOrders.length} abandoned orders to cancel`)

    const orderIds = abandonedOrders.map(o => o.id)

    // Cancel abandoned orders
    const { error: updateError } = await supabase
      .from('shop_orders')
      .update({ status: 'cancelled' })
      .in('id', orderIds)

    if (updateError) {
      console.error('Error cancelling orders:', updateError)
      throw updateError
    }

    console.log(`✅ Cancelled ${orderIds.length} abandoned orders:`, orderIds)

    return new Response(
      JSON.stringify({ 
        message: `Cancelled ${orderIds.length} abandoned orders`,
        cancelled: orderIds.length,
        order_ids: orderIds
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in cleanup-abandoned-orders:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
