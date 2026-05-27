import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Serve o arquivo de verificação do IndexNow:
 *   GET /{indexnow_key}.txt -> texto plano contendo a própria chave.
 *
 * O Vercel faz rewrite de qualquer arquivo .txt de 32+ chars hex para esta
 * function. Validamos a chave contra shop_seo_settings.indexnow_key.
 */
serve(async (req) => {
  try {
    const url = new URL(req.url)
    // O path pode vir como /indexnow-key ou /indexnow-key/<key>.txt ou ?key=...
    const queryKey = url.searchParams.get('key')
    const pathMatch = url.pathname.match(/([a-f0-9-]{20,})\.txt$/i)
    const requestedKey = (queryKey || pathMatch?.[1] || '').toLowerCase()

    if (!requestedKey) {
      return new Response('missing key', { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: settings } = await supabase
      .from('shop_seo_settings')
      .select('indexnow_key')
      .limit(1).maybeSingle()

    const storedKey = (settings?.indexnow_key || '').toLowerCase()
    if (!storedKey || storedKey !== requestedKey) {
      return new Response('not found', { status: 404 })
    }

    return new Response(storedKey, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (e: any) {
    return new Response('error: ' + (e?.message || String(e)), { status: 500 })
  }
})
