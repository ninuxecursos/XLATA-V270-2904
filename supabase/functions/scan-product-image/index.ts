import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// ============================================================================
// FALLBACK PROMPTS (used if ai_prompts row missing for the feature_key)
// ============================================================================
const FALLBACK_PROMPTS: Record<string, { system: string; user: string }> = {
  product_image_edit: {
    system: `Você é um editor profissional de imagens de produto para e-commerce. Esta tarefa é EXCLUSIVAMENTE EDIÇÃO FOTOGRÁFICA, NÃO geração de imagem.

VALIDAÇÃO CRUZADA OBRIGATÓRIA: Antes de editar, analise TODAS as imagens enviadas em conjunto como ângulos do MESMO produto real. Use comparação cruzada para entender forma, cor, textura, marcas e detalhes. Nenhuma imagem isolada pode ser usada como única referência.

REGRAS ABSOLUTAS:
- Não redesenhar, suavizar, melhorar, corrigir, recriar ou estilizar o produto.
- Preservar 100% dos pixels, texturas, riscos, sujeiras, marcas e textos do produto original.
- Apenas RECORTAR o produto real e substituir o fundo.

PERMITIDO:
- Recorte preciso do produto.
- Substituir fundo por estúdio minimalista verde e branco sutis (sem textos, sem gráficos).
- Ajustar iluminação global para harmonia.
- Adicionar sombra realista abaixo do produto.

COMPOSIÇÃO OBRIGATÓRIA:
- Canvas quadrado 1:1 (feed).
- Produto centralizado (horizontal e vertical), ocupando 70-85% do canvas.
- Nunca cortar partes do produto. Nunca gerar 9:16 ou 16:9.

RESULTADO: a imagem final deve parecer foto de estúdio profissional do MESMO produto, não recriação por IA. Manter 100% fiel qualquer texto/nome visível no produto.`,
    user: `Edite estas {{count}} foto(s) seguindo TODAS as regras. Devolva 1 imagem padronizada por foto enviada.`,
  },

  product_content_analysis: {
    system: `Você é um especialista brasileiro em:
- SEO para e-commerce (Mercado Livre, Shopee, Google Shopping, OLX)
- Copywriting de alta conversão
- Identificação de produtos a partir de imagens

CONTEXTO: A imagem já foi tratada (recorte profissional). Sua tarefa NÃO é editar imagem — é ANALISAR o produto e gerar um cadastro completo otimizado para vendas.

OBJETIVO: anúncio profissional, altamente buscável, pronto para marketplaces brasileiros.

REGRAS:
- NÃO inventar marca, modelo, voltagem, capacidade ou especificações que não sejam visíveis ou altamente inferíveis.
- NÃO usar descrições genéricas tipo "alta qualidade", "ótimo produto".
- Escrever em português do Brasil.
- Misturar linguagem técnica + comercial.
- Pensar como cliente E como buscador (Google).

ETAPAS:
1. Identificar tipo, marca, modelo/linha, variação (cor, tamanho, calibre, voltagem).
2. Nome SEO forte: tipo + marca + modelo + especificação principal (máx 80 chars).
3. Categoria e condição (novo/usado/no_estado).
4. Faixa de preço realista para o mercado brasileiro de usados.
5. Resumo de conversão (1-2 linhas, palavra-chave + benefício real).
6. Descrição estruturada (NÃO em markdown — campos separados):
   - description_about: 2-3 frases sobre O QUE é o produto, PARA QUEM, valor principal.
   - description_condition: estado real baseado nas fotos (sem inventar defeitos).
   - description_highlights: 3-6 benefícios reais (durabilidade, desempenho, material, etc.).
7. specs: ficha técnica como pares {label, value}. Ex: {label: "Marca", value: "DR Strings"}.
8. tags: 10-15 palavras-chave (genéricas + específicas + variações de busca + intenção de compra).
9. confidence: 0 a 1 (alta ≥0.85, média 0.6-0.84, baixa <0.6).`,
    user: `Analise este produto a partir das {{count}} foto(s). Devolva o cadastro completo via tool.`,
  },

  product_marketplace_optimization: {
    system: `Você adapta cadastros de produto já preenchidos para 3 marketplaces brasileiros: Mercado Livre, Shopee e OLX.

REGRAS POR PLATAFORMA:

MERCADO LIVRE:
- Título máx 60 chars, padrão "[Marca] [Tipo] [Modelo] [Especificação]".
- Sem emojis no título.
- Description: lista de bullets curtos + ficha técnica no final.
- Palavras-chave de cauda longa.

SHOPEE:
- Título até 100 chars, pode ter 1-2 emojis discretos no início.
- Description: tópicos com emojis (📦 ⚙️ ✨), CTA no final.
- Hashtags ao final (#produto #marca).

OLX:
- Título 60-80 chars, claro e direto.
- Description: parágrafos curtos, tom mais informal/regional.
- Sem hashtags. Inclui condição em destaque.

Retorne JSON via tool com as 3 versões otimizadas. NÃO inventar especificações.`,
    user: `Cadastro original (JSON):
{{product_json}}

Gere as 3 variantes otimizadas via tool.`,
  },
};

