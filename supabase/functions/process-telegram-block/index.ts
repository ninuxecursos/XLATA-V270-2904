import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// =====================================================
// AI PROMPT FOR BLOCK MODE
// =====================================================

const BLOCK_MODE_PROMPT = `Você é um vendedor experiente criando anúncios para a loja XLata (materiais industriais e usados).
 
 MENSAGENS DO VENDEDOR:
{MESSAGES}
 
NÚMERO DE FOTOS: {PHOTO_COUNT}
 
CATEGORIAS DISPONÍVEIS:
{CATEGORIES}
 
EXTRAIA E GERE um JSON válido (sem code blocks markdown) com TODOS os campos abaixo:
 
{
  "name": "Nome profissional do produto (max 80 chars)",
  "short_description": "Resumo curto e chamativo, persuasivo (max 150 chars). Ex: 'Fogão 4 bocas bem conservado, forno funcionando, aceita pix e cartão!'",
  "description": "Descrição formatada em Markdown seguindo a ESTRUTURA OBRIGATÓRIA abaixo",
  "price": 0.00,
  "sale_price": null,
  "cost_price": null,
  "stock_quantity": 1,
  "sale_type": "normal",
  "condition": "usado",
  "weight": null,
  "dimensions": { "width": null, "height": null, "depth": null },
  "category_id": "uuid-da-categoria",
  "category_name": "Nome da Categoria",
  "subcategory_name": "Nome da Subcategoria (ou null se produto genérico)",
  "tags": ["tag1", "tag2", "tag3"],
  "seo_title": "Título SEO (até 60 chars)",
  "seo_description": "Meta description (até 155 chars)",
  "slug": "url-amigavel-do-produto",
  "is_featured": false,
  "interactive_duration_minutes": null,
  "interactive_increment": null,
  "interactive_repost_count": null,
  "interactive_repost_delay_days": null
}
 
 ESTRUTURA OBRIGATÓRIA DA DESCRIÇÃO (use Markdown):
 
 📦 **Sobre o Produto**
 [Parágrafo curto e natural descrevendo o item - 2-3 frases]
 
 ⚙️ **Estado e Funcionamento**
 • [Ponto sobre condição física]
 • [Ponto sobre funcionamento]
 • [Se houver defeitos, mencione de forma honesta]
 
 ✨ **Destaques**
 • [Benefício 1]
 • [Benefício 2]
 • [Benefício 3]
 
 💳 **Formas de Pagamento**
 [Extraia as formas mencionadas pelo vendedor: Dinheiro, Pix, Débito, Crédito (só online). Se não mencionar, use "Consulte o vendedor"]
 
 🚚 **Entrega**
 [Se o vendedor mencionar entrega ou retirada, inclua aqui. Ex: "Somente retirada no local" ou "Entrega disponível na região". Se não mencionar, omita esta seção]
 
 [Se estoque baixo ou única unidade: ⚠️ Última unidade disponível!]
 
 REGRAS DE FORMATAÇÃO:
 - Use os emojis EXATAMENTE como mostrado (📦⚙️✨💳⚠️)
 - Use **negrito** para títulos de seção
 - Use • (bullet point) para listas
 - Quebre linhas entre seções para melhor leitura
 - Seja honesto e natural, como vendedor real conversando
 - NÃO use linguagem corporativa ou marketing exagerado
 - Mantenha tom amigável e direto
 - NÃO inclua dimensões técnicas na descrição (vão em campo separado)
 
PARÂMETROS DE VENDA INTERATIVA (OBRIGATÓRIO quando sale_type = "interactive"):
Quando detectar venda interativa, EXTRAIA com atenção:

1. DURAÇÃO (interactive_duration_minutes):
   - Busque por: "duração", "tempo", "minutos", "horas", "dia"
   - "30 minutos" → 30
   - "1 hora" ou "uma hora" → 60
   - "2 horas" ou "duas horas" → 120
   - "1 dia" ou "um dia" → 1440
   - Se não informado → null (usará padrão do sistema)

2. INCREMENTO/LANCE MÍNIMO (interactive_increment):
   - Busque por: "incremento", "lance mínimo", "lance de", "mínimo de"
   - "incremento de R$ 5" → 5.00
   - "lance mínimo de 10 reais" → 10.00
   - "mínimo de R$ 20" → 20.00
   - Se não informado → null (usará padrão do sistema)

3. REPOSTS AUTOMÁTICOS (interactive_repost_count):
   - Busque por: "repostar", "renovar", "repetir", "vezes"
   - "repostar 3 vezes" → 3
   - "renovar automaticamente" → 3
   - "repetir 5 vezes se não vender" → 5
   - Se não informado → 0 (sem repost automático)

4. INTERVALO ENTRE REPOSTS (interactive_repost_delay_days):
   - Busque por: "intervalo", "a cada X dias", "esperar X dias"
   - "a cada 3 dias" → 3
   - "intervalo de 1 dia" → 1
   - "esperar 7 dias" → 7
   - Se não informado → 3 (padrão)

SUBCATEGORIAS (campo subcategory_name):
- Sempre que o produto for específico o suficiente, sugira uma subcategoria dentro da categoria pai.
- A subcategoria deve ser um agrupamento lógico. Exemplos:
  "Materiais de Construção" → "Caixas d'Água e Reservatórios"
  "Máquinas e Ferramentas" → "Soldas e Acessórios"
  "Móveis e Decoração" → "Mesas e Cadeiras"
  "Eletrônicos e Informática" → "Monitores e Telas"
  "Veículos e Peças" → "Peças de Motor"
- Se o produto for genérico demais para subcategorizar, retorne subcategory_name como null.
- Use nomes curtos e descritivos (max 40 chars).

REGRAS CRÍTICAS:
1. PREÇO (price): Extraia o valor de VENDA. Busque por "vendo por", "R$", "reais", "preço". É OBRIGATÓRIO.
2. CUSTO (cost_price): Busque "paguei", "custou", "comprei por".
3. DIMENSÕES: Se mencionar "largura", "altura", "profundidade", "L x A x P", NÃO coloque na descrição.
4. PESO: Se mencionar "kg", "quilos", extraia para weight.
5. TIPO DE VENDA: "leilão", "interativa", "oferta", "lance" = "interactive". Senão = "normal".
6. CONDIÇÃO: "novo" ou "estado de novo" = "novo", "no estado" ou "sucata" = "no_estado", senão = "usado".
7. CATEGORIA: Mapeie baseado nas palavras-chave do texto.
8. FORMAS DE PAGAMENTO: Podem ir na descrição ("Aceita pix, cartão...").
9. Se não informar preço, use 0.
10. DESCRIÇÃO: DEVE seguir a estrutura Markdown acima com emojis e formatação.
11. VENDA INTERATIVA: Se detectar tipo interativo, EXTRAIA TODOS os parâmetros mencionados (duração, incremento, reposts).
12. SUBCATEGORIA: Sugira quando o produto for específico. Use nomes consistentes para agrupar produtos similares.
13. DESTAQUE (is_featured): Busque por "destaque", "destacar", "em destaque", "produto destaque", "featured". Se encontrado → true. Se não mencionado → false.
 
Retorne APENAS JSON válido.`;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

