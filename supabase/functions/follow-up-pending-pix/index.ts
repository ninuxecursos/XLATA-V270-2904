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

  console.log('🔔 Starting pending PIX follow-up job...')

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = Date.now()
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString()

    // Fetch pending payments older than 1 hour
    const { data: pendingPayments, error } = await supabase
      .from('mercado_pago_payments')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', oneHourAgo)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('❌ Error fetching pending payments:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📋 Found ${pendingPayments?.length || 0} pending payments to process`)

    const results = {
      processed: 0,
      followups_sent: {
        '1h': 0,
        '24h': 0,
        '48h': 0
      },
      errors: [] as string[]
    }

    for (const payment of pendingPayments || []) {
      try {
        const createdAt = new Date(payment.created_at)
        const hoursSinceCreation = (now - createdAt.getTime()) / (1000 * 60 * 60)

        // Determine follow-up type
        let followUpType: '1h' | '24h' | '48h' | null = null
        
        if (hoursSinceCreation >= 48 && !payment.followup_48h_sent) {
          followUpType = '48h'
        } else if (hoursSinceCreation >= 24 && !payment.followup_24h_sent) {
          followUpType = '24h'
        } else if (hoursSinceCreation >= 1 && !payment.followup_1h_sent) {
          followUpType = '1h'
        }

        if (!followUpType) continue

        // Get user profile for contact info
        const externalRef = payment.external_reference
        if (!externalRef) continue

        const parts = externalRef.split('_')
        if (parts.length < 2 || parts[0] !== 'user') continue

        const userId = parts[1]

        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email, whatsapp, phone')
          .eq('id', userId)
          .single()

        if (!profile) continue

        const whatsapp = (profile.whatsapp || profile.phone)?.replace(/\D/g, '')
        
        // Build follow-up messages
        const messages: Record<string, string> = {
          '1h': `Olá ${profile.name || 'Cliente'}! 👋\n\nVimos que você gerou um PIX de R$ ${payment.transaction_amount.toFixed(2).replace('.', ',')} mas ainda não finalizou.\n\nSeu código QR continua válido! Qualquer dúvida, estamos aqui. 💚\n\n— Equipe XLata`,
          '24h': `Oi ${profile.name || 'Cliente'}! 🔔\n\nSeu PIX de R$ ${payment.transaction_amount.toFixed(2).replace('.', ',')} está esperando!\n\nFinalize agora e comece a usar o XLata hoje mesmo.\n\nPrecisa de ajuda? Responda esta mensagem!\n\n— Equipe XLata`,
          '48h': `${profile.name || 'Cliente'}, última chamada! ⏰\n\nSeu código PIX de R$ ${payment.transaction_amount.toFixed(2).replace('.', ',')} vai expirar em breve.\n\nNão perca a oportunidade de organizar seu depósito!\n\nDúvidas? Estamos aqui 24h.\n\n— Equipe XLata`
        }

        const message = messages[followUpType]

        // Log the follow-up (in production, integrate with WhatsApp API like Evolution, Twilio, etc.)
        console.log(`📱 [${followUpType}] Follow-up for payment ${payment.payment_id}:`)
        console.log(`   User: ${profile.name} (${profile.email})`)
        console.log(`   WhatsApp: ${whatsapp || 'not available'}`)
        console.log(`   Amount: R$ ${payment.transaction_amount}`)

        // Mark as sent
        const updateField = `followup_${followUpType}_sent`
        const { error: updateError } = await supabase
          .from('mercado_pago_payments')
          .update({ [updateField]: true })
          .eq('id', payment.id)

        if (updateError) {
          console.error(`❌ Error updating ${updateField}:`, updateError)
          results.errors.push(`Failed to update ${payment.id}: ${updateError.message}`)
        } else {
          results.followups_sent[followUpType]++
          results.processed++
          console.log(`✅ Marked ${followUpType} follow-up as sent for payment ${payment.payment_id}`)
        }

      } catch (paymentError) {
        console.error(`❌ Error processing payment ${payment.id}:`, paymentError)
        results.errors.push(`Payment ${payment.id}: ${paymentError.message}`)
      }
    }

    console.log(`✅ Follow-up job completed:`, results)

    return new Response(
      JSON.stringify({
        success: true,
        ...results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Follow-up job error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