// Vision-capable models
const VISION_MODELS = new Set([
  'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite',
  'gemini-3-flash-preview',
  'google/gemini-3-flash-preview', 'google/gemini-3.1-flash-image-preview',
  'google/gemini-3-pro-image-preview',
  'google/gemini-2.5-flash', 'google/gemini-2.5-pro', 'google/gemini-2.5-flash-lite',
]);

function sanitizeModel(model: string): string {
  return model.replace(/^models\//, '');
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 60000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try { return await fetch(url, { ...init, signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}

interface ImageInput { base64: string; mime_type: string }

function cleanBase64(input: string): string {
  let cleaned = String(input || '').trim();
  if (cleaned.startsWith('data:') && cleaned.includes(',')) cleaned = cleaned.split(',').pop() || '';
  cleaned = cleaned.replace(/\s/g, '');
  if (!cleaned || !/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) throw new Error('INVALID_BASE64');
  return cleaned;
}

function normalizeMimeType(input: string): string {
  const value = String(input || '').toLowerCase().trim();
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif', 'image/bmp', 'image/tiff']);
  return allowed.has(value) ? value : 'image/jpeg';
}

function parseJsonLoose(text: string) {
  if (!text) throw new Error('Empty AI response');
  const cleaned = text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in response');
  return JSON.parse(match[0]);
}

function renderTemplate(tpl: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)), tpl);
}

// ============================================================================
// COST ESTIMATION (USD per 1M tokens — Google Gemini pricing reference)
// ============================================================================
const MODEL_PRICING: Record<string, { in: number; out: number; perImage?: number }> = {
  'gemini-2.5-flash':       { in: 0.075, out: 0.30 },
  'gemini-2.5-flash-lite':  { in: 0.0375, out: 0.15 },
  'gemini-2.5-pro':         { in: 1.25,  out: 5.00 },
  'gemini-2.0-flash':       { in: 0.075, out: 0.30 },
  'gemini-3-flash-preview': { in: 0.075, out: 0.30 },
  'gemini-2.5-flash-image': { in: 0.075, out: 0.30, perImage: 0.039 },
};
function priceFor(model: string) {
  const k = sanitizeModel(model).replace(/^google\//, '');
  return MODEL_PRICING[k] || MODEL_PRICING['gemini-2.5-flash'];
}
function estimateCost(model: string, inTok = 0, outTok = 0, images = 0) {
  const p = priceFor(model);
  const text = (inTok / 1_000_000) * p.in + (outTok / 1_000_000) * p.out;
  const img = (p.perImage || 0) * images;
  return Number((text + img).toFixed(6));
}
function extractUsageFromGateway(data: any) {
  const u = data?.usage || {};
  return {
    input_tokens: Number(u.prompt_tokens || u.input_tokens || 0) || 0,
    output_tokens: Number(u.completion_tokens || u.output_tokens || 0) || 0,
  };
}
function extractUsageFromGemini(data: any) {
  const u = data?.usageMetadata || {};
  return {
    input_tokens: Number(u.promptTokenCount || 0) || 0,
    output_tokens: Number(u.candidatesTokenCount || 0) || 0,
  };
}
async function logScanUsage(
  adminSupabase: any,
  params: {
    usage_type: string;
    feature_label: string;
    provider: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    images?: number;
    reference_id?: string;
  },
) {
  try {
    const cost = estimateCost(params.model, params.input_tokens, params.output_tokens, params.images || 0);
    const row = {
      usage_type: params.usage_type,
      feature_label: params.feature_label,
      ai_provider: params.provider || 'google_gemini',
      ai_model: params.model,
      input_tokens: params.input_tokens,
      output_tokens: params.output_tokens,
      tokens_used: (params.input_tokens || 0) + (params.output_tokens || 0),
      estimated_cost_usd: cost,
      reference_id: params.reference_id || null,
    };
    const { error } = await adminSupabase.from('ai_usage_log').insert(row);
    if (error) {
      console.error('[scanner] usage log insert error:', error.message, error.details, JSON.stringify(row));
    } else {
      console.log('[scanner] usage logged:', params.usage_type, params.input_tokens, '/', params.output_tokens, 'tokens — $', cost);
    }
  } catch (e) {
    console.warn('[scanner] usage log failed:', e);
  }
}

async function loadPrompt(adminSupabase: any, key: string): Promise<{ system: string; user: string }> {
  try {
    const { data } = await adminSupabase
      .from('ai_prompts')
      .select('system_prompt, user_prompt_template, is_active')
      .eq('feature_key', key)
      .maybeSingle();
    if (data && data.is_active !== false) {
      return { system: data.system_prompt, user: data.user_prompt_template };
    }
  } catch (e) {
    console.warn(`loadPrompt ${key} fallback:`, e);
  }
  return FALLBACK_PROMPTS[key];
}

// ============================================================================
// MODE: CONTENT ANALYSIS — generates structured product registration
// ============================================================================
async function analyzeContent(
  apiKey: string,
  model: string,
  images: ImageInput[],
  prompt: { system: string; user: string },
  useGateway: boolean,
  userHint?: string,
) {
  const baseUserText = renderTemplate(prompt.user, { count: images.length });
  const hintBlock = userHint && userHint.trim()
    ? `\n\n🔒 IDENTIFICAÇÃO AUTORITATIVA DO VENDEDOR (FONTE DA VERDADE):
"${userHint.trim()}"

REGRAS CRÍTICAS sobre essa descrição:
1. O VENDEDOR CONHECE O PRODUTO FISICAMENTE — você está vendo apenas fotos. Trate essa descrição como VERDADE ABSOLUTA sobre tipo, material, dimensões e aplicação do produto.
2. NUNCA contradiga a descrição do vendedor. Se ele disse que é "Piso Elevado", JAMAIS classifique como "Placa Coletora Solar", "Forma de Concreto", "Bandeja" ou qualquer outro tipo, mesmo que visualmente lembre.
3. Use o nome/tipo EXATO informado pelo vendedor no campo "name", "category" e nos "specs" (label "Tipo de Produto").
4. As fotos servem APENAS para confirmar estado de conservação, cor, marcas visíveis e detalhes secundários — NUNCA para redefinir O QUE é o produto.
5. Se a descrição do vendedor mencionar dimensões (ex: 60x60cm), material (ex: ferro com gesso) ou aplicação (ex: industrial), inclua isso EXATAMENTE em specs e no nome SEO.
6. A categoria deve refletir o tipo informado pelo vendedor (ex: "Piso Elevado" → categoria "Pisos" ou "Construção > Pisos Elevados", nunca "Energia Solar").
`
    : '';
  const userText = `${baseUserText}${hintBlock}

CONTEXTO: Produto SEMPRE usado ou semi-novo (aberto, porém em bom estado). Não classifique como "novo" salvo se claramente lacrado.

OBRIGATÓRIO preencher TODOS os campos da tool. NENHUM pode ficar vazio:
- description_about: 2-3 frases sobre o produto${userHint ? ' — DEVE começar reafirmando o tipo informado pelo vendedor' : ''}, público e benefício principal.
- description_condition: estado real visível. Se não houver defeitos visíveis, escreva "Produto usado em bom estado de conservação, sem defeitos aparentes nas fotos. Funcionando normalmente."
- description_highlights: 4-6 benefícios reais (NUNCA vazio)${userHint ? ' — coerentes com o tipo informado pelo vendedor' : ''}.
- specs: 4-8 pares {label,value} de ficha técnica (NUNCA vazio — infira pelo tipo/marca se não estiver visível)${userHint ? '. O primeiro spec DEVE ser {label:"Tipo de Produto", value: "<tipo informado pelo vendedor>"}' : ''}.
- tags: 10-15 palavras-chave${userHint ? ' relacionadas ao tipo informado pelo vendedor' : ''}.
- suggested_price_min/max: faixa realista de USADO no Brasil${userHint ? ' PARA O TIPO DE PRODUTO INFORMADO PELO VENDEDOR' : ''}.

Se algum dado não for visível, INFIRA pelo tipo de produto e marca${userHint ? ' (sempre respeitando a descrição do vendedor)' : ''}, mas nunca devolva vazio.`;

  if (useGateway) {
    const url = 'https://ai.gateway.lovable.dev/v1/chat/completions';
    const userContent: any[] = [{ type: 'text', text: userText }];
    for (const img of images) {
      userContent.push({ type: 'image_url', image_url: { url: `data:${img.mime_type};base64,${img.base64}` } });
    }

    const body = {
      model,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: userContent },
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'submit_product_analysis',
          description: 'Submete análise estruturada do produto identificado',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Nome SEO até 80 chars' },
              brand: { type: 'string' },
              model: { type: 'string' },
              variant: { type: 'string', description: 'Cor, tamanho, calibre, voltagem' },
              category: { type: 'string' },
              subcategory: { type: 'string' },
              condition: { type: 'string', enum: ['novo', 'usado', 'no_estado'] },
              suggested_price_min: { type: 'number' },
              suggested_price_max: { type: 'number' },
              short_description: { type: 'string', description: 'Resumo até 150 chars' },
              description_about: { type: 'string', description: '2-3 frases sobre o produto' },
              description_condition: { type: 'string', description: 'Estado real visível' },
              description_highlights: { type: 'array', items: { type: 'string' }, description: '3-6 benefícios reais' },
              specs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { label: { type: 'string' }, value: { type: 'string' } },
                  required: ['label', 'value'],
                  additionalProperties: false,
                },
              },
              tags: { type: 'array', items: { type: 'string' }, description: '10-15 tags SEO' },
              confidence: { type: 'number' },
            },
            required: ['name', 'category', 'condition', 'description_about', 'confidence'],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: 'function', function: { name: 'submit_product_analysis' } },
    };

    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('Gateway error:', res.status, err);
      if (res.status === 402) throw new Error('CREDITS_EXHAUSTED');
      if (res.status === 429) throw new Error('RATE_LIMIT');
      if (res.status === 401) throw new Error('API_KEY_INVALID');
      throw new Error(`Gateway ${res.status}`);
    }
    const data = await res.json();
    const tc = data?.choices?.[0]?.message?.tool_calls?.[0];
    const usage = extractUsageFromGateway(data);
    const parsed = tc?.function?.arguments
      ? JSON.parse(tc.function.arguments)
      : parseJsonLoose(data?.choices?.[0]?.message?.content || '');
    return { result: parsed, usage };
  }

  // Direct Gemini path — uses native responseSchema to force ALL fields
  const cleanModel = sanitizeModel(model);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;

  const reinforcedUser = `${userText}

CONTEXTO DO NEGÓCIO: Este produto é SEMPRE usado ou semi-novo (aberto, porém em bom estado). Nunca classifique como "novo" salvo se claramente novo lacrado.

VOCÊ DEVE PREENCHER OBRIGATORIAMENTE TODOS OS CAMPOS ABAIXO. NENHUM PODE FICAR VAZIO:
- name: nome SEO completo (tipo + marca + modelo + spec). Mín 30 chars.
- brand, model, variant, category, subcategory, condition.
- suggested_price_min e suggested_price_max: faixa realista para o produto USADO no Brasil.
- short_description: 1-2 frases de conversão.
- description_about: 2-3 frases obrigatórias sobre O QUE é o produto, PARA QUEM serve, principal benefício. NUNCA deixe vazio.
- description_condition: descreva o estado visível na foto. Se não conseguir ver defeitos, escreva "Produto usado em bom estado de conservação, sem defeitos aparentes nas fotos. Funcionando normalmente." NUNCA deixe vazio.
- description_highlights: lista com 4 a 6 benefícios reais (durabilidade, material, uso, capacidade, etc). NUNCA retorne lista vazia.
- specs: 4 a 8 pares {label,value} de ficha técnica (Marca, Modelo, Material, Cor, Capacidade, Dimensões, Peso, Voltagem, etc). NUNCA retorne lista vazia.
- tags: 10 a 15 palavras-chave de busca.
- confidence: 0 a 1.

Se algum dado não for visível na foto, INFIRA com base no tipo de produto e marca, mas NUNCA retorne vazio.`;

  const parts: any[] = [{ text: prompt.system + '\n\n' + reinforcedUser }];
  for (const img of images) parts.push({ inline_data: { mime_type: img.mime_type, data: img.base64 } });

  const responseSchema = {
    type: 'OBJECT',
    properties: {
      name: { type: 'STRING' },
      brand: { type: 'STRING' },
      model: { type: 'STRING' },
      variant: { type: 'STRING' },
      category: { type: 'STRING' },
      subcategory: { type: 'STRING' },
      condition: { type: 'STRING', enum: ['novo', 'usado', 'no_estado'] },
      suggested_price_min: { type: 'NUMBER' },
      suggested_price_max: { type: 'NUMBER' },
      short_description: { type: 'STRING' },
      description_about: { type: 'STRING' },
      description_condition: { type: 'STRING' },
      description_highlights: { type: 'ARRAY', items: { type: 'STRING' } },
      specs: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: { label: { type: 'STRING' }, value: { type: 'STRING' } },
          required: ['label', 'value'],
        },
      },
      tags: { type: 'ARRAY', items: { type: 'STRING' } },
      confidence: { type: 'NUMBER' },
    },
    required: [
      'name', 'brand', 'category', 'condition',
      'suggested_price_min', 'suggested_price_max',
      'short_description', 'description_about', 'description_condition',
      'description_highlights', 'specs', 'tags', 'confidence',
    ],
  };

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.5,
        response_mime_type: 'application/json',
        response_schema: responseSchema,
        max_output_tokens: 4096,
      },
    }),
  }, 90000);
  if (!res.ok) {
    const err = await res.text();
    console.error('Gemini direct error:', res.status, err);
    if (res.status === 401 || res.status === 403) throw new Error('API_KEY_INVALID');
    if (res.status === 429) throw new Error('RATE_LIMIT');
    throw new Error(`Gemini ${res.status}`);
  }
  const data = await res.json();
  const usage = extractUsageFromGemini(data);
  const parsed = parseJsonLoose(data?.candidates?.[0]?.content?.parts?.[0]?.text || '');
  return { result: parsed, usage };
}