// Helper: attempt to repair truncated JSON
function tryRepairJSON(text: string): any | null {
  let s = text.trim();
  
  // Remove markdown code blocks if present
  if (s.startsWith('```json')) s = s.slice(7);
  if (s.startsWith('```')) s = s.slice(3);
  if (s.endsWith('```')) s = s.slice(0, -3);
  s = s.trim();

  // First try parsing as-is
  try {
    return JSON.parse(s);
  } catch (_) {
    // continue to repair
  }

  console.log('[JSON Repair] Attempting to repair truncated JSON, length:', s.length);

  // Try to close open strings and brackets
  let inString = false;
  let escaped = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\') { escaped = true; continue; }
    if (c === '"') { inString = !inString; }
  }

  // If we ended inside a string, close it
  if (inString) {
    s += '"';
  }

  // Remove trailing comma if present
  s = s.replace(/,\s*$/, '');

  // Count open/close braces and brackets
  let braces = 0, brackets = 0;
  inString = false;
  escaped = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\') { escaped = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === '{') braces++;
    if (c === '}') braces--;
    if (c === '[') brackets++;
    if (c === ']') brackets--;
  }

  // Close any unclosed brackets/braces
  while (brackets > 0) { s += ']'; brackets--; }
  while (braces > 0) { s += '}'; braces--; }

  try {
    const parsed = JSON.parse(s);
    console.log('[JSON Repair] Successfully repaired JSON');
    return parsed;
  } catch (e) {
    console.error('[JSON Repair] Repair failed:', (e as Error).message);
    return null;
  }
}

// Helper: call Google Gemini API directly
async function callGoogleDirect(geminiApiKey: string, model: string, systemPrompt: string, userPrompt: string) {
  const googleModel = model.startsWith('google/') ? model.slice(7) : model;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent?key=${geminiApiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
      ],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8000 },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google API error:', response.status, errorText);
    if (response.status === 429) throw { status: 429, message: 'Rate limit exceeded' };
    throw { status: response.status, message: `Google API error: ${response.status}` };
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw { status: 500, message: 'Empty response from Google AI' };
  return text;
}

// Helper: call Lovable gateway
async function callLovableGateway(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI Gateway error:', response.status, errorText);
    if (response.status === 429) throw { status: 429, message: 'Rate limit exceeded' };
    if (response.status === 402) throw { status: 402, message: 'Créditos insuficientes' };
    throw { status: 500, message: `AI Gateway error: ${response.status}` };
  }

  const aiResponse = await response.json();
  const content = aiResponse.choices?.[0]?.message?.content;
  if (!content) throw { status: 500, message: 'Empty response from AI' };
  return content;
}

