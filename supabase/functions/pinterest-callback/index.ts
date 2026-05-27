import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const code = url.searchParams.get('code')

    if (!code) {
      return new Response(
        `<html><body><p>Erro: código de autorização ausente.</p></body></html>`,
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      )
    }

    // Get pinterest config
    const { data: config } = await supabase
      .from('pinterest_config')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (!config?.app_id || !config?.app_secret) {
      return new Response(
        `<html><body><p>Erro: credenciais do Pinterest não configuradas.</p></body></html>`,
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      )
    }

    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/pinterest-callback`
    const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${config.app_id}:${config.app_secret}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    })

    const tokenData = await tokenRes.json()

    if (!tokenRes.ok) {
      console.error('Token exchange failed:', tokenData)
      return new Response(
        `<html><body><p>Erro ao trocar código por token: ${JSON.stringify(tokenData)}</p></body></html>`,
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      )
    }

    // Save tokens
    await supabase
      .from('pinterest_config')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        is_enabled: true
      })
      .eq('id', config.id)

    return new Response(
      `<html><body><script>window.opener?.postMessage('pinterest-connected','*');window.close();</script><p>Conectado! Pode fechar esta janela.</p></body></html>`,
      { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    )

  } catch (error) {
    console.error('Pinterest callback error:', error)
    return new Response(
      `<html><body><p>Erro interno: ${error.message}</p></body></html>`,
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    )
  }
})
