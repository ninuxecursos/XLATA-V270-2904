import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =====================================================
// TYPES
// =====================================================

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

interface TelegramMessage {
  message_id: number;
  from: { id: number; username?: string };
  chat: { id: number };
  text?: string;
  caption?: string;
  photo?: Array<{ file_id: string; file_size: number }>;
}

interface BotConfig {
  id: string;
  bot_token: string;
  allowed_chat_ids: number[];
  default_category_id: string | null;
  is_active: boolean;
}

interface ProductBuffer {
  id: string;
  chat_id: number;
  messages: string[];
  photo_file_ids: string[];
  draft_product_id: string | null;
  status: 'collecting' | 'awaiting_confirm' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  ai_metadata: AIExtractedData | null;
}

interface AIExtractedData {
  name: string;
  short_description: string;
  description: string;
  price: number;
  sale_price: number | null;
  cost_price: number | null;
  stock_quantity: number;
  sale_type: 'normal' | 'interactive';
  condition: 'novo' | 'usado' | 'no_estado';
  weight: number | null;
  dimensions: { width: number | null; height: number | null; depth: number | null } | null;
  category_id: string | null;
  category_name: string | null;
  subcategory_name: string | null;
  tags: string[];
  seo_title: string;
  seo_description: string;
  slug: string;
  // Parâmetros de venda interativa
  interactive_duration_minutes: number | null;
  interactive_increment: number | null;
  interactive_repost_count: number | null;
  interactive_repost_delay_days: number | null;
}

// =====================================================
// CATEGORIES (IDs reais do banco)
// =====================================================

const CATEGORIES = [
  { id: '3b05a7fa-d478-408b-aa69-e5f5981df99b', name: 'Antiguidades e Coleções', keywords: ['antigo', 'antiguidade', 'coleção', 'vintage', 'retrô', 'raro'] },
  { id: 'b9790bb0-fb00-45f6-88ec-a208d89b290e', name: 'Casa e Jardim', keywords: ['jardim', 'planta', 'vaso', 'decoração', 'casa', 'quintal'] },
  { id: 'b794d863-d8b2-4015-9ead-169168dcc41e', name: 'Comercial e Escritório', keywords: ['escritório', 'comercial', 'loja', 'vitrine', 'balcão'] },
  { id: '7f6c70e7-ca6d-4714-88e4-97e142c0a459', name: 'Eletrônicos e Informática', keywords: ['computador', 'eletrônico', 'placa', 'monitor', 'notebook', 'celular'] },
  { id: '15b4d9dc-cec9-46ae-b081-7d83d4c384fe', name: 'Esporte e Lazer', keywords: ['esporte', 'bicicleta', 'academia', 'esteira', 'peso', 'lazer'] },
  { id: '88b9db73-56f0-4652-8d93-39cdf9122981', name: 'Máquinas e Ferramentas', keywords: ['máquina', 'ferramenta', 'solda', 'motor', 'compressor', 'torno', 'furadeira'] },
  { id: '08c70716-33d5-4e22-b460-e1154e3e0edf', name: 'Materiais de Construção', keywords: ['construção', 'tijolo', 'cimento', 'escada', 'tubo', 'porta', 'janela', 'telha'] },
  { id: 'c5f61fef-b7d6-4e75-9331-5c74ba387fe5', name: 'Móveis e Decoração', keywords: ['mesa', 'cadeira', 'sofá', 'estante', 'armário', 'móvel', 'decoração', 'rack'] },
  { id: 'fbf5f829-516a-4b76-9b0c-2f0764ccff3c', name: 'Outros', keywords: [] },
  { id: '494d6e91-0241-4c0b-b01a-54493ed118ee', name: 'Veículos e Peças', keywords: ['moto', 'carro', 'veículo', 'peça', 'pneu', 'motor', 'caminhão'] },
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function isTerminei(text?: string): boolean {
  if (!text) return false;
  const normalized = text.trim().toLowerCase();
  return ['terminei', 'pronto', 'fim', 'done', 'finalizar'].includes(normalized);
}

function isOk(text?: string): boolean {
  if (!text) return false;
  const normalized = text.trim().toLowerCase();
  return ['ok', 'sim', 's', 'yes', 'y', 'confirmar', 'publicar'].includes(normalized);
}

function isCancelar(text?: string): boolean {
  if (!text) return false;
  const normalized = text.trim().toLowerCase();
  return ['cancelar', 'cancel', 'não', 'nao', 'n', 'no', 'descartar'].includes(normalized);
}

function isGreeting(text?: string): boolean {
  if (!text) return false;
  const normalized = text.trim().toLowerCase();
  return ['oi', 'olá', 'ola', 'oie', 'opa', 'ei', 'hey', 'hello', 'hi', '/start'].includes(normalized);
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

// =====================================================
// TELEGRAM API
// =====================================================

async function sendMessage(botToken: string, chatId: number, text: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      }
    );
    
    const result = await response.json();
    console.log('Telegram sendMessage result:', result.ok ? 'success' : result.description);
    return result.result?.message_id || null;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
}

