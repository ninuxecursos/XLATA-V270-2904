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
    const action = url.searchParams.get('action') || ''

    // For POST actions, parse body
    let body: Record<string, string> = {}
    if (req.method === 'POST') {
      try {
        body = await req.json()
      } catch {
        // Body may not be JSON (e.g. GET redirect from Pinterest)
      }
    }

    // Get pinterest config
    const { data: config } = await supabase
      .from('pinterest_config')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (action === 'authorize') {
      if (!config?.app_id) {
        return new Response(
          JSON.stringify({ error: 'Pinterest App ID não configurado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/pinterest-callback`
      const scope = 'boards:read,boards:write,pins:write,pins:read,user_accounts:read'
      const state = crypto.randomUUID()

      const authUrl = `https://www.pinterest.com/oauth/?client_id=${config.app_id}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`

      return new Response(
        JSON.stringify({ url: authUrl, state }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // callback action removed - now handled by pinterest-callback edge function

    if (action === 'refresh') {
      if (!config?.refresh_token || !config?.app_id || !config?.app_secret) {
        return new Response(
          JSON.stringify({ error: 'Missing refresh token or credentials' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${config.app_id}:${config.app_secret}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: config.refresh_token
        })
      })

      const tokenData = await tokenRes.json()

      if (!tokenRes.ok) {
        return new Response(
          JSON.stringify({ error: 'Token refresh failed', details: tokenData }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      await supabase
        .from('pinterest_config')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || config.refresh_token,
          token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        })
        .eq('id', config.id)

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'boards') {
      if (!config?.access_token) {
        return new Response(
          JSON.stringify({ error: 'Not connected to Pinterest' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if token needs refresh
      if (config.token_expires_at && new Date(config.token_expires_at) < new Date()) {
        // Auto-refresh
        const refreshRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/pinterest-oauth?action=refresh`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` }
        })
        if (!refreshRes.ok) {
          return new Response(
            JSON.stringify({ error: 'Token expired and refresh failed' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        // Reload config
        const { data: refreshedConfig } = await supabase
          .from('pinterest_config')
          .select('access_token')
          .eq('id', config.id)
          .single()
        config.access_token = refreshedConfig?.access_token
      }

      const boardsRes = await fetch('https://api.pinterest.com/v5/boards?page_size=50', {
        headers: { 'Authorization': `Bearer ${config.access_token}` }
      })

      const boardsData = await boardsRes.json()

      if (!boardsRes.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch boards', details: boardsData }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Cache boards
      await supabase
        .from('pinterest_config')
        .update({ boards_cache: boardsData.items || [] })
        .eq('id', config.id)

      return new Response(
        JSON.stringify({ boards: boardsData.items || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'test') {
      if (!config?.access_token) {
        return new Response(
          JSON.stringify({ error: 'Não conectado ao Pinterest' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Auto-refresh if token expired
      let accessToken = config.access_token
      if (config.token_expires_at && new Date(config.token_expires_at) < new Date()) {
        if (!config.refresh_token || !config.app_id || !config.app_secret) {
          return new Response(
            JSON.stringify({ error: 'Token expirado e refresh não disponível. Reconecte ao Pinterest.' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        const refreshRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${config.app_id}:${config.app_secret}`)}`
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: config.refresh_token
          })
        })
        const refreshData = await refreshRes.json()
        if (!refreshRes.ok) {
          return new Response(
            JSON.stringify({ error: 'Token expirado e refresh falhou', details: refreshData }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        accessToken = refreshData.access_token
        await supabase
          .from('pinterest_config')
          .update({
            access_token: refreshData.access_token,
            refresh_token: refreshData.refresh_token || config.refresh_token,
            token_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString()
          })
          .eq('id', config.id)
      }

      const userRes = await fetch('https://api.pinterest.com/v5/user_account', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const userData = await userRes.json()

      if (!userRes.ok) {
        return new Response(
          JSON.stringify({ success: false, error: 'Falha na conexão', details: userData }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, username: userData.username, profile_image: userData.profile_image }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'disconnect') {
      if (config) {
        await supabase
          .from('pinterest_config')
          .update({
            access_token: null,
            refresh_token: null,
            token_expires_at: null,
            boards_cache: '[]',
            is_enabled: false
          })
          .eq('id', config.id)
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Pinterest OAuth error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
