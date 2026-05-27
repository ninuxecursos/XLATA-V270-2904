import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { parseGeminiJson } from '../_shared/gemini-json.ts';

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

    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    // Allow service-role calls (cron) to bypass user auth
    const isServiceRole = token && token === supabaseKey;
    if (!isServiceRole) {
      if (!authHeader) throw new Error('No authorization header');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) throw new Error('Unauthorized');
    }

    const body = await req.json();
    const { action, opportunity_id, opportunity_ids } = body;

    if (action === 'discover') {
      return await discoverKeywords(supabase);
    } else if (action === 'add_to_bank') {
      return await addToBank(supabase, opportunity_id);
    } else if (action === 'get_dashboard') {
      return await getDashboard(supabase);
    } else if (action === 'bulk_add') {
      return await bulkAdd(supabase, opportunity_ids);
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

async function discoverKeywords(supabase: any) {
  // 1. Get existing articles and topics
  const [articlesRes, topicsRes, existingRes] = await Promise.all([
    supabase.from('blog_posts').select('id, title, slug, tags').eq('status', 'published'),
    supabase.from('seo_topic_bank').select('id, topic, keywords'),
    supabase.from('keyword_opportunities').select('keyword'),
  ]);

  const existingKeywords = new Set(
    (existingRes.data || []).map((k: any) => k.keyword.toLowerCase())
  );
  const existingTopics = new Set(
    (topicsRes.data || []).map((t: any) => t.topic.toLowerCase())
  );
  const articleTitles = (articlesRes.data || []).map((a: any) => a.title);

  // 2. Get Gemini API key
  const { data: configData } = await supabase
    .from('ai_automation_config')
    .select('gemini_api_key, ai_model')
    .single();

  const geminiApiKey = configData?.gemini_api_key;
  if (!geminiApiKey) {
    return new Response(JSON.stringify({ success: false, error: 'API Key do Gemini não configurada' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const model = (configData?.ai_model || 'gemini-2.5-flash').replace('google/', '');

  // 3. Use Gemini to discover keyword opportunities
  const prompt = `Você é um especialista em SEO para o nicho de ferro velho, sucata e reciclagem no Brasil.

ARTIGOS EXISTENTES:
${articleTitles.slice(0, 30).join('\n')}

TEMAS JÁ NO BANCO:
${Array.from(existingTopics).slice(0, 30).join('\n')}

KEYWORDS JÁ DESCOBERTAS:
${Array.from(existingKeywords).slice(0, 30).join('\n')}

Gere 20 NOVAS oportunidades de palavras-chave que AINDA NÃO EXISTEM no sistema.

FOCO:
- Keywords com intenção de compra (preço, valor, quanto custa)
- Keywords de problema/dor (perder dinheiro, desorganização, erro)
- Keywords locais (cidade + ferro velho/sucata)
- Keywords long tail específicas
- Keywords de comparação (manual vs automatizado)

Para cada keyword, forneça:
- keyword: a palavra-chave exata
- variations: array de 3-5 variações
- category: comercial | informacional | local | problema_dor
- intent: compra | informacional | navegacional | transacional
- traffic_potential: 1-100 (estimativa)
- competition_level: 1-100 (estimativa)
- purchase_intent: 1-100 (estimativa)
- suggested_title: título de artigo otimizado para SEO
- suggested_slug: slug do artigo

Responda APENAS em JSON válido: { "opportunities": [...] }`;

  const resolvedModel = model.replace('google/', '');
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${geminiApiKey}`;

  // Call Gemini with timeout + retries on transient errors (429/5xx)
  let responseText = '';
  let lastStatus = 0;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    let geminiResponse: Response;
    try {
      geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });
    } catch (e: any) {
      clearTimeout(timeoutId);
      console.error(`discover-keywords attempt ${attempt}/2 -`, e?.name === 'AbortError' ? 'timeout' : e?.message);
      if (attempt < 2) { await new Promise(r => setTimeout(r, 2000)); continue; }
      break;
    }
    clearTimeout(timeoutId);

    if (geminiResponse.ok) {
      const geminiData = await geminiResponse.json();
      responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      break;
    }

    lastStatus = geminiResponse.status;
    const errText = await geminiResponse.text();
    console.error(`discover-keywords attempt ${attempt}/2 - status ${lastStatus}`, errText.substring(0, 200));
    if ([429, 500, 502, 503, 504].includes(lastStatus) && attempt < 2) {
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }
    break;
  }

  if (!responseText) {
    const isQuota = lastStatus === 429;
    const isOverloaded = [500, 502, 503, 504].includes(lastStatus);
    return new Response(JSON.stringify({
      success: false,
      fallback: true,
      error_code: isQuota ? 'GEMINI_QUOTA_EXCEEDED' : (isOverloaded ? 'GEMINI_OVERLOADED' : (lastStatus ? `GEMINI_${lastStatus}` : 'GEMINI_TIMEOUT')),
      error: isQuota
        ? 'Cota diária do Gemini esgotada. Aguarde ou ajuste a automação.'
        : isOverloaded
          ? 'Gemini sobrecarregado. Tente novamente em alguns minutos.'
          : 'Falha temporária ao chamar o Gemini. Tente novamente.',
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  let parsed: any;
  try {
    parsed = parseGeminiJson(responseText);
  } catch (e: any) {
    console.error('JSON parse error in keyword discovery:', e?.message, responseText.substring(0, 300));
    return new Response(JSON.stringify({
      success: false,
      fallback: true,
      error_code: 'GEMINI_PARSE_ERROR',
      error: 'A IA retornou conteúdo malformado. Tente novamente.',
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const opportunities = parsed.opportunities || [];

  // 4. Check for gaps and duplicates, then insert
  let inserted = 0;
  for (const opp of opportunities) {
    const keyword = (opp.keyword || '').toLowerCase().trim();
    if (!keyword || existingKeywords.has(keyword) || existingTopics.has(keyword)) continue;

    // Check if article already exists
    const { data: existingArticle } = await supabase
      .from('blog_posts')
      .select('id')
      .ilike('title', `%${keyword}%`)
      .limit(1);

    const hasArticle = existingArticle && existingArticle.length > 0;

    // Calculate opportunity score
    const trafficPot = Math.min(100, Math.max(0, opp.traffic_potential || 50));
    const competition = Math.min(100, Math.max(0, opp.competition_level || 50));
    const purchaseInt = Math.min(100, Math.max(0, opp.purchase_intent || 50));
    const score = Math.round(
      (trafficPot * 0.3) + ((100 - competition) * 0.3) + (purchaseInt * 0.4)
    );

    const { error: insertError } = await supabase.from('keyword_opportunities').insert({
      keyword,
      variations: opp.variations || [],
      category: opp.category || 'informacional',
      intent: opp.intent || 'informacional',
      opportunity_score: score,
      traffic_potential: trafficPot,
      competition_level: competition,
      purchase_intent: purchaseInt,
      suggested_title: opp.suggested_title || '',
      suggested_slug: opp.suggested_slug || '',
      has_existing_article: hasArticle,
      existing_article_id: hasArticle ? existingArticle[0].id : null,
      source: 'ai_discovery',
      status: 'new',
    });

    if (!insertError) {
      inserted++;
      existingKeywords.add(keyword);
    }
  }

  return new Response(JSON.stringify({
    success: true,
    discovered: inserted,
    total_analyzed: opportunities.length,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function addToBank(supabase: any, opportunityId: string) {
  const { data: opp, error } = await supabase
    .from('keyword_opportunities')
    .select('*')
    .eq('id', opportunityId)
    .single();

  if (error || !opp) throw new Error('Oportunidade não encontrada');

  // Map category
  const categoryMap: Record<string, string> = {
    comercial: 'comercial',
    informacional: 'educacional',
    local: 'comercial',
    problema_dor: 'comercial',
  };

  const priority = opp.opportunity_score >= 70 ? 10 : opp.opportunity_score >= 50 ? 7 : 5;

  const { data: topic, error: topicError } = await supabase.from('seo_topic_bank').insert({
    topic: opp.suggested_title || opp.keyword,
    keywords: [opp.keyword, ...(opp.variations || [])],
    category: categoryMap[opp.category] || 'educacional',
    priority,
  }).select('id').single();

  if (topicError) throw topicError;

  await supabase.from('keyword_opportunities').update({
    status: 'added_to_bank',
    is_added_to_bank: true,
    added_to_bank_at: new Date().toISOString(),
    topic_bank_id: topic.id,
    updated_at: new Date().toISOString(),
  }).eq('id', opportunityId);

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function bulkAdd(supabase: any, opportunityIds: string[]) {
  let added = 0;
  for (const id of opportunityIds) {
    try {
      const res = await addToBank(supabase, id);
      if (res.ok) added++;
    } catch { /* skip failures */ }
  }
  return new Response(JSON.stringify({ success: true, added }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getDashboard(supabase: any) {
  const { data: opportunities } = await supabase
    .from('keyword_opportunities')
    .select('*')
    .order('opportunity_score', { ascending: false });

  const all = opportunities || [];
  const stats = {
    total: all.length,
    new_count: all.filter((o: any) => o.status === 'new').length,
    approved: all.filter((o: any) => o.status === 'approved').length,
    added_to_bank: all.filter((o: any) => o.status === 'added_to_bank').length,
    avg_score: all.length > 0 ? Math.round(all.reduce((s: number, o: any) => s + (o.opportunity_score || 0), 0) / all.length) : 0,
    high_potential: all.filter((o: any) => o.opportunity_score >= 70).length,
    content_gaps: all.filter((o: any) => !o.has_existing_article && o.opportunity_score >= 50).length,
    by_category: {
      comercial: all.filter((o: any) => o.category === 'comercial').length,
      informacional: all.filter((o: any) => o.category === 'informacional').length,
      local: all.filter((o: any) => o.category === 'local').length,
      problema_dor: all.filter((o: any) => o.category === 'problema_dor').length,
    },
  };

  return new Response(JSON.stringify({ success: true, stats, opportunities: all }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
