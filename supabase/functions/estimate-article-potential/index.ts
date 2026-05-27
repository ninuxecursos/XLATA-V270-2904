import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const { action, article_id } = await req.json();

    if (action === 'analyze_single') {
      return await analyzeSingle(supabase, article_id);
    } else if (action === 'analyze_all') {
      return await analyzeAll(supabase);
    } else if (action === 'get_dashboard') {
      return await getDashboard(supabase);
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getGeminiConfig(supabase: any) {
  const { data } = await supabase
    .from('ai_automation_config')
    .select('gemini_api_key, ai_model')
    .single();

  if (!data?.gemini_api_key) throw new Error('API Key do Gemini não configurada');
  const model = (data.ai_model || 'gemini-2.5-flash').replace('google/', '');
  return { apiKey: data.gemini_api_key, model };
}

async function callGemini(apiKey: string, model: string, prompt: string) {
  const resolved = model.replace('google/', '');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${resolved}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini error: ${err}`);
  }

  const data = await response.json();
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(text);
}

async function analyzeSingle(supabase: any, articleId: string) {
  const { apiKey, model } = await getGeminiConfig(supabase);

  // Get article data
  const { data: article, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, content_html, tags, category_id, seo_title, seo_description')
    .eq('id', articleId)
    .single();

  if (error || !article) throw new Error('Artigo não encontrado');

  // Get keywords if available
  const { data: keywords } = await supabase
    .from('article_keywords')
    .select('keyword, is_primary')
    .eq('article_id', articleId);

  const primaryKeyword = keywords?.find((k: any) => k.is_primary)?.keyword || '';

  // Get ranking if available
  const { data: ranking } = await supabase
    .from('ranking_tracking')
    .select('position, keyword')
    .eq('article_id', articleId)
    .order('checked_at', { ascending: false })
    .limit(1);

  const currentPosition = ranking?.[0]?.position || null;

  // Strip HTML for analysis (truncate to avoid token limits)
  const contentText = (article.content_html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 3000);

  const prompt = `Você é um especialista em SEO e marketing digital para o nicho de ferro velho, sucata e reciclagem no Brasil.

Analise este artigo do blog do XLata (sistema para gestão de ferro velho) e estime seu potencial de tráfego e conversão.

DADOS DO ARTIGO:
- Título: ${article.title}
- SEO Title: ${article.seo_title || article.title}
- Keyword principal: ${primaryKeyword || 'não definida'}
- Posição atual no Google: ${currentPosition || 'desconhecida'}
- Conteúdo (resumo): ${contentText.substring(0, 2000)}

CONTEXTO DO XLata:
- Sistema SaaS para gestão de ferro velhos e depósitos de reciclagem
- Preço médio de assinatura: R$ 49,90/mês
- Público: donos de ferro velho, depósitos de reciclagem, sucateiros
- O site é xlata.site

Forneça a análise em JSON com EXATAMENTE estes campos:
{
  "keyword_primary": "palavra-chave principal identificada",
  "keyword_type": "comercial" | "informacional" | "local" | "problema_dor",
  "search_volume": "baixo" | "medio" | "alto",
  "ranking_difficulty": "facil" | "medio" | "dificil",
  "estimated_monthly_visits": número (ex: 500),
  "purchase_intent": "baixa" | "media" | "alta",
  "estimated_conversion_rate": número decimal (ex: 2.5),
  "estimated_monthly_clients": número (ex: 10),
  "estimated_monthly_value": número decimal em R$ (ex: 499.00),
  "value_score": número 0-100,
  "classification": "alto" | "medio" | "baixo",
  "visitor_profile": "curioso" | "pesquisador" | "comprador",
  "ai_analysis_summary": "resumo de 2-3 frases sobre o potencial do artigo"
}`;

  const result = await callGemini(apiKey, model, prompt);

  // Upsert estimate
  const estimate = {
    article_id: articleId,
    keyword_primary: result.keyword_primary || primaryKeyword,
    keyword_type: result.keyword_type || 'informacional',
    search_volume: result.search_volume || 'medio',
    ranking_difficulty: result.ranking_difficulty || 'medio',
    current_position: currentPosition,
    estimated_monthly_visits: Math.max(0, result.estimated_monthly_visits || 0),
    purchase_intent: result.purchase_intent || 'media',
    estimated_conversion_rate: Math.max(0, Math.min(100, result.estimated_conversion_rate || 0)),
    estimated_monthly_clients: Math.max(0, result.estimated_monthly_clients || 0),
    estimated_monthly_value: Math.max(0, result.estimated_monthly_value || 0),
    value_score: Math.max(0, Math.min(100, result.value_score || 0)),
    classification: result.classification || 'medio',
    visitor_profile: result.visitor_profile || 'curioso',
    ai_analysis_summary: result.ai_analysis_summary || '',
    analyzed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabase
    .from('article_traffic_estimates')
    .upsert(estimate, { onConflict: 'article_id' });

  if (upsertError) throw upsertError;

  return new Response(JSON.stringify({ success: true, estimate }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function analyzeAll(supabase: any) {
  const { data: articles } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(30);

  if (!articles || articles.length === 0) {
    return new Response(JSON.stringify({ success: true, analyzed: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let analyzed = 0;
  let errors = 0;

  for (const article of articles) {
    try {
      await analyzeSingle(supabase, article.id);
      analyzed++;
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      console.error(`Error analyzing article ${article.id}:`, err);
      errors++;
    }
  }

  return new Response(JSON.stringify({ success: true, analyzed, errors, total: articles.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getDashboard(supabase: any) {
  const { data: estimates } = await supabase
    .from('article_traffic_estimates')
    .select(`
      *,
      blog_posts:article_id (id, title, slug, status, published_at, view_count)
    `)
    .order('value_score', { ascending: false });

  const all = estimates || [];

  const stats = {
    total_articles_analyzed: all.length,
    total_estimated_visits: all.reduce((s: number, e: any) => s + (e.estimated_monthly_visits || 0), 0),
    total_estimated_clients: all.reduce((s: number, e: any) => s + (e.estimated_monthly_clients || 0), 0),
    total_estimated_value: all.reduce((s: number, e: any) => s + (e.estimated_monthly_value || 0), 0),
    avg_value_score: all.length > 0
      ? Math.round(all.reduce((s: number, e: any) => s + (e.value_score || 0), 0) / all.length)
      : 0,
    high_potential: all.filter((e: any) => e.classification === 'alto').length,
    medium_potential: all.filter((e: any) => e.classification === 'medio').length,
    low_potential: all.filter((e: any) => e.classification === 'baixo').length,
    avg_conversion_rate: all.length > 0
      ? (all.reduce((s: number, e: any) => s + (e.estimated_conversion_rate || 0), 0) / all.length).toFixed(2)
      : '0',
  };

  return new Response(JSON.stringify({ success: true, stats, estimates: all }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