// Helper: call AI with retry
async function callAIWithRetry(
  geminiApiKey: string | null,
  lovableApiKey: string | null,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxAttempts = 2
): Promise<any> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[AI] Attempt ${attempt}/${maxAttempts} via ${geminiApiKey ? 'Google Direct' : 'Lovable Gateway'}...`);
    
    let content: string;
    if (geminiApiKey) {
      content = await callGoogleDirect(geminiApiKey, model, systemPrompt, userPrompt);
    } else {
      content = await callLovableGateway(lovableApiKey!, model, systemPrompt, userPrompt);
    }

    console.log('[AI] Raw response length:', content.length);

    const parsed = tryRepairJSON(content);
    if (parsed && parsed.name) {
      return parsed;
    }

    console.warn(`[AI] Attempt ${attempt} failed to produce valid JSON, response snippet:`, content.substring(0, 200));
    
    if (attempt < maxAttempts) {
      console.log('[AI] Retrying...');
    }
  }

  throw { status: 500, message: 'A IA não conseguiu gerar um JSON válido após múltiplas tentativas' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, photo_count, categories, model } = await req.json();

    console.log('Processing block mode:', { messageCount: messages?.length, photoCount: photo_count });

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma mensagem fornecida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's Gemini API key from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: config } = await supabase
      .from('ai_automation_config')
      .select('gemini_api_key')
      .single();

    const geminiApiKey = config?.gemini_api_key;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!geminiApiKey && !lovableApiKey) {
      console.error('No API key available (neither Gemini nor Lovable)');
      return new Response(
        JSON.stringify({ error: 'Nenhuma chave de API configurada. Configure sua chave do Google Gemini nas configurações.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const allMessages = messages.join('\n---\n');
    const categoriesText = categories?.map((c: any) => `- ${c.name} (${c.id})`).join('\n') || '';
    
    const userPrompt = BLOCK_MODE_PROMPT
      .replace('{MESSAGES}', allMessages)
      .replace('{PHOTO_COUNT}', (photo_count || 0).toString())
      .replace('{CATEGORIES}', categoriesText);

    const systemPrompt = 'Você é um vendedor experiente criando anúncios de produtos usados. Escreva descrições NATURAIS e HUMANAS, como alguém falaria no dia a dia, sem formalidade excessiva. Extraia dados estruturados de mensagens livres. Retorne apenas JSON válido, sem code blocks markdown.';

    let parsed: any;
    try {
      parsed = await callAIWithRetry(
        geminiApiKey || null,
        lovableApiKey || null,
        model || 'google/gemini-3-flash-preview',
        systemPrompt,
        userPrompt
      );
    } catch (err: any) {
      const status = err.status || 500;
      return new Response(
        JSON.stringify({ error: err.message || 'Erro na API de IA' }),
        { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI processing complete:', parsed.name);

    // Log AI usage
    try {
      await supabase.from('ai_usage_log').insert({
        usage_type: 'product_generation',
        ai_provider: geminiApiKey ? 'google_gemini' : 'lovable_cloud',
        ai_model: model || (geminiApiKey ? 'gemini-2.5-flash' : 'google/gemini-3-flash-preview'),
      });
    } catch (e) {
      console.warn('Failed to log AI usage:', e);
    }

    // Validate and normalize
    const result = {
      name: parsed.name?.substring(0, 80) || 'Produto sem nome',
      short_description: parsed.short_description?.substring(0, 150) || '',
      description: parsed.description || '',
      price: typeof parsed.price === 'number' ? parsed.price : 0,
      sale_price: typeof parsed.sale_price === 'number' ? parsed.sale_price : null,
      cost_price: typeof parsed.cost_price === 'number' ? parsed.cost_price : null,
      stock_quantity: typeof parsed.stock_quantity === 'number' ? parsed.stock_quantity : 1,
      sale_type: parsed.sale_type === 'interactive' ? 'interactive' : 'normal',
      condition: ['novo', 'usado', 'no_estado'].includes(parsed.condition) ? parsed.condition : 'usado',
      weight: typeof parsed.weight === 'number' ? parsed.weight : null,
      dimensions: parsed.dimensions || null,
      category_id: parsed.category_id || null,
      category_name: parsed.category_name || 'Outros',
      subcategory_name: typeof parsed.subcategory_name === 'string' ? parsed.subcategory_name.substring(0, 40) : null,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 10) : [],
      seo_title: parsed.seo_title?.substring(0, 60) || '',
      seo_description: parsed.seo_description?.substring(0, 155) || '',
      slug: parsed.slug || generateSlug(parsed.name || 'produto'),
      interactive_duration_minutes: typeof parsed.interactive_duration_minutes === 'number' ? parsed.interactive_duration_minutes : null,
      interactive_increment: typeof parsed.interactive_increment === 'number' ? parsed.interactive_increment : null,
      interactive_repost_count: typeof parsed.interactive_repost_count === 'number' ? parsed.interactive_repost_count : null,
      interactive_repost_delay_days: typeof parsed.interactive_repost_delay_days === 'number' ? parsed.interactive_repost_delay_days : null,
      is_featured: parsed.is_featured === true,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing block:', error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