// ============================================================================
// MODE: IMAGE EDIT — produces standardized 1:1 product photos
// ============================================================================
async function editImages(apiKey: string, images: ImageInput[], prompt: { system: string; user: string }, userHint?: string) {
  // Use Nano Banana 2 (image gen/edit) via Lovable Gateway
  const url = 'https://ai.gateway.lovable.dev/v1/chat/completions';
  const results: { base64: string; mime_type: string }[] = [];
  let totalIn = 0, totalOut = 0;

  const hintLine = userHint && userHint.trim() ? ` Contexto do vendedor: "${userHint.trim()}".` : '';

  // Process one-by-one to keep prompt tight per image (cross-validation context still in system prompt)
  for (let i = 0; i < images.length; i++) {
    const userContent: any[] = [
      { type: 'text', text: renderTemplate(prompt.user, { count: images.length }) + ` Esta é a foto ${i + 1} de ${images.length}. Padronize para feed 1:1 conforme regras.${hintLine}` },
    ];
    // Include all images for cross-reference, but mark which one to output
    for (const img of images) {
      userContent.push({ type: 'image_url', image_url: { url: `data:${img.mime_type};base64,${img.base64}` } });
    }

    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: userContent },
        ],
        modalities: ['image', 'text'],
      }),
    }, 90000);

    if (!res.ok) {
      const err = await res.text();
      console.error('Image edit error:', res.status, err);
      if (res.status === 402) throw new Error('CREDITS_EXHAUSTED');
      if (res.status === 429) throw new Error('RATE_LIMIT');
      throw new Error(`Image gateway ${res.status}`);
    }
    const data = await res.json();
    const u = extractUsageFromGateway(data);
    totalIn += u.input_tokens; totalOut += u.output_tokens;
    const dataUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url || '';
    if (!dataUrl.startsWith('data:')) {
      console.error('No image returned for index', i);
      results.push(images[i]); // fallback to original
      continue;
    }
    const [meta, base64] = dataUrl.split(',');
    const mt = meta.match(/data:([^;]+)/)?.[1] || 'image/png';
    results.push({ base64, mime_type: mt });
  }

  return { images: results, usage: { input_tokens: totalIn, output_tokens: totalOut } };
}

