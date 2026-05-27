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
    const { product_id } = await req.json()
    if (!product_id) {
      return new Response(
        JSON.stringify({ error: 'product_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Pinterest config
    const { data: config } = await supabase
      .from('pinterest_config')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (!config?.is_enabled || !config?.access_token) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'Pinterest not enabled or not connected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get product
    const { data: product, error: productError } = await supabase
      .from('shop_products')
      .select('*, shop_categories(name)')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const imageUrl = product.images?.[0]
    if (!imageUrl) {
      // Log as failed - no image
      await supabase.from('pinterest_pins_log').insert({
        product_id,
        status: 'failed',
        error_message: 'Produto sem imagem',
        title: product.name
      })
      return new Response(
        JSON.stringify({ error: 'Product has no images' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine board
    let boardId = config.default_board_id
    if (product.category_id) {
      const { data: categoryBoard } = await supabase
        .from('pinterest_category_boards')
        .select('board_id')
        .eq('category_id', product.category_id)
        .maybeSingle()
      if (categoryBoard?.board_id) {
        boardId = categoryBoard.board_id
      }
    }

    if (!boardId) {
      await supabase.from('pinterest_pins_log').insert({
        product_id,
        status: 'failed',
        error_message: 'Nenhum board configurado',
        title: product.name,
        image_url: imageUrl
      })
      return new Response(
        JSON.stringify({ error: 'No board configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate optimized title and description
    const categoryName = (product as any).shop_categories?.name || ''
    const price = product.sale_price || product.price
    const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
    
    // Pinterest-optimized title (max 100 chars)
    const pinTitle = `${product.name} ${formattedPrice} | XLata Móveis`.slice(0, 100)

    // Pinterest-optimized description with hashtags
    const conditionLabel = product.condition === 'novo' ? 'Novo' : product.condition === 'usado' ? 'Usado' : 'No Estado'
    const shortDesc = product.short_description || product.description?.slice(0, 200) || ''
    
    const hashtags = [
      '#moveisusados', '#moveisbaratos', '#decoracao', '#guarulhos',
      '#vilagalvao', '#xlata', '#sustentabilidade', '#reciclagem'
    ]
    if (categoryName) hashtags.unshift(`#${categoryName.toLowerCase().replace(/\s+/g, '')}`)
    
    const pinDescription = `${shortDesc}\n\n📦 Condição: ${conditionLabel}\n💰 Preço: ${formattedPrice}\n📍 Guarulhos - Vila Galvão\n\n${hashtags.join(' ')}`.slice(0, 500)

    const productUrl = `https://xlata.site/shop/${product.slug}`

    // Create log entry as pending
    const { data: logEntry } = await supabase
      .from('pinterest_pins_log')
      .insert({
        product_id,
        board_id: boardId,
        status: 'pending',
        title: pinTitle,
        description: pinDescription,
        image_url: imageUrl
      })
      .select('id')
      .single()

    // Publish pin via Pinterest API
    try {
      const pinRes = await fetch('https://api.pinterest.com/v5/pins', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          board_id: boardId,
          title: pinTitle,
          description: pinDescription,
          link: productUrl,
          media_source: {
            source_type: 'image_url',
            url: imageUrl
          },
          alt_text: `${product.name} - ${conditionLabel} - ${formattedPrice} - XLata Móveis Usados Guarulhos`
        })
      })

      const pinData = await pinRes.json()

      if (!pinRes.ok) {
        // Update log as failed
        if (logEntry?.id) {
          await supabase
            .from('pinterest_pins_log')
            .update({
              status: 'failed',
              error_message: JSON.stringify(pinData)
            })
            .eq('id', logEntry.id)
        }
        return new Response(
          JSON.stringify({ error: 'Pin creation failed', details: pinData }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update log as published
      if (logEntry?.id) {
        await supabase
          .from('pinterest_pins_log')
          .update({
            status: 'published',
            pin_id: pinData.id,
            pin_url: `https://www.pinterest.com/pin/${pinData.id}/`
          })
          .eq('id', logEntry.id)
      }

      // Log AI usage for tracking
      await supabase.from('ai_usage_log').insert({
        usage_type: 'pinterest_pin',
        ai_provider: 'pinterest',
        ai_model: 'api_v5'
      })

      return new Response(
        JSON.stringify({ success: true, pin_id: pinData.id, pin_url: `https://www.pinterest.com/pin/${pinData.id}/` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (pinError) {
      if (logEntry?.id) {
        await supabase
          .from('pinterest_pins_log')
          .update({
            status: 'failed',
            error_message: pinError.message
          })
          .eq('id', logEntry.id)
      }
      throw pinError
    }

  } catch (error) {
    console.error('Pinterest publish error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
