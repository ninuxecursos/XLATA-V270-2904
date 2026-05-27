import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface GenerateRequest {
  stateId?: string;
  cityId?: string;
  pageId?: string;
  batchType?: 'states' | 'cities' | 'all';
  limit?: number;
  forceRegenerate?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Gemini API key from ai_automation_config
    const { data: aiConfig } = await supabase
      .from('ai_automation_config')
      .select('gemini_api_key, ai_model')
      .single();

    const geminiApiKey = aiConfig?.gemini_api_key;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!geminiApiKey && !lovableApiKey) {
      throw new Error('Nenhuma API key configurada. Configure a chave do Gemini em AI & Automação.');
    }

    const useGeminiDirect = !!geminiApiKey;
    const modelName = (aiConfig?.ai_model || 'gemini-2.5-flash').replace('google/', '');
    const { stateId, cityId, pageId, batchType, limit = 5, forceRegenerate = false }: GenerateRequest = await req.json();

    console.log('Received request:', { stateId, cityId, pageId, batchType, limit, forceRegenerate });

    let pagesToGenerate: any[] = [];

    if (pageId) {
      const { data: page, error } = await supabase
        .from('local_seo_pages')
        .select('*, state:local_seo_states(*), city:local_seo_cities(*)')
        .eq('id', pageId)
        .single();
      if (error) throw error;
      pagesToGenerate = [page];
    } else if (batchType) {
      let query = supabase
        .from('local_seo_pages')
        .select('*, state:local_seo_states(*), city:local_seo_cities(*)')
        .limit(limit);

      if (!forceRegenerate) {
        query = query.or('content_html.is.null,content_html.eq.');
      }

      if (batchType === 'states') {
        query = query.eq('page_type', 'state');
      } else if (batchType === 'cities') {
        query = query.eq('page_type', 'city');
      }

      const { data: pages, error } = await query;
      if (error) throw error;
      pagesToGenerate = pages || [];
    }

    if (pagesToGenerate.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, message: 'No pages need content generation',
        generated: 0, errors: 0, results: []
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Generating content for ${pagesToGenerate.length} pages`);
    const results = [];

    for (const page of pagesToGenerate) {
      try {
        const locationName = page.city?.name || page.state?.name || '';
        const stateName = page.state?.name || '';
        const stateAbbr = page.state?.abbreviation || '';
        const isCity = page.page_type === 'city';

        const prompt = buildPrompt(locationName, stateName, stateAbbr, isCity, page.slug);

        console.log(`Generating for: ${locationName} (${page.page_type})`);

        let aiData: any;

        if (useGeminiDirect) {
          // Use Gemini API directly
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
          const systemPrompt = `Você é um redator SEO brasileiro especialista no mercado de ferro velho, sucata e reciclagem. Crie conteúdo LONGO, DETALHADO e ÚNICO para cada cidade. MÍNIMO 1500 palavras de conteúdo HTML. Responda APENAS em JSON válido.`;
          
          const aiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
              generationConfig: {
                temperature: 0.85,
                maxOutputTokens: 16384,
                responseMimeType: 'application/json',
              },
            }),
          });

          if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            console.error(`Gemini error for ${locationName}:`, errorText);
            results.push({ id: page.id, location: locationName, status: 'error', error: errorText.substring(0, 200) });
            continue;
          }

          const geminiData = await aiResponse.json();
          const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          if (!rawText) {
            results.push({ id: page.id, location: locationName, status: 'error', error: 'No content returned' });
            continue;
          }

          let cleanText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          cleanText = cleanText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
          
          try {
            aiData = JSON.parse(cleanText);
          } catch (e) {
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              aiData = JSON.parse(jsonMatch[0]);
            } else {
              console.error(`JSON parse error for ${locationName}`);
              results.push({ id: page.id, location: locationName, status: 'parse_error' });
              continue;
            }
          }
        } else {
          // Fallback to Lovable AI Gateway
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: `Você é um redator SEO brasileiro especialista no mercado de ferro velho, sucata e reciclagem. Crie conteúdo LONGO, DETALHADO e ÚNICO para cada cidade. MÍNIMO 1500 palavras de conteúdo HTML. Responda APENAS em JSON válido, sem markdown.` },
                { role: 'user', content: prompt }
              ],
              temperature: 0.85,
              max_tokens: 8000,
            }),
          });

          if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            results.push({ id: page.id, location: locationName, status: aiResponse.status === 429 ? 'rate_limited' : 'error', error: errorText });
            continue;
          }

          const responseData = await aiResponse.json();
          const content = responseData.choices?.[0]?.message?.content;

          if (!content) {
            results.push({ id: page.id, location: locationName, status: 'error', error: 'No content returned' });
            continue;
          }

          let cleanContent = content.trim();
          if (cleanContent.startsWith('```json')) cleanContent = cleanContent.slice(7);
          if (cleanContent.startsWith('```')) cleanContent = cleanContent.slice(3);
          if (cleanContent.endsWith('```')) cleanContent = cleanContent.slice(0, -3);
          aiData = JSON.parse(cleanContent.trim());
        }

        const parsedContent = aiData;

        // Validate content quality
        const wordCount = countWords(parsedContent.content_html || '');
        if (wordCount < 500) {
          console.error(`Content too short for ${locationName}: ${wordCount} words`);
          results.push({ id: page.id, location: locationName, status: 'too_short', wordCount });
          continue;
        }

        const schemaData = buildSchemaData(locationName, stateName, isCity, parsedContent.faq || []);

        const seoTitle = (parsedContent.seo_title || `Sistema para Ferro Velho em ${locationName} | XLata`).slice(0, 60);
        const seoDesc = (parsedContent.seo_description || '').slice(0, 160);

        const { error: updateError } = await supabase
          .from('local_seo_pages')
          .update({
            headline: parsedContent.headline || `Sistema para Ferro Velho em ${locationName}`,
            subheadline: parsedContent.subheadline || null,
            content_html: parsedContent.content_html,
            seo_title: seoTitle,
            seo_description: seoDesc,
            features: parsedContent.features || [],
            faq: parsedContent.faq || [],
            schema_data: schemaData,
            status: 'published',
            allow_indexing: true,
            sitemap_priority: 0.7,
            sitemap_changefreq: 'monthly',
            updated_at: new Date().toISOString(),
          })
          .eq('id', page.id);

        if (updateError) {
          results.push({ id: page.id, location: locationName, status: 'update_error', error: updateError.message });
          continue;
        }

        results.push({ id: page.id, location: locationName, status: 'success', wordCount });

        // Rate limiting between generations
        if (pagesToGenerate.indexOf(page) < pagesToGenerate.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (pageError) {
        console.error(`Error processing page ${page.id}:`, pageError);
        results.push({ 
          id: page.id, 
          location: page.city?.name || page.state?.name, 
          status: 'error', 
          error: pageError instanceof Error ? pageError.message : 'Unknown error' 
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status !== 'success').length;

    return new Response(JSON.stringify({
      success: true,
      message: `Generated ${successCount} pages, ${errorCount} errors`,
      generated: successCount,
      errors: errorCount,
      results
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Generate local SEO content error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function buildPrompt(
  locationName: string, 
  stateName: string, 
  stateAbbr: string,
  isCity: boolean, 
  slug: string
): string {
  const locationCtx = isCity 
    ? `a cidade de ${locationName}, no estado de ${stateName} (${stateAbbr})` 
    : `o estado de ${stateName} (${stateAbbr})`;

  const uniqueSeed = slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 5;
  
  const angleOptions = [
    `o crescimento do mercado de reciclagem na região e como a tecnologia está transformando os depósitos locais`,
    `os desafios financeiros que donos de ferro velho enfrentam na região e como superá-los com gestão profissional`,
    `a competitividade do setor de reciclagem na região e o que diferencia depósitos lucrativos dos que perdem dinheiro`,
    `a realidade operacional dos ferro velhos na região e como a organização impacta diretamente o lucro`,
    `as oportunidades de mercado para ferro velhos e depósitos de reciclagem na região e como aproveitá-las`
  ];

  const angle = angleOptions[uniqueSeed];

  return `
Crie um artigo COMPLETO, ÚNICO e PROFISSIONAL sobre sistema para ferro velho e reciclagem em ${locationCtx}.

═══════════════════════════════════════
REGRAS CRÍTICAS (SEGUIR OBRIGATORIAMENTE):
═══════════════════════════════════════

1. MÍNIMO 1500 PALAVRAS de conteúdo HTML (content_html)
2. Conteúdo 100% ÚNICO — não repita estruturas genéricas
3. ÂNGULO ESPECÍFICO para esta página: ${angle}
4. Mencione dados/contextos reais sobre ${locationName} (economia, indústria, população)
5. Tom profissional e educativo, como um consultor do setor
6. Mencione XLata de forma natural, no máximo 3 vezes, como "soluções como o XLata"
7. NÃO use frases genéricas como "nos dias de hoje" ou "é muito importante"

═══════════════════════════════════════
ESTRUTURA OBRIGATÓRIA DO CONTEÚDO HTML:
═══════════════════════════════════════

<article>
  <h2>Título sobre o mercado de reciclagem em ${locationName}</h2>
  <p>3-4 parágrafos contextualizando o setor na região, economia local, volume de sucata</p>

  <h2>Desafios reais de ferro velhos em ${locationName}</h2>
  <p>Problemas específicos: controle de caixa, precificação errada, perda de material, fornecedores, logística</p>
  <p>Exemplos práticos do dia a dia</p>

  <h2>Como um sistema de gestão transforma a operação</h2>
  <p>Benefícios concretos com números e exemplos</p>
  <ul><li>Controle de caixa integrado</li><li>Cálculo automático por kg</li><li>Relatórios de lucro real</li></ul>

  <h2>Precificação de sucata em ${locationName}: como calcular corretamente</h2>
  <p>Guia prático sobre precificação de materiais na região</p>
  <p>Tabela de referência de materiais comuns</p>

  <h2>Controle financeiro para ferro velho em ${locationName}</h2>
  <p>Organização financeira, separação de receitas/despesas, cálculo de margem</p>

  <h2>Funcionalidades essenciais de um sistema para ferro velho</h2>
  <ul><li>PDV especializado</li><li>Gestão de estoque por material</li><li>Comprovantes profissionais</li><li>Controle de caixa</li><li>Relatórios gerenciais</li></ul>

  <h2>Como começar a usar tecnologia no seu ferro velho em ${locationName}</h2>
  <p>Passo a passo prático, sem jargão técnico</p>

  <h2>Conclusão: O futuro dos ferro velhos em ${locationName}</h2>
  <p>Visão de futuro, call to action suave</p>
</article>

═══════════════════════════════════════
LINKS INTERNOS (inserir no HTML como <a href="...">):
═══════════════════════════════════════
Incluir pelo menos 4 destes links naturalmente no texto:
- <a href="/blog/preco-sucata-hoje-tabela-atualizada">preço da sucata hoje</a>
- <a href="/blog/quanto-vale-kg-cobre-hoje">quanto vale o kg do cobre</a>
- <a href="/blog/como-calcular-preco-sucata-corretamente">como calcular preço da sucata</a>
- <a href="/sistema-para-ferro-velho">sistema para ferro velho</a>
- <a href="/blog/como-abrir-ferro-velho-lucrativo">como abrir ferro velho</a>
- <a href="/register">teste grátis o XLata</a>

═══════════════════════════════════════
FAQ (5-7 perguntas únicas sobre ${locationName}):
═══════════════════════════════════════
Perguntas que pessoas reais fariam sobre ferro velho/reciclagem na região.
Respostas completas com 3-5 frases cada.

═══════════════════════════════════════
FEATURES (6 cards):
═══════════════════════════════════════
Funcionalidades do sistema, cada uma com ícone, título e descrição curta.
Ícones válidos: Scale, Receipt, BarChart3, Smartphone, ShieldCheck, Headphones, DollarSign, Package, Users, Truck

═══════════════════════════════════════
FORMATO DE RESPOSTA (JSON puro, sem markdown):
═══════════════════════════════════════
{
  "headline": "Sistema para Ferro Velho em ${locationName} — Gestão Completa para Depósitos de Reciclagem",
  "subheadline": "Subtítulo persuasivo e único com keyword local (max 120 chars)",
  "content_html": "<article>CONTEÚDO HTML COMPLETO COM MÍNIMO 1500 PALAVRAS...</article>",
  "seo_title": "Sistema Ferro Velho ${locationName} ${stateAbbr} | Gestão Completa | XLata",
  "seo_description": "Meta description única e persuasiva com keyword local, max 155 chars",
  "features": [
    {"icon": "Scale", "title": "Título", "description": "Descrição curta e objetiva"},
    {"icon": "Receipt", "title": "Título", "description": "Descrição curta e objetiva"},
    {"icon": "BarChart3", "title": "Título", "description": "Descrição curta e objetiva"},
    {"icon": "Smartphone", "title": "Título", "description": "Descrição curta e objetiva"},
    {"icon": "ShieldCheck", "title": "Título", "description": "Descrição curta e objetiva"},
    {"icon": "Headphones", "title": "Título", "description": "Descrição curta e objetiva"}
  ],
  "faq": [
    {"question": "Pergunta específica sobre ${locationName}?", "answer": "Resposta completa e detalhada."}
  ]
}`;
}

function buildSchemaData(
  locationName: string, 
  stateName: string, 
  isCity: boolean,
  faq: Array<{ question: string; answer: string }>
): object {
  const faqSchema = faq.map(item => ({
    "@type": "Question",
    "name": item.question,
    "acceptedAnswer": { "@type": "Answer", "text": item.answer }
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": `XLata - Sistema para Ferro Velho em ${locationName}`,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "BRL" },
        "areaServed": isCity ? {
          "@type": "City", "name": locationName,
          "containedInPlace": { "@type": "State", "name": stateName }
        } : {
          "@type": "State", "name": locationName,
          "containedInPlace": { "@type": "Country", "name": "Brasil" }
        }
      },
      {
        "@type": "Organization",
        "name": "XLata",
        "url": "https://xlata.site",
        "logo": "https://xlata.site/lovable-uploads/XLATALOGO.png",
        "serviceArea": { "@type": isCity ? "City" : "State", "name": locationName }
      },
      ...(faqSchema.length > 0 ? [{
        "@type": "FAQPage",
        "mainEntity": faqSchema
      }] : [])
    ]
  };
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(' ').filter(word => word.length > 0).length;
}
