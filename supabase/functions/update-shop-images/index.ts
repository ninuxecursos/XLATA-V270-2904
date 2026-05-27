import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapeamento slug -> imagem (URLs públicas)
const imageMapping: Record<string, string> = {
  'maquina-solda-mig-industrial': '/images/shop/maquina-solda-mig.jpg',
  'vigamento-aco-estrutural': '/images/shop/vigamento-aco.jpg',
  'mesa-industrial-ferro': '/images/shop/mesa-industrial.jpg',
  'gaveta-dinheiro-metalica': '/images/shop/gaveta-dinheiro.jpg',
  'motor-trifasico-industrial': '/images/shop/motor-trifasico.jpg',
  'placas-video-defeito-lote': '/images/shop/placas-video.jpg',
  'escada-caracol-ferro': '/images/shop/escada-caracol.jpg',
  'roda-dagua-metalica': '/images/shop/roda-dagua.jpg',
  'tubo-corrugado-industrial': '/images/shop/tubo-corrugado.jpg',
  'caixa-dagua-500l-usada': '/images/shop/caixa-dagua.jpg',
  'luminaria-led-industrial': '/images/shop/luminaria-led.jpg',
  'porta-metalica-escritorio': '/images/shop/porta-metalica.jpg',
  'estantes-ferro-reforcadas': '/images/shop/estantes-ferro.jpg',
  'eliptico-magnetico-semi-novo': '/images/shop/eliptico.jpg',
  'calculadora-mecanica-antiga': '/images/shop/calculadora-antiga.jpg',
  'moto-triumph-street-triple-2017': '/images/shop/moto-triumph.jpg',
  'maquina-solda-industrial-pesada': '/images/shop/solda-pesada.jpg',
  'rampas-metalicas-troca-oleo': '/images/shop/rampas-metalicas.jpg',
  'bicicleta-antiga-restauravel': '/images/shop/bicicleta-antiga.jpg',
  'cofre-antigo-funcionando': '/images/shop/cofre-antigo.jpg',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const updates: { slug: string; success: boolean }[] = []

    for (const [slug, imagePath] of Object.entries(imageMapping)) {
      const { error } = await supabase
        .from('shop_products')
        .update({ images: [imagePath] })
        .eq('slug', slug)

      updates.push({ slug, success: !error })
      if (error) {
        console.error(`Erro ao atualizar ${slug}:`, error)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Imagens atualizadas!',
        updates,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro geral:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