// =====================================================
// AI INTEGRATION - BLOCO ÚNICO
// =====================================================

const BLOCK_MODE_PROMPT = `Você é um vendedor experiente criando anúncios para a loja XLata (materiais industriais e usados).

MENSAGENS DO VENDEDOR:
{MESSAGES}

NÚMERO DE FOTOS: {PHOTO_COUNT}

CATEGORIAS DISPONÍVEIS:
${CATEGORIES.map(c => `- ${c.name} (${c.id})`).join('\n')}

EXTRAIA E GERE um JSON válido (sem code blocks markdown) com TODOS os campos abaixo:

{
  "name": "Nome profissional do produto (max 80 chars)",
  "short_description": "Resumo curto e chamativo, persuasivo (max 150 chars). Ex: 'Fogão 4 bocas bem conservado, forno funcionando, aceita pix e cartão!'",
  "description": "Descrição COMPLETA, NATURAL e HUMANA do produto (100-300 palavras). SIGA ESTAS REGRAS OBRIGATÓRIAS:\n- Escreva como um vendedor real falaria no dia a dia\n- Use linguagem simples, direta e amigável\n- NÃO seja formal demais, seja como alguém conversando\n- Mencione TODOS os detalhes do produto enviados pelo vendedor\n- Seja honesto sobre defeitos (ex: 'Uma das bocas não tá funcionando, mas as outras três estão perfeitas')\n- Mencione pontos positivos de forma natural\n- Inclua formas de pagamento aceitas\n- Use frases curtas e objetivas\n- NÃO use linguagem corporativa ou de marketing exagerado\n- NÃO inclua dimensões técnicas aqui (vão em campo separado)\n\nEXEMPLO DE DESCRIÇÃO BOA:\n'Esse fogão de 4 bocas tá bem conservado, sem ferrugem e com o forno funcionando direitinho. Uma das bocas não tá pegando, mas as outras três funcionam perfeitamente. É usado mas tá bem cuidado, ideal pra quem quer economizar sem abrir mão de qualidade. Aceito pix, débito ou crédito - o que for melhor pra você. Aproveita que só tenho uma unidade!'",
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
  "interactive_duration_minutes": null,
  "interactive_increment": null,
  "interactive_repost_count": null,
  "interactive_repost_delay_days": null
}

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
6. CONDIÇÃO: "novo" = "novo", "no estado" = "no_estado", senão = "usado".
7. CATEGORIA: Mapeie baseado nas palavras-chave do texto.
8. FORMAS DE PAGAMENTO: Podem ir na descrição ("Aceita pix, cartão...").
9. Se não informar preço, use 0 e indique que precisa ser preenchido.
10. DESCRIÇÃO: Deve ser NATURAL e HUMANA, como um vendedor real falaria. NÃO use linguagem formal ou corporativa.
11. VENDA INTERATIVA: Se detectar tipo interativo, EXTRAIA TODOS os parâmetros mencionados (duração, incremento, reposts).
12. SUBCATEGORIA: Sugira quando o produto for específico. Use nomes consistentes para agrupar produtos similares.

Retorne APENAS JSON válido.`;

