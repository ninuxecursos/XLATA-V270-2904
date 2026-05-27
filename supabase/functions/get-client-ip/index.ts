import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Extract real client IP from headers
    const forwardedFor = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const cfConnectingIp = req.headers.get('cf-connecting-ip')

    let clientIp = '0.0.0.0'

    if (forwardedFor) {
      clientIp = forwardedFor.split(',')[0].trim()
    } else if (cfConnectingIp) {
      clientIp = cfConnectingIp.trim()
    } else if (realIp) {
      clientIp = realIp.trim()
    }

    console.log('Detected client IP:', clientIp)

    // Skip geo lookup for invalid IPs
    if (clientIp === '0.0.0.0' || clientIp === '127.0.0.1' || clientIp === '::1') {
      return new Response(
        JSON.stringify({ ip: clientIp, country: null, city: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Try geo lookup APIs server-side (no CORS issues)
    const geoAPIs = [
      {
        url: `https://ipapi.co/${clientIp}/json/`,
        parse: (data: any) => ({ country: data.country_name || data.country, city: data.city })
      },
      {
        url: `https://ipwho.is/${clientIp}`,
        parse: (data: any) => ({ country: data.country, city: data.city })
      }
    ]

    let country: string | null = null
    let city: string | null = null

    for (const api of geoAPIs) {
      try {
        const response = await fetch(api.url, {
          signal: AbortSignal.timeout(4000),
          headers: { 'Accept': 'application/json', 'User-Agent': 'SupabaseEdgeFunction/1.0' }
        })

        if (response.ok) {
          const data = await response.json()
          const parsed = api.parse(data)
          if (parsed.country) {
            country = parsed.country
            city = parsed.city || null
            console.log('Geo data found:', country, city)
            break
          }
        }
      } catch (e) {
        console.log('Geo API failed, trying next:', e.message)
        continue
      }
    }

    return new Response(
      JSON.stringify({ ip: clientIp, country, city }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in get-client-ip:', error)
    return new Response(
      JSON.stringify({ ip: '0.0.0.0', country: null, city: null, error: error.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
