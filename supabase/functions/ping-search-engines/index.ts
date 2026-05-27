import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Notifica buscadores sobre novos/atualizados produtos do Shop XLATA.
 *
 * Estratégia (2026):
 *  - IndexNow (Bing, Yandex, Seznam, Naver, Yep) — submissão direta de URL,
 *    indexação em minutos. Não requer credenciais — só a chave pública servida
 *    em /{key}.txt no domínio.
 *  - Google: o endpoint clássico /ping foi descontinuado em 06/2023. O método
 *    suportado hoje é manter o sitemap.xml atualizado (já fazemos via Edge
 *    Function dinâmica) + opcionalmente Google Indexing API (requer Service
 *    Account, não obrigatório).
 *
 * Body aceito:
 *   { product_id?: string, url?: string, force?: boolean, urls?: string[] }
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))
    const productId: string | null = body.product_id ?? null
    const explicitUrl: string | null = body.url ?? null
    const explicitUrls: string[] | null = Array.isArray(body.urls) ? body.urls : null

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: settings } = await supabase
      .from('shop_seo_settings').select('*').limit(1).maybeSingle()

    if (!settings?.auto_ping_enabled && !body.force) {
      return new Response(JSON.stringify({ skipped: true, reason: 'auto_ping disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const baseUrl = (settings?.base_url || 'https://xlata.site').replace(/\/$/, '')
    const host = new URL(baseUrl).host
    const sitemapUrl = `${baseUrl}/sitemap-shop.xml`
    const indexnowKey: string | null = settings?.indexnow_key ?? null

    // Monta a lista de URLs a notificar
    let urlList: string[] = []
    if (explicitUrls?.length) {
      urlList = explicitUrls
    } else if (explicitUrl) {
      urlList = [explicitUrl]
    } else if (productId) {
      const { data: product } = await supabase
        .from('shop_products')
        .select('slug, allow_indexing, is_active, is_visible')
        .eq('id', productId)
        .maybeSingle()
      if (product?.slug && product.allow_indexing !== false && product.is_active && product.is_visible) {
        urlList = [`${baseUrl}/shop/${product.slug}`]
      }
    } else {
      // Sem produto específico: pega os 50 mais recentes indexáveis
      const { data: recent } = await supabase
        .from('shop_products')
        .select('slug')
        .eq('allow_indexing', true).eq('is_active', true).eq('is_visible', true)
        .order('updated_at', { ascending: false })
        .limit(50)
      urlList = (recent || []).map(r => `${baseUrl}/shop/${r.slug}`)
    }

    const results: Array<Record<string, unknown>> = []

    // === IndexNow (Bing, Yandex, Seznam, Naver, Yep) ===
    if (indexnowKey && urlList.length > 0) {
      try {
        const keyLocation = `${baseUrl}/${indexnowKey}.txt`
        const r = await fetch('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ host, key: indexnowKey, keyLocation, urlList }),
        })
        const ok = r.status >= 200 && r.status < 300
        await supabase.from('shop_seo_ping_log').insert({
          product_id: productId,
          search_engine: 'indexnow',
          status: ok ? 'success' : 'failed',
          status_code: r.status,
          response_message: ok ? `Submitted ${urlList.length} URL(s)` : (await r.text().catch(() => '')).slice(0, 500),
        })
        results.push({ engine: 'indexnow', ok, status: r.status, count: urlList.length })
      } catch (e: any) {
        await supabase.from('shop_seo_ping_log').insert({
          product_id: productId, search_engine: 'indexnow', status: 'error',
          response_message: e?.message || String(e),
        })
        results.push({ engine: 'indexnow', ok: false, error: e?.message })
      }
    }

    // === Google: sitemap atualizado ===
    // O endpoint /ping foi descontinuado. O Google detecta mudanças no sitemap
    // automaticamente. Registramos no log como referência.
    await supabase.from('shop_seo_ping_log').insert({
      product_id: productId,
      search_engine: 'google_sitemap',
      status: 'success',
      status_code: 200,
      response_message: `Sitemap atualizado: ${sitemapUrl}`,
    })
    results.push({ engine: 'google_sitemap', ok: true, sitemap: sitemapUrl })

    await supabase.from('shop_seo_settings')
      .update({ last_ping_at: new Date().toISOString() })
      .eq('id', settings?.id)

    return new Response(JSON.stringify({ success: true, results, sitemap: sitemapUrl, urls: urlList }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
