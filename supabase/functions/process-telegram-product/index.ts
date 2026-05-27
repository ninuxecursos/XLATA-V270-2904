import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI Prompt for product generation
const PRODUCT_PROMPT = `Você é um especialista em e-commerce criando descrições para a loja XLata (materiais industriais e usados).
 
DADOS DO PRODUTO:
Nome: {NAME}
Descrição do vendedor: {DESCRIPTION}
Preço de venda: R$ {PRICE}
Custo: R$ {COST}
Tipo de venda: {SALE_TYPE}
Fotos: {PHOTO_COUNT} imagens
 
Gere um JSON válido (sem code blocks markdown):
{
  "name": "Título profissional SEO-friendly (máx 80 chars)",
  "short_description": "Resumo persuasivo (máx 150 chars)",
  "description": "Descrição formatada em Markdown seguindo a ESTRUTURA OBRIGATÓRIA abaixo",
  "tags": ["tag1", "tag2", "tag3"],
  "seo_title": "Título SEO (até 60 chars)",
  "seo_description": "Meta description (até 155 chars)",
  "slug": "url-amigavel-do-produto"
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
 [Mencionar formas aceitas: Pix, cartão, etc - em uma frase]
 
 [Se estoque baixo: ⚠️ Última unidade disponível!]
 
 REGRAS DE FORMATAÇÃO:
 - Use os emojis EXATAMENTE como mostrado (📦⚙️✨💳⚠️)
 - Use **negrito** para títulos de seção
 - Use • (bullet point) para listas
 - Quebre linhas entre seções
 - Seja honesto e natural, como vendedor real
 - NÃO use linguagem corporativa
 - Mantenha tom amigável e direto
 
REGRAS:
- Mantenha o preço original (apenas formate)
- Gere descrição seguindo a ESTRUTURA OBRIGATÓRIA acima
- Gere tags relevantes para SEO
- Slug deve ser URL-friendly, sem acentos
 
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

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { name, description, sale_price, cost_price, photo_count, sale_type, model } = await req.json();

    console.log('Processing product:', { name, sale_type, photo_count });

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      console.warn('LOVABLE_API_KEY not configured, using basic data');
      return new Response(
        JSON.stringify({
          name: name?.substring(0, 80) || 'Produto',
          short_description: description?.substring(0, 150) || '',
          description: description || '',
          tags: [],
          seo_title: name?.substring(0, 60) || '',
          seo_description: description?.substring(0, 155) || '',
          slug: generateSlug(name || 'produto'),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = PRODUCT_PROMPT
      .replace('{NAME}', name || 'Produto sem nome')
      .replace('{DESCRIPTION}', description || 'Sem descrição')
      .replace('{PRICE}', (sale_price || 0).toFixed(2))
      .replace('{COST}', (cost_price || 0).toFixed(2))
      .replace('{SALE_TYPE}', sale_type || 'normal')
      .replace('{PHOTO_COUNT}', (photo_count || 0).toString());

    console.log('Calling AI Gateway...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'google/gemini-3-flash-preview',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em e-commerce. Retorne apenas JSON válido, sem code blocks markdown.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      // Return basic data on AI error
      return new Response(
        JSON.stringify({
          name: name?.substring(0, 80) || 'Produto',
          short_description: description?.substring(0, 150) || '',
          description: description || '',
          tags: [],
          seo_title: name?.substring(0, 60) || '',
          seo_description: description?.substring(0, 155) || '',
          slug: generateSlug(name || 'produto'),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty AI response');
    }

    // Parse AI response
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) cleanContent = cleanContent.slice(7);
    if (cleanContent.startsWith('```')) cleanContent = cleanContent.slice(3);
    if (cleanContent.endsWith('```')) cleanContent = cleanContent.slice(0, -3);
    cleanContent = cleanContent.trim();

    const parsed = JSON.parse(cleanContent);

    console.log('AI processing complete');

    return new Response(
      JSON.stringify({
        name: parsed.name?.substring(0, 80) || name || 'Produto',
        short_description: parsed.short_description?.substring(0, 150) || '',
        description: parsed.description || description || '',
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 10) : [],
        seo_title: parsed.seo_title?.substring(0, 60) || '',
        seo_description: parsed.seo_description?.substring(0, 155) || '',
        slug: parsed.slug || generateSlug(name || 'produto'),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing product:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