async function callAIBlockMode(messages: string[], photoCount: number): Promise<AIExtractedData> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!lovableApiKey) {
    throw new Error('LOVABLE_API_KEY não configurada');
  }

  const allMessages = messages.join('\n---\n');
  const prompt = BLOCK_MODE_PROMPT
    .replace('{MESSAGES}', allMessages)
    .replace('{PHOTO_COUNT}', photoCount.toString());

  console.log('Calling AI Block Mode with', messages.length, 'messages and', photoCount, 'photos');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { 
          role: 'system', 
          content: 'Você é um vendedor experiente criando anúncios de produtos usados. Escreva descrições NATURAIS e HUMANAS, como alguém falaria no dia a dia, sem formalidade excessiva. Extraia dados estruturados de mensagens livres. Retorne apenas JSON válido, sem code blocks markdown.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI Gateway error:', response.status, errorText);
    
    if (response.status === 429) {
      throw new Error('Limite de requisições da IA excedido. Tente novamente em alguns minutos.');
    }
    if (response.status === 402) {
      throw new Error('Créditos de IA insuficientes.');
    }
    throw new Error(`Erro na API de IA: ${response.status}`);
  }

  const aiResponse = await response.json();
  const content = aiResponse.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('Resposta vazia da IA');
  }

  // Parse AI response
  let cleanContent = content.trim();
  if (cleanContent.startsWith('```json')) cleanContent = cleanContent.slice(7);
  if (cleanContent.startsWith('```')) cleanContent = cleanContent.slice(3);
  if (cleanContent.endsWith('```')) cleanContent = cleanContent.slice(0, -3);
  cleanContent = cleanContent.trim();

  const parsed = JSON.parse(cleanContent);

  // Validate and normalize
  return {
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
    category_id: parsed.category_id || CATEGORIES[8].id,
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
  };
}

// =====================================================
// BUFFER HANDLERS
// =====================================================

async function getOrCreateBuffer(supabase: any, chatId: number): Promise<ProductBuffer | null> {
  const { data, error } = await supabase.rpc('get_telegram_buffer', { p_chat_id: chatId });
  
  if (error) {
    console.error('Error getting buffer:', error);
    return null;
  }
  
  if (data && data.length > 0) {
    return data[0] as ProductBuffer;
  }
  
  return null;
}

async function appendToBuffer(supabase: any, chatId: number, text?: string, photoFileId?: string): Promise<void> {
  const { error } = await supabase.rpc('append_to_telegram_buffer', {
    p_chat_id: chatId,
    p_message_text: text || null,
    p_photo_file_id: photoFileId || null
  });
  
  if (error) {
    console.error('Error appending to buffer:', error);
    throw error;
  }
}

async function updateBufferStatus(supabase: any, chatId: number, status: string, draftProductId?: string, aiMetadata?: AIExtractedData): Promise<void> {
  // Usar update direto ao invés de RPC para incluir ai_metadata
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };
  
  if (draftProductId) {
    updateData.draft_product_id = draftProductId;
  }
  
  if (aiMetadata) {
    updateData.ai_metadata = aiMetadata;
  }
  
  const { error } = await supabase
    .from('telegram_product_buffer')
    .update(updateData)
    .eq('chat_id', chatId);
  
  if (error) {
    console.error('Error updating buffer status:', error);
    throw error;
  }
}

async function clearBuffer(supabase: any, chatId: number): Promise<void> {
  const { error } = await supabase.rpc('clear_telegram_buffer', { p_chat_id: chatId });
  
  if (error) {
    console.error('Error clearing buffer:', error);
  }
}

// =====================================================
// PRODUCT PROCESSING
// =====================================================

