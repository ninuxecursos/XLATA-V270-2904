import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 15 Produtos Normais
    const normalProducts = [
      {
        name: 'Máquina de Solda MIG Industrial',
        slug: 'maquina-solda-mig-industrial',
        description: 'Equipamento profissional para soldagem MIG/MAG. Ideal para trabalhos pesados em oficinas e indústrias. Tensão 220V, corrente de soldagem até 250A.',
        short_description: 'Equipamento profissional para soldagem',
        price: 1500,
        stock_quantity: 3,
        sale_type: 'normal',
        is_active: true,
        is_visible: true,
        is_featured: true,
        tags: ['soldagem', 'industrial', 'equipamento'],
      },
      {
        name: 'Vigamento de Aço Estrutural',
        slug: 'vigamento-aco-estrutural',
        description: 'Vigas metálicas para construção civil e estruturas. Material de alta resistência, ideal para mezaninos, galpões e construções industriais.',
        short_description: 'Vigas metálicas para construção',
        price: 800,
        stock_quantity: 15,
        sale_type: 'normal',
        is_active: true,
        is_visible: true,
        is_featured: false,
        tags: ['construção', 'aço', 'estrutura'],
      },
      {
        name: 'Mesa Industrial de Ferro',
        slug: 'mesa-industrial-ferro',
        description: 'Mesa reforçada para uso industrial com tampo em chapa de aço. Suporta até 500kg. Dimensões: 1,5m x 0,8m x 0,9m altura.',
        short_description: 'Mesa reforçada para uso industrial',
        price: 300,
        stock_quantity: 8,
        sale_type: 'normal',
        is_active: true,
        is_visible: true,
        is_featured: false,
        tags: ['móveis', 'industrial', 'ferro'],
      },
      {
        name: 'Gaveta de Dinheiro Metálica',
        slug: 'gaveta-dinheiro-metalica',
        description: 'Gaveta para caixa registradora em aço inox. Abertura automática com fechadura. Compartimentos para cédulas e moedas.',
        short_description: 'Gaveta para caixa registradora',
        price: 150,
        stock_quantity: 12,
        sale_type: 'normal',
        is_active: true,
        is_visible: true,
        is_featured: false,
        tags: ['comercial', 'caixa', 'segurança'],
      },
      {
        name: 'Motor Trifásico Industrial',
        slug: 'motor-trifasico-industrial',
        description: 'Motor elétrico trifásico de alta potência. 50CV, 4 polos, 1750 RPM. Ideal para compressores, bombas e equipamentos pesados.',
        short_description: 'Motor de alta potência',
        price: 10000,
        stock_quantity: 2,
        sale_type: 'normal',
        is_active: true,
        is_visible: true,
        is_featured: true,
        tags: ['motor', 'industrial', 'elétrico'],
      },
      {
        name: 'Placas de Vídeo com Defeito (Lote)',
        slug: 'placas-video-defeito-lote',
        description: 'Lote com 20 placas de vídeo diversas com defeito. Ideal para reparo, reciclagem de componentes ou extração de metais preciosos.',
        short_description: 'Lote para reparo/reciclagem',
        price: 200,
        stock_quantity: 5,
        sale_type: 'normal',
        is_active: true,
        is_visible: true,
        is_featured: false,
        tags: ['eletrônicos', 'reciclagem', 'lote'],
      },
      {
        name: 'Escada Caracol de Ferro',
        slug: 'escada-caracol-ferro',
        description: 'Escada caracol ornamental em ferro forjado. Altura 3m com 12 degraus. Design clássico, pode ser pintada conforme preferência.',
        short_description: 'Escada ornamental metálica',
        price: 1000,
        stock_quantity: 1,
        sale_type: 'normal',
        is_active: true,
        is_visible: true,
        is_featured: true,
        tags: ['decoração', 'ferro', 'escada'],
      },
      {
        name: 'Roda d\'Água Metálica',
        slug: 'roda-dagua-metalica',
        description: 'Roda d\'água decorativa funcional em aço galvanizado. Diâmetro 2m. Perfeita para jardins, sítios e projetos paisagísticos.',
        short_description: 'Roda decorativa funcional',
        price: 3000,
        stock_quantity: 1,
        sale_type: 'normal',
        is_active: true,
        is_visible: true,
        is_featured: false,
        tags: ['decoração', 'jardim', 'água'],
      },
      {
        name: 'Tubo Corrugado Industrial',
        slug: 'tubo-corrugado-industrial',
        description: 'Tubo flexível corrugado em aço inox. Diâmetro 4 polegadas, 10 metros de comprimento. Ideal para exaustão e ventilação.',
        short_description: 'Tubulação flexível',
        price: 150,
        stock_quantity: 20,
        sale_type: 'normal',
        is_active: true,
        is_visible: true,
        is_featured: false,
        tags: ['tubulação', 'industrial', 'ventilação'],
      },
      {
        name: 'Caixa d\'Água 500L Usada',
        slug: 'caixa-dagua-500l-usada',
        description: 'Reservatório de água em fibra de vidro, capacidade 500 litros. Seminovo em bom estado. Ideal para reserva residencial.',
        short_description: 'Reservatório seminovo',
        price: 250,
        stock_quantity: 4,
        sale_type: 'normal',
        is_active: true,
        is_visible: true,
        is_featured: false,
        tags: ['reservatório', 'água', 'usado'],
      },
      {
        name: 'Luminária LED Industrial',
        slug: 'luminaria-led-industrial',
        description: 'Luminária LED de alta potência para galpões e áreas industriais. 200W, luz branca fria 6500K, IP65 resistente à água.',
        short_description: 'Iluminação para galpões',
        price: 200,
        stock_quantity: 25,
        sale_type: 'normal',
        is_active: true,
        is_visible: true,
        is_featured: false,
        tags: ['iluminação', 'LED', 'industrial'],
      },
      {
        name: 'Porta Metálica de Escritório',
        slug: 'porta-metalica-escritorio',
        description: 'Porta de ferro para ambientes internos. Medidas 0,9m x 2,1m. Pintura eletrostática cinza. Inclui batente e dobradiças.',
        short_description: 'Porta de ferro para ambientes',
        price: 100,
        stock_quantity: 6,
        sale_type: 'normal',
        is_active: true,
        is_visible: true,
        is_featured: false,
        tags: ['porta', 'escritório', 'ferro'],
      },
      {
        name: 'Estantes de Ferro Reforçadas',
        slug: 'estantes-ferro-reforcadas',
        description: 'Prateleiras industriais em aço carbono. 5 níveis ajustáveis, suporta 200kg por prateleira. Dimensões: 2m altura x 1m largura x 0,5m profundidade.',
        short_description: 'Prateleiras industriais',
        price: 200,
        stock_quantity: 10,
        sale_type: 'normal',
        is_active: true,
        is_visible: true,
        is_featured: false,
        tags: ['estante', 'armazenamento', 'industrial'],
      },
      {
        name: 'Elíptico Magnético Semi Novo',
        slug: 'eliptico-magnetico-semi-novo',
        description: 'Equipamento de ginástica elíptico com resistência magnética. 8 níveis de intensidade, monitor LCD. Pouco uso, excelente estado.',
        short_description: 'Equipamento de ginástica',
        price: 1200,
        stock_quantity: 1,
        sale_type: 'normal',
        is_active: true,
        is_visible: true,
        is_featured: true,
        tags: ['fitness', 'ginástica', 'equipamento'],
      },
      {
        name: 'Calculadora Mecânica Antiga',
        slug: 'calculadora-mecanica-antiga',
        description: 'Calculadora mecânica vintage funcionando. Peça de colecionador dos anos 60. Excelente para decoração de escritórios retrô.',
        short_description: 'Peça de colecionador',
        price: 100,
        stock_quantity: 1,
        sale_type: 'normal',
        is_active: true,
        is_visible: true,
        is_featured: false,
        tags: ['vintage', 'colecionador', 'decoração'],
      },
    ]

    // 5 Produtos Interativos
    const interactiveProducts = [
      {
        name: 'Moto Triumph Street Triple 2017',
        slug: 'moto-triumph-street-triple-2017',
        description: 'Motocicleta Triumph Street Triple 675cc ano 2017. Motor 3 cilindros, 106cv. Documentação em dia, revisões em concessionária. Apenas 25.000 km rodados.',
        short_description: 'Moto esportiva Triumph 675cc',
        price: 35000,
        stock_quantity: 1,
        sale_type: 'interactive',
        is_active: true,
        is_visible: true,
        is_featured: true,
        tags: ['moto', 'triumph', 'esportiva'],
      },
      {
        name: 'Máquina de Solda Industrial Pesada',
        slug: 'maquina-solda-industrial-pesada',
        description: 'Equipamento de soldagem industrial de grande porte. TIG/MIG/Eletrodo 500A. Perfeita para trabalhos pesados em estaleiros e metalúrgicas.',
        short_description: 'Soldadora profissional 500A',
        price: 15000,
        stock_quantity: 1,
        sale_type: 'interactive',
        is_active: true,
        is_visible: true,
        is_featured: true,
        tags: ['soldagem', 'industrial', 'profissional'],
      },
      {
        name: 'Rampas Metálicas de Troca de Óleo',
        slug: 'rampas-metalicas-troca-oleo',
        description: 'Par de rampas profissionais para troca de óleo. Capacidade 3 toneladas por rampa. Ideal para oficinas mecânicas e uso residencial.',
        short_description: 'Rampas profissionais para veículos',
        price: 2500,
        stock_quantity: 1,
        sale_type: 'interactive',
        is_active: true,
        is_visible: true,
        is_featured: false,
        tags: ['automotivo', 'rampa', 'oficina'],
      },
      {
        name: 'Bicicleta Antiga Restaurável',
        slug: 'bicicleta-antiga-restauravel',
        description: 'Bicicleta vintage dos anos 50 para restauração. Estrutura em bom estado, necessita pintura e alguns componentes. Peça rara para colecionadores.',
        short_description: 'Bicicleta vintage para restauração',
        price: 800,
        stock_quantity: 1,
        sale_type: 'interactive',
        is_active: true,
        is_visible: true,
        is_featured: false,
        tags: ['vintage', 'bicicleta', 'restauração'],
      },
      {
        name: 'Cofre Antigo Funcionando',
        slug: 'cofre-antigo-funcionando',
        description: 'Cofre antigo em ferro fundido com mecanismo original funcionando. Peso aproximado 150kg. Perfeito para decoração ou uso em estabelecimentos.',
        short_description: 'Cofre vintage funcional',
        price: 3500,
        stock_quantity: 1,
        sale_type: 'interactive',
        is_active: true,
        is_visible: true,
        is_featured: true,
        tags: ['cofre', 'vintage', 'segurança'],
      },
    ]

    // Inserir produtos normais
    const { data: insertedNormal, error: normalError } = await supabase
      .from('shop_products')
      .insert(normalProducts)
      .select('id, name')

    if (normalError) {
      console.error('Erro ao inserir produtos normais:', normalError)
      throw normalError
    }

    console.log('Produtos normais inseridos:', insertedNormal?.length)

    // Inserir produtos interativos
    const { data: insertedInteractive, error: interactiveError } = await supabase
      .from('shop_products')
      .insert(interactiveProducts)
      .select('id, name')

    if (interactiveError) {
      console.error('Erro ao inserir produtos interativos:', interactiveError)
      throw interactiveError
    }

    console.log('Produtos interativos inseridos:', insertedInteractive?.length)

    // Criar eventos interativos para os 5 produtos
    if (insertedInteractive && insertedInteractive.length > 0) {
      const now = new Date()
      const endDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 dias

      const events = insertedInteractive.map((product: { id: string; name: string }) => ({
        product_id: product.id,
        initial_value: 10.00,
        current_value: 10.00,
        minimum_increment: 5.00,
        start_at: now.toISOString(),
        end_at: endDate.toISOString(),
        status: 'active',
      }))

      const { data: insertedEvents, error: eventsError } = await supabase
        .from('shop_interactive_events')
        .insert(events)
        .select('id')

      if (eventsError) {
        console.error('Erro ao criar eventos:', eventsError)
        throw eventsError
      }

      console.log('Eventos interativos criados:', insertedEvents?.length)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '20 produtos inseridos com sucesso!',
        normalProducts: insertedNormal?.length || 0,
        interactiveProducts: insertedInteractive?.length || 0,
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