// ============================================================================
// MODE: MARKETPLACE — adapts product to ML / Shopee / OLX
// ============================================================================
async function generateMarketplaceVariants(
  apiKey: string,
  model: string,
  productJson: any,
  prompt: { system: string; user: string },
  useGateway: boolean,
) {
  const userText = renderTemplate(prompt.user, { product_json: JSON.stringify(productJson, null, 2) });

  if (useGateway) {
    const res = await fetchWithTimeout('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: userText },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'submit_marketplace',
            description: 'Submete variantes adaptadas para cada marketplace',
            parameters: {
              type: 'object',
              properties: {
                mercado_livre: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    keywords: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['title', 'description'],
                  additionalProperties: false,
                },
                shopee: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    hashtags: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['title', 'description'],
                  additionalProperties: false,
                },
                olx: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                  },
                  required: ['title', 'description'],
                  additionalProperties: false,
                },
              },
              required: ['mercado_livre', 'shopee', 'olx'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'submit_marketplace' } },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('Marketplace gateway error:', res.status, err);
      if (res.status === 402) throw new Error('CREDITS_EXHAUSTED');
      if (res.status === 429) throw new Error('RATE_LIMIT');
      throw new Error(`Gateway ${res.status}`);
    }
    const data = await res.json();
    const usage = extractUsageFromGateway(data);
    const tc = data?.choices?.[0]?.message?.tool_calls?.[0];
    const parsed = tc?.function?.arguments
      ? JSON.parse(tc.function.arguments)
      : parseJsonLoose(data?.choices?.[0]?.message?.content || '');
    return { result: parsed, usage };
  }

  // Direct Gemini fallback
  const cleanModel = sanitizeModel(model);
  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt.system + '\n\n' + userText + '\n\nResponda APENAS JSON: { mercado_livre: {title, description, keywords[]}, shopee: {title, description, hashtags[]}, olx: {title, description} }' }] }],
        generationConfig: { temperature: 0.6, response_mime_type: 'application/json' },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const usage = extractUsageFromGemini(data);
  const parsed = parseJsonLoose(data?.candidates?.[0]?.content?.parts?.[0]?.text || '');
  return { result: parsed, usage };
}