async function processBuffer(
  supabase: any,
  config: BotConfig,
  chatId: number,
  buffer: ProductBuffer
): Promise<void> {
  const messages = buffer.messages || [];
  const photoFileIds = buffer.photo_file_ids || [];
  
  console.log(`Processing buffer: ${messages.length} messages, ${photoFileIds.length} photos`);
  
  // Validate minimum data
  if (messages.length === 0 && photoFileIds.length === 0) {
    await sendMessage(
      config.bot_token,
      chatId,
      `⚠️ Você não enviou nenhuma informação!\n\n📦 Envie fotos e descrições do produto, depois digite <b>Terminei</b>.`
    );
    return;
  }
  
  await sendMessage(
    config.bot_token,
    chatId,
    `⏳ Processando com IA...\n\nAnalisando ${messages.length} mensagem(s) e ${photoFileIds.length} foto(s).`
  );
  
  try {
    // 1. Upload photos to storage
    const productSlug = `produto-${Date.now()}`;
    const imageUrls: string[] = [];
    
    for (let i = 0; i < photoFileIds.length; i++) {
      try {
        const fileInfoRes = await fetch(
          `https://api.telegram.org/bot${config.bot_token}/getFile?file_id=${photoFileIds[i]}`
        );
        const fileInfo = await fileInfoRes.json();
        
        if (!fileInfo.result?.file_path) {
          console.log(`No file_path for photo ${i}`);
          continue;
        }
        
        const imageRes = await fetch(
          `https://api.telegram.org/file/bot${config.bot_token}/${fileInfo.result.file_path}`
        );
        const imageBlob = await imageRes.blob();
        
        const imagePath = `products/${productSlug}/${String(i + 1).padStart(3, '0')}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('shop-product-images')
          .upload(imagePath, imageBlob, { contentType: 'image/jpeg', upsert: true });
        
        if (uploadError) {
          console.error(`Upload error for image ${i}:`, uploadError);
          continue;
        }
        
        const { data: urlData } = supabase.storage
          .from('shop-product-images')
          .getPublicUrl(imagePath);
        
        imageUrls.push(urlData.publicUrl);
        console.log(`Uploaded image ${i + 1}: ${imagePath}`);
        
      } catch (imgError) {
        console.error(`Error processing image ${i}:`, imgError);
      }
    }
    
    // 2. Call AI to extract structured data
    const aiData = await callAIBlockMode(messages, imageUrls.length);
    
    // 2.5 Resolve subcategory - create if needed
    let finalCategoryId = aiData.category_id;
    if (aiData.subcategory_name && aiData.category_id) {
      try {
        const subcatSlug = generateSlug(aiData.subcategory_name);
        
        // Check if subcategory already exists under this parent
        const { data: existingSub } = await supabase
          .from('shop_categories')
          .select('id')
          .eq('parent_id', aiData.category_id)
          .eq('slug', subcatSlug)
          .maybeSingle();
        
        if (existingSub) {
          finalCategoryId = existingSub.id;
          console.log(`Using existing subcategory: ${existingSub.id}`);
        } else {
          // Get parent display_order to calculate child order
          const { data: siblings } = await supabase
            .from('shop_categories')
            .select('id')
            .eq('parent_id', aiData.category_id);
          
          const { data: newSub, error: subError } = await supabase
            .from('shop_categories')
            .insert({
              name: aiData.subcategory_name,
              slug: subcatSlug,
              parent_id: aiData.category_id,
              is_active: true,
              display_order: (siblings?.length || 0),
              icon: null
            })
            .select('id')
            .single();
          
          if (!subError && newSub) {
            finalCategoryId = newSub.id;
            console.log(`Created new subcategory: ${newSub.id} - ${aiData.subcategory_name}`);
          } else {
            console.error('Error creating subcategory:', subError);
          }
        }
      } catch (subErr) {
        console.error('Subcategory resolution error:', subErr);
      }
    }
    // 3. Validate required data
    if (aiData.price <= 0) {
      await sendMessage(
        config.bot_token,
        chatId,
        `⚠️ <b>Preço não detectado!</b>\n\nA IA não conseguiu identificar o preço de venda.\n\nEnvie uma mensagem com o preço (ex: "Vendo por R$ 850") e digite <b>Terminei</b> novamente.`
      );
      return;
    }
    
    // 4. Ensure unique slug
    let slug = aiData.slug;
    let counter = 0;
    while (true) {
      const { data: existing } = await supabase
        .from('shop_products')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      
      if (!existing) break;
      counter++;
      slug = `${aiData.slug}-${counter}`;
    }
    
    // 5. Create product as DRAFT
    const { data: product, error: productError } = await supabase
      .from('shop_products')
      .insert({
        name: aiData.name,
        slug,
        description: aiData.description,
        short_description: aiData.short_description,
        price: aiData.price,
        sale_price: aiData.sale_price,
        cost_price: aiData.cost_price,
        sale_type: aiData.sale_type,
        condition: aiData.condition,
        category_id: finalCategoryId,
        tags: aiData.tags,
        seo_title: aiData.seo_title,
        seo_description: aiData.seo_description,
        images: imageUrls,
        weight: aiData.weight,
        dimensions: aiData.dimensions,
        stock_quantity: aiData.stock_quantity,
        is_active: false,  // DRAFT
        is_visible: false, // DRAFT
      })
      .select()
      .single();
    
    if (productError) {
      console.error('Product creation error:', productError);
      throw new Error('Erro ao criar produto no banco de dados');
    }
    
    console.log(`Draft product created: ${product.id} - ${product.name}`);
    
    // 6. Update buffer with draft product ID
    await updateBufferStatus(supabase, chatId, 'awaiting_confirm', product.id, aiData);
    
    // 7. Send preview
    const dimensionsText = aiData.dimensions && (aiData.dimensions.width || aiData.dimensions.height || aiData.dimensions.depth)
      ? `📏 <b>Dimensões:</b> ${aiData.dimensions.width || '-'}x${aiData.dimensions.height || '-'}x${aiData.dimensions.depth || '-'} cm\n`
      : '';
    
    const weightText = aiData.weight ? `⚖️ <b>Peso:</b> ${aiData.weight} kg\n` : '';
    const costText = aiData.cost_price ? `💵 <b>Custo:</b> R$ ${aiData.cost_price.toFixed(2)}\n` : '';
    
    // Format short description for preview
    const shortDescText = aiData.short_description 
      ? `📄 <b>Resumo:</b> ${aiData.short_description}\n\n` 
      : '';
    
    // Format description for preview (first 200 chars)
    const descriptionPreview = aiData.description 
      ? `💬 <b>Descrição:</b>\n${aiData.description.substring(0, 200)}${aiData.description.length > 200 ? '...' : ''}\n\n`
      : '';
    
    const preview = `📦 <b>PREVIEW DO PRODUTO</b>\n\n` +
      `📝 <b>Nome:</b> ${aiData.name}\n` +
      `${shortDescText}` +
      `${descriptionPreview}` +
      `💰 <b>Preço:</b> R$ ${aiData.price.toFixed(2)}\n` +
      `${costText}` +
      `${dimensionsText}` +
      `${weightText}` +
      `📁 <b>Categoria:</b> ${aiData.category_name}\n` +
      `🏷️ <b>Condição:</b> ${aiData.condition}\n` +
      `📸 <b>Fotos:</b> ${imageUrls.length} imagens\n` +
      `🛒 <b>Tipo:</b> ${aiData.sale_type === 'interactive' ? 'Venda Interativa' : 'Venda Normal'}\n` +
      (aiData.sale_type === 'interactive' ? 
        `\n⚡ <b>CONFIGURAÇÃO DA VENDA INTERATIVA:</b>\n` +
        `⏱️ Duração: ${aiData.interactive_duration_minutes ? `${aiData.interactive_duration_minutes} minutos` : 'Padrão do sistema'}\n` +
        `📈 Lance mínimo: ${aiData.interactive_increment ? `R$ ${aiData.interactive_increment.toFixed(2)}` : 'Padrão do sistema'}\n` +
        `🔄 Reposts: ${aiData.interactive_repost_count ? `${aiData.interactive_repost_count}x (a cada ${aiData.interactive_repost_delay_days || 3} dias)` : 'Nenhum'}\n` 
        : '') +
      `\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `✅ Responda <b>OK</b> → Publicar na loja\n` +
      `❌ Responda <b>CANCELAR</b> → Descartar`;
    
    await sendMessage(config.bot_token, chatId, preview);
    
  } catch (error) {
    console.error('Error processing buffer:', error);
    await sendMessage(
      config.bot_token,
      chatId,
      `❌ Erro ao processar: ${error instanceof Error ? error.message : 'Erro desconhecido'}\n\nEnvie mais informações e digite <b>Terminei</b> novamente.`
    );
  }
}

async function publishProduct(
  supabase: any,
  config: BotConfig,
  chatId: number,
  buffer: ProductBuffer
): Promise<void> {
  if (!buffer.draft_product_id) {
    await sendMessage(config.bot_token, chatId, `⚠️ Nenhum produto para publicar.`);
    return;
  }
  
  // Activate product
  const { data: product, error } = await supabase
    .from('shop_products')
    .update({
      is_active: true,
      is_visible: true
    })
    .eq('id', buffer.draft_product_id)
    .select()
    .single();
  
  if (error) {
    console.error('Error publishing product:', error);
    await sendMessage(config.bot_token, chatId, `❌ Erro ao publicar produto.`);
    return;
  }

  // If product is interactive, create an interactive event
  if (product.sale_type === 'interactive') {
    try {
      // Get interactive config for defaults
      const { data: interactiveConfig } = await supabase
        .from('shop_interactive_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      // Usar parâmetros extraídos pela IA ou fallback para config padrão
      const aiMetadata = buffer.ai_metadata;
      const durationMinutes = aiMetadata?.interactive_duration_minutes || interactiveConfig?.default_duration_minutes || 60;
      const minimumIncrement = aiMetadata?.interactive_increment || interactiveConfig?.default_increment || 5;
      const autoRepostCount = aiMetadata?.interactive_repost_count || 0;
      const autoRepostDelayDays = aiMetadata?.interactive_repost_delay_days || 3;

      const now = new Date();
      const endAt = new Date(now.getTime() + durationMinutes * 60000);

      const { error: eventError } = await supabase
        .from('shop_interactive_events')
        .insert({
          product_id: product.id,
          initial_value: product.price,
          current_value: product.price,
          minimum_increment: minimumIncrement,
          start_at: now.toISOString(),
          end_at: endAt.toISOString(),
          status: 'active',
          auto_repost_count: autoRepostCount,
          auto_repost_delay_days: autoRepostDelayDays,
          current_repost_number: 0
        });

      if (eventError) {
        console.error('Error creating interactive event:', eventError);
        // Product is published but event failed - notify user
        await sendMessage(
          config.bot_token,
          chatId,
          `⚠️ Produto publicado, mas erro ao criar evento interativo.\n\nCrie o evento manualmente no CMS.`
        );
      } else {
        console.log(`Interactive event created for product ${product.id} with duration=${durationMinutes}min, increment=${minimumIncrement}, reposts=${autoRepostCount}`);
      }
    } catch (e) {
      console.error('Error in interactive event creation:', e);
    }
  }
  
  // Fire-and-forget Pinterest autopost
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (supabaseUrl && supabaseServiceKey) {
      const pinterestRes = await fetch(`${supabaseUrl}/functions/v1/pinterest-publish-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ product_id: product.id })
      });
      const pinterestData = await pinterestRes.json();
      if (pinterestData?.success) {
        console.log(`[Pinterest] Pin published for product ${product.id}: ${pinterestData.pin_id}`);
      } else if (pinterestData?.skipped) {
        console.log(`[Pinterest] Skipped: ${pinterestData.reason}`);
      } else {
        console.warn(`[Pinterest] Failed:`, JSON.stringify(pinterestData));
      }
    }
  } catch (pinErr) {
    console.warn('[Pinterest] Autopost error (non-blocking):', pinErr);
  }

  // Clear buffer
  await clearBuffer(supabase, chatId);
  
  // Success message - different for interactive vs normal
  if (product.sale_type === 'interactive') {
    const aiMetadata = buffer.ai_metadata;
    const durationMinutes = aiMetadata?.interactive_duration_minutes || 60;
    const minimumIncrement = aiMetadata?.interactive_increment || 5;
    const autoRepostCount = aiMetadata?.interactive_repost_count || 0;
    const autoRepostDelayDays = aiMetadata?.interactive_repost_delay_days || 3;
    
    const repostText = autoRepostCount > 0 
      ? `🔄 Reposts: ${autoRepostCount}x (a cada ${autoRepostDelayDays} dias)\n` 
      : '';
    
    await sendMessage(
      config.bot_token,
      chatId,
      `✅ <b>Produto publicado em VENDA INTERATIVA!</b>\n\n` +
      `📦 <b>${product.name}</b>\n` +
      `💰 Valor inicial: R$ ${product.price.toFixed(2)}\n` +
      `⏱️ Duração: ${durationMinutes} minutos\n` +
      `📈 Lance mínimo: R$ ${minimumIncrement.toFixed(2)}\n` +
      `${repostText}` +
      `⚡ Evento ativo agora!\n\n` +
      `🔗 Ver: https://xlata.site/shop/${product.slug}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📦 Envie mais produtos quando quiser!`
    );
  } else {
    await sendMessage(
      config.bot_token,
      chatId,
      `✅ <b>Produto publicado com sucesso!</b>\n\n` +
      `📦 <b>${product.name}</b>\n` +
      `💰 R$ ${product.price.toFixed(2)}\n\n` +
      `🔗 Ver: https://xlata.site/shop/${product.slug}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📦 Envie mais produtos quando quiser!`
    );
  }
}

async function cancelProduct(
  supabase: any,
  config: BotConfig,
  chatId: number,
  buffer: ProductBuffer
): Promise<void> {
  // Delete draft product and images if exists
  if (buffer.draft_product_id) {
    // Get product to delete images
    const { data: product } = await supabase
      .from('shop_products')
      .select('images, slug')
      .eq('id', buffer.draft_product_id)
      .single();
    
    // Delete images from storage
    if (product?.images && Array.isArray(product.images)) {
      for (const imageUrl of product.images) {
        try {
          const path = imageUrl.split('/shop-product-images/')[1];
          if (path) {
            await supabase.storage.from('shop-product-images').remove([path]);
          }
        } catch (e) {
          console.error('Error deleting image:', e);
        }
      }
    }
    
    // Delete product
    await supabase
      .from('shop_products')
      .delete()
      .eq('id', buffer.draft_product_id);
  }
  
  // Clear buffer
  await clearBuffer(supabase, chatId);
  
  await sendMessage(
    config.bot_token,
    chatId,
    `❌ <b>Produto descartado.</b>\n\n📦 Envie novos dados quando quiser cadastrar outro.`
  );
}

// =====================================================
// MAIN HANDLER
// =====================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();
    const msg = update.message;
    
    if (!msg) {
      console.log('No message in update');
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Message from chat ${msg.chat.id}: "${msg.text?.substring(0, 50) || '[photo]'}"`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get bot config
    const { data: config, error: configError } = await supabase
      .from('telegram_bot_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (configError || !config) {
      console.error('Bot config error:', configError);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!config.is_active) {
      console.log('Bot is not active');
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if chat is allowed
    const allowedChats = config.allowed_chat_ids || [];
    if (allowedChats.length > 0 && !allowedChats.includes(msg.chat.id)) {
      console.log(`Chat ${msg.chat.id} not in allowed list`);
      await sendMessage(
        config.bot_token,
        msg.chat.id,
        `⚠️ Este chat não está autorizado.\n\nSeu Chat ID: <code>${msg.chat.id}</code>\n\nPeça ao administrador para adicionar.`
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get current buffer
    const buffer = await getOrCreateBuffer(supabase, msg.chat.id);
    const text = msg.text?.trim() || msg.caption?.trim();
    
    // =====================================================
    // BLOCK MODE LOGIC
    // =====================================================
    
    // Case 1: Awaiting confirmation - handle OK/CANCELAR
    if (buffer?.status === 'awaiting_confirm') {
      if (isOk(text)) {
        await publishProduct(supabase, config, msg.chat.id, buffer);
      } else if (isCancelar(text)) {
        await cancelProduct(supabase, config, msg.chat.id, buffer);
      } else {
        await sendMessage(
          config.bot_token,
          msg.chat.id,
          `❓ Responda <b>OK</b> para publicar ou <b>CANCELAR</b> para descartar.`
        );
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Case 2: "Terminei" - process the buffer
    if (isTerminei(text)) {
      if (!buffer || (buffer.messages.length === 0 && buffer.photo_file_ids.length === 0)) {
        await sendMessage(
          config.bot_token,
          msg.chat.id,
          `⚠️ Você ainda não enviou nenhuma informação!\n\n📦 Envie fotos, descrição, preço e outras informações do produto.\n\nQuando terminar, digite: <b>Terminei</b>`
        );
      } else {
        await processBuffer(supabase, config, msg.chat.id, buffer);
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Case 3: Greeting - show welcome message
    if (isGreeting(text) && (!buffer || buffer.messages.length === 0)) {
      // Clear any existing buffer
      if (buffer) {
        await clearBuffer(supabase, msg.chat.id);
      }
      
      await sendMessage(
        config.bot_token,
        msg.chat.id,
        `👋 Olá! Sou o bot de cadastro rápido do <b>XLata</b>.\n\n` +
        `📦 Envie tudo sobre o produto:\n` +
        `• Fotos\n` +
        `• Nome e descrição\n` +
        `• Preços (custo e venda)\n` +
        `• Dimensões e peso\n` +
        `• Qualquer informação relevante\n\n` +
        `Quando terminar, digite: <b>Terminei</b>`
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Case 4: Photo received - add to buffer silently
    if (msg.photo && msg.photo.length > 0) {
      const photo = msg.photo[msg.photo.length - 1]; // Best quality
      
      try {
        await appendToBuffer(supabase, msg.chat.id, msg.caption || null, photo.file_id);
        console.log(`Photo added to buffer for chat ${msg.chat.id}`);
        
        // Check photo limit
        const updatedBuffer = await getOrCreateBuffer(supabase, msg.chat.id);
        if (updatedBuffer && updatedBuffer.photo_file_ids.length >= 10) {
          await sendMessage(
            config.bot_token,
            msg.chat.id,
            `📸 Limite de 10 fotos atingido!\n\nDigite <b>Terminei</b> quando estiver pronto.`
          );
        }
      } catch (e) {
        console.error('Error adding photo to buffer:', e);
      }
      
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Case 5: Text received - add to buffer silently
    if (text) {
      try {
        await appendToBuffer(supabase, msg.chat.id, text, null);
        console.log(`Text added to buffer for chat ${msg.chat.id}: "${text.substring(0, 30)}..."`);
        
        // Check message limit
        const updatedBuffer = await getOrCreateBuffer(supabase, msg.chat.id);
        if (updatedBuffer && updatedBuffer.messages.length >= 50) {
          await sendMessage(
            config.bot_token,
            msg.chat.id,
            `📝 Limite de 50 mensagens atingido!\n\nDigite <b>Terminei</b> quando estiver pronto.`
          );
        }
      } catch (e) {
        console.error('Error adding text to buffer:', e);
      }
      
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