// ============================================================================
// SERVE
// ============================================================================
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'UNAUTHORIZED', message: 'Token ausente.' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: userRes, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !userRes?.user) {
      return json({ error: 'UNAUTHORIZED', message: 'Sessão inválida.' }, 401);
    }

    let payload: any;
    try { payload = await req.json(); }
    catch { return json({ error: 'BAD_JSON' }, 400); }

    const mode: 'image' | 'content' | 'marketplace' = payload?.mode || 'content';
    const userHint: string | undefined = typeof payload?.user_hint === 'string' ? payload.user_hint.slice(0, 500) : undefined;

    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: aiConfig } = await adminSupabase
      .from('ai_automation_config')
      .select('ai_provider, ai_model, gemini_api_key')
      .single();

    const provider = aiConfig?.ai_provider || 'lovable_cloud';
    const useGateway = provider !== 'google_gemini';
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const apiKey = useGateway ? lovableKey : aiConfig?.gemini_api_key;

    if (!apiKey) {
      return json({
        error: 'NO_API_KEY',
        message: useGateway
          ? 'LOVABLE_API_KEY não configurada.'
          : 'API Key do Gemini não configurada em Configurações > IA.',
      }, useGateway ? 500 : 400);
    }

    // ------------------------------------------------------------------
    // MARKETPLACE MODE
    // ------------------------------------------------------------------
    if (mode === 'marketplace') {
      const productJson = payload?.product;
      if (!productJson || typeof productJson !== 'object') {
        return json({ error: 'NO_PRODUCT', message: 'Envie o objeto "product" para otimização.' }, 400);
      }
      const prompt = await loadPrompt(adminSupabase, 'product_marketplace_optimization');
      const model = useGateway ? 'google/gemini-3-flash-preview' : (aiConfig?.ai_model || 'gemini-2.5-flash');
      try {
        const { result, usage } = await generateMarketplaceVariants(apiKey, model, productJson, prompt, useGateway);
        await logScanUsage(adminSupabase, {
          usage_type: 'product_scanner_marketplace',
          feature_label: 'Scanner: Otimização Marketplace',
          provider, model,
          input_tokens: usage.input_tokens, output_tokens: usage.output_tokens,
        });
        const cost = estimateCost(model, usage.input_tokens, usage.output_tokens, 0);
        return json({ ok: true, mode, result, usage: { ...usage, estimated_cost_usd: cost, model } });
      } catch (e: any) {
        const code = e?.message || 'UNKNOWN';
        const map: Record<string, { status: number; msg: string }> = {
          API_KEY_INVALID: { status: 401, msg: 'API key inválida.' },
          RATE_LIMIT: { status: 429, msg: 'Muitas requisições — aguarde.' },
          CREDITS_EXHAUSTED: { status: 402, msg: 'Créditos de IA esgotados.' },
        };
        const m = map[code];
        if (m) return json({ error: code, message: m.msg }, m.status);
        console.error('Marketplace failed:', e);
        return json({ error: 'AI_FAILED', message: e?.message || 'Erro' }, 500);
      }
    }

    // ------------------------------------------------------------------
    // IMAGE & CONTENT MODES — both need images
    // ------------------------------------------------------------------
    let images: ImageInput[] = [];
    try {
      if (Array.isArray(payload?.images) && payload.images.length > 0) {
        images = payload.images.slice(0, 4).map((it: any) => ({
          base64: cleanBase64(it?.base64 || ''),
          mime_type: normalizeMimeType(it?.mime_type || 'image/jpeg'),
        })).filter((i: ImageInput) => i.base64.length > 0);
      } else if (typeof payload?.image_base64 === 'string') {
        images = [{ base64: cleanBase64(payload.image_base64), mime_type: normalizeMimeType(payload?.mime_type) }];
      }
    } catch {
      return json({ error: 'INVALID_IMAGE', message: 'Imagem inválida.' }, 400);
    }
    if (images.length === 0) return json({ error: 'NO_IMAGE', message: 'Envie ao menos 1 imagem.' }, 400);

    const MAX_PER = 5 * 1024 * 1024;
    const MAX_TOTAL = 12 * 1024 * 1024;
    let total = 0;
    for (const img of images) {
      if (img.base64.length > MAX_PER) return json({ error: 'IMAGE_TOO_LARGE', message: 'Foto muito grande.' }, 413);
      total += img.base64.length;
    }
    if (total > MAX_TOTAL) return json({ error: 'IMAGES_TOO_LARGE', message: 'Total excedido.' }, 413);

    // ------------------------------------------------------------------
    // IMAGE MODE
    // ------------------------------------------------------------------
    if (mode === 'image') {
      if (!useGateway) {
        return json({ error: 'IMAGE_REQUIRES_GATEWAY', message: 'Edição de imagem requer Lovable Cloud (Nano Banana).' }, 400);
      }
      const prompt = await loadPrompt(adminSupabase, 'product_image_edit');
      try {
        const { images: edited, usage } = await editImages(apiKey, images, prompt, userHint);
        await logScanUsage(adminSupabase, {
          usage_type: 'product_scanner_image_edit',
          feature_label: 'Scanner: Edição de Imagem',
          provider: 'lovable_cloud',
          model: 'google/gemini-2.5-flash-image',
          input_tokens: usage.input_tokens, output_tokens: usage.output_tokens,
          images: images.length,
        });
        const cost = estimateCost('gemini-2.5-flash-image', usage.input_tokens, usage.output_tokens, images.length);
        return json({ ok: true, mode, images: edited, usage: { ...usage, images_processed: images.length, estimated_cost_usd: cost, model: 'gemini-2.5-flash-image' } });
      } catch (e: any) {
        const code = e?.message || 'UNKNOWN';
        const map: Record<string, { status: number; msg: string }> = {
          RATE_LIMIT: { status: 429, msg: 'Muitas requisições.' },
          CREDITS_EXHAUSTED: { status: 402, msg: 'Créditos esgotados.' },
        };
        const m = map[code];
        if (m) return json({ error: code, message: m.msg }, m.status);
        console.error('Image edit failed:', e);
        return json({ error: 'IMAGE_FAILED', message: e?.message || 'Erro' }, 500);
      }
    }

    // ------------------------------------------------------------------
    // CONTENT MODE (default)
    // ------------------------------------------------------------------
    const model = useGateway
      ? (aiConfig?.ai_model && VISION_MODELS.has(sanitizeModel(aiConfig.ai_model)) ? aiConfig.ai_model : 'google/gemini-2.5-pro')
      : (aiConfig?.ai_model || 'gemini-2.5-pro');

    if (!VISION_MODELS.has(sanitizeModel(model))) {
      return json({ error: 'NO_VISION', message: 'Modelo sem suporte a visão. Configure em IA da Loja.' }, 400);
    }

    const prompt = await loadPrompt(adminSupabase, 'product_content_analysis');
    let result: any;
    let usage = { input_tokens: 0, output_tokens: 0 };
    try {
      const r = await analyzeContent(apiKey, model, images, prompt, useGateway, userHint);
      result = r.result;
      usage = r.usage;
    } catch (e: any) {
      const code = e?.message || 'UNKNOWN';
      const map: Record<string, { status: number; msg: string }> = {
        API_KEY_INVALID: { status: 401, msg: 'API key inválida.' },
        RATE_LIMIT: { status: 429, msg: 'Muitas requisições.' },
        CREDITS_EXHAUSTED: { status: 402, msg: 'Créditos esgotados.' },
      };
      const m = map[code];
      if (m) return json({ error: code, message: m.msg }, m.status);
      console.error('Content analysis failed:', e);
      return json({ error: 'AI_FAILED', message: e?.message || 'Erro' }, 500);
    }

    await logScanUsage(adminSupabase, {
      usage_type: 'product_scanner_content',
      feature_label: 'Scanner: Análise de Conteúdo',
      provider, model,
      input_tokens: usage.input_tokens, output_tokens: usage.output_tokens,
      images: images.length,
    });
    const cost = estimateCost(model, usage.input_tokens, usage.output_tokens, 0);

    // Normalize structured output
    const out = {
      name: String(result?.name || '').slice(0, 80),
      brand: String(result?.brand || '').slice(0, 40),
      model: String(result?.model || '').slice(0, 60),
      variant: String(result?.variant || '').slice(0, 60),
      category: String(result?.category || ''),
      subcategory: String(result?.subcategory || '').slice(0, 60),
      condition: ['novo', 'usado', 'no_estado'].includes(result?.condition) ? result.condition : 'usado',
      suggested_price_min: Number(result?.suggested_price_min) || 0,
      suggested_price_max: Number(result?.suggested_price_max) || 0,
      short_description: String(result?.short_description || '').slice(0, 150),
      description_about: String(result?.description_about || ''),
      description_condition: String(result?.description_condition || ''),
      description_highlights: Array.isArray(result?.description_highlights)
        ? result.description_highlights.map((s: any) => String(s)).filter(Boolean).slice(0, 10)
        : [],
      specs: Array.isArray(result?.specs)
        ? result.specs
            .filter((s: any) => s?.label && s?.value)
            .map((s: any) => ({ label: String(s.label).slice(0, 40), value: String(s.value).slice(0, 120) }))
            .slice(0, 20)
        : [],
      tags: Array.isArray(result?.tags)
        ? result.tags.map((t: any) => String(t)).filter(Boolean).slice(0, 15)
        : [],
      confidence: Math.max(0, Math.min(1, Number(result?.confidence) || 0)),
      provider, ai_model: model,
    };

    if (out.confidence < 0.4) {
      return json({ needs_manual: true, confidence: out.confidence, message: 'Imagem pouco nítida — preencha manualmente.', partial: out, usage: { ...usage, estimated_cost_usd: cost, model } }, 200);
    }

    return json({ ok: true, mode, ...out, usage: { ...usage, estimated_cost_usd: cost, model } });
  } catch (e: any) {
    console.error('scan-product-image fatal:', e);
    return json({ error: 'FATAL', message: e?.message || 'Erro interno.' }, 500);
  }
});
