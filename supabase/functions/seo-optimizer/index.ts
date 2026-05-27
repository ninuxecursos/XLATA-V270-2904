import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseGeminiJson } from "../_shared/gemini-json.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action } = body;

    // ACTION: analyze_all - Score all published articles
    if (action === 'analyze_all') {
      const { data: articles } = await supabase
        .from('blog_posts')
        .select('id, title, slug, content_html, content_md, seo_title, seo_description, updated_at, published_at, view_count, tags')
        .eq('status', 'published');

      const results = [];

      for (const article of articles || []) {
        const content = article.content_html || article.content_md || '';
        const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
        const updatedAt = new Date(article.updated_at);
        const daysSinceUpdate = Math.floor((Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

        // Check CTAs
        const ctaPatterns = ['/cadastro', '/planos', 'teste grátis', 'crie sua conta', 'xlata'];
        const hasCtas = ctaPatterns.some(p => content.toLowerCase().includes(p));
        const ctaCount = ctaPatterns.reduce((count, p) => count + (content.toLowerCase().split(p).length - 1), 0);

        // Check internal links
        const internalLinkMatches = content.match(/href="\/[^"]*"/g) || [];
        const internalLinksCount = internalLinkMatches.length;

        // Check H2/H3 structure
        const h2Count = (content.match(/<h2/g) || []).length;
        const h3Count = (content.match(/<h3/g) || []).length;

        // Get ranking data
        const { data: rankings } = await supabase
          .from('ranking_tracking')
          .select('keyword, position, previous_position, position_change, checked_at')
          .eq('article_id', article.id)
          .order('checked_at', { ascending: false })
          .limit(20);

        // Get best keyword position
        const latestByKw = new Map<string, any>();
        (rankings || []).forEach(r => {
          if (!latestByKw.has(r.keyword)) latestByKw.set(r.keyword, r);
        });

        let bestPosition: number | null = null;
        let bestKeyword = '';
        let positionTrend = 'stable';

        for (const [kw, r] of latestByKw) {
          if (r.position && (!bestPosition || r.position < bestPosition)) {
            bestPosition = r.position;
            bestKeyword = kw;
            if (r.position_change && r.position_change > 0) positionTrend = 'rising';
            else if (r.position_change && r.position_change < 0) positionTrend = 'falling';
          }
        }

        // Calculate scores (0-100)
        // Ranking score: higher for positions 5-20 (strike zone)
        let rankingScore = 0;
        if (bestPosition) {
          if (bestPosition >= 5 && bestPosition <= 10) rankingScore = 90;
          else if (bestPosition >= 11 && bestPosition <= 20) rankingScore = 70;
          else if (bestPosition >= 1 && bestPosition <= 4) rankingScore = 30; // already good
          else if (bestPosition >= 21 && bestPosition <= 50) rankingScore = 50;
          else rankingScore = 20;
        }

        // Freshness score: higher if old content
        let freshnessScore = 0;
        if (daysSinceUpdate > 90) freshnessScore = 90;
        else if (daysSinceUpdate > 60) freshnessScore = 70;
        else if (daysSinceUpdate > 30) freshnessScore = 50;
        else if (daysSinceUpdate > 14) freshnessScore = 30;
        else freshnessScore = 10;

        // Content score: penalties for thin content
        let contentScore = 0;
        if (wordCount < 500) contentScore = 90;
        else if (wordCount < 1000) contentScore = 70;
        else if (wordCount < 1500) contentScore = 50;
        else if (wordCount < 2000) contentScore = 30;
        else contentScore = 10;

        // CTA score
        let ctaScore = 0;
        if (ctaCount === 0) ctaScore = 90;
        else if (ctaCount < 2) ctaScore = 60;
        else if (ctaCount < 4) ctaScore = 30;
        else ctaScore = 10;

        // Interlinking score
        let interlinkingScore = 0;
        if (internalLinksCount === 0) interlinkingScore = 90;
        else if (internalLinksCount < 3) interlinkingScore = 60;
        else if (internalLinksCount < 5) interlinkingScore = 30;
        else interlinkingScore = 10;

        // Overall opportunity score (weighted)
        const opportunityScore = Math.round(
          rankingScore * 0.35 +
          freshnessScore * 0.20 +
          contentScore * 0.20 +
          ctaScore * 0.10 +
          interlinkingScore * 0.15
        );

        // Generate suggestions
        const suggestions: string[] = [];
        if (wordCount < 1500) suggestions.push('📝 Expandir conteúdo (mínimo 1500 palavras)');
        if (!hasCtas) suggestions.push('🎯 Adicionar CTAs para conversão');
        else if (ctaCount < 4) suggestions.push('🎯 Adicionar mais CTAs (mínimo 4)');
        if (internalLinksCount < 3) suggestions.push('🔗 Adicionar mais links internos');
        if (h2Count < 3) suggestions.push('📋 Adicionar mais subtítulos H2');
        if (daysSinceUpdate > 30) suggestions.push('🔄 Atualizar informações e dados');
        if (!article.seo_title || article.seo_title.length < 30) suggestions.push('🏷️ Melhorar título SEO');
        if (!article.seo_description || article.seo_description.length < 100) suggestions.push('📄 Melhorar meta description');
        if (positionTrend === 'falling') suggestions.push('⚠️ Ranking caindo - ação urgente');
        if (bestPosition && bestPosition >= 5 && bestPosition <= 15) suggestions.push('🚀 Quase no top 5 - reforçar keyword');

        // Priority
        let priority = 'normal';
        if (opportunityScore >= 80) priority = 'urgent';
        else if (opportunityScore >= 60) priority = 'high';
        else if (opportunityScore <= 30) priority = 'low';

        // Upsert score
        await supabase
          .from('seo_optimization_scores')
          .upsert({
            article_id: article.id,
            opportunity_score: opportunityScore,
            ranking_score: rankingScore,
            freshness_score: freshnessScore,
            content_score: contentScore,
            cta_score: ctaScore,
            interlinking_score: interlinkingScore,
            best_keyword: bestKeyword || null,
            best_position: bestPosition,
            position_trend: positionTrend,
            days_since_update: daysSinceUpdate,
            word_count: wordCount,
            has_ctas: hasCtas,
            internal_links_count: internalLinksCount,
            suggestions: suggestions,
            priority,
            last_analyzed: new Date().toISOString(),
          }, { onConflict: 'article_id' });

        results.push({
          title: article.title,
          score: opportunityScore,
          priority,
          suggestions: suggestions.length,
        });
      }

      results.sort((a, b) => b.score - a.score);

      return new Response(JSON.stringify({ success: true, analyzed: results.length, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: auto_optimize - Auto-update article with AI
    if (action === 'auto_optimize') {
      const { article_id } = body;

      // Get article
      const { data: article } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', article_id)
        .single();

      if (!article) throw new Error('Artigo não encontrado');

      // Get score data
      const { data: scoreData } = await supabase
        .from('seo_optimization_scores')
        .select('*')
        .eq('article_id', article_id)
        .single();

      // Get Gemini API key
      const { data: aiConfig } = await supabase
        .from('ai_automation_config')
        .select('gemini_api_key, ai_model')
        .single();

      const apiKey = aiConfig?.gemini_api_key;
      if (!apiKey) throw new Error('API key do Gemini não configurada');

      const modelName = (aiConfig?.ai_model || 'gemini-2.5-flash').replace('google/', '');
      const suggestions = Array.isArray(scoreData?.suggestions) ? scoreData.suggestions : [];

      const prompt = `Você é um especialista em SEO para o nicho de ferro velho, sucata e reciclagem.

TAREFA: Otimizar e expandir o artigo existente abaixo para melhorar seu ranking no Google.

ARTIGO ATUAL:
Título: ${article.title}
Conteúdo: ${(article.content_md || article.content_html || '').substring(0, 6000)}

DADOS DE PERFORMANCE:
- Palavra-chave principal: ${scoreData?.best_keyword || 'não definida'}
- Posição atual: ${scoreData?.best_position || 'não ranqueado'}
- Tendência: ${scoreData?.position_trend || 'estável'}
- Contagem de palavras: ${scoreData?.word_count || 0}
- Links internos: ${scoreData?.internal_links_count || 0}

PROBLEMAS IDENTIFICADOS:
${suggestions.join('\n')}

REGRAS DE OTIMIZAÇÃO:
1. MANTER a estrutura e URL existentes
2. EXPANDIR seções com mais profundidade (mínimo 2000 palavras total)
3. REFORÇAR a palavra-chave principal naturalmente
4. ADICIONAR pelo menos 4 CTAs estratégicos para o XLata (links para /cadastro)
5. ADICIONAR links internos para: /blog/preco-sucata-hoje-tabela-atualizada, /sistema-para-ferro-velho, /planos
6. MELHORAR subtítulos H2/H3 com keywords
7. ADICIONAR seções: "Erros Comuns", "Dicas Práticas", "Como o XLata Ajuda"
8. ATUALIZAR dados e informações para 2026
9. NÃO remover conteúdo existente que já está bom
10. Manter tom profissional e prático

IMPORTANTE: O campo content_html deve conter HTML válido sem caracteres de controle. Use \\n para quebras de linha dentro do JSON. Não use tabs ou outros caracteres especiais.

FORMATO DE RESPOSTA (JSON):
{
  "title": "título otimizado",
  "seo_title": "título SEO (max 60 chars)",
  "seo_description": "meta description (max 155 chars)",
  "content_md": "conteúdo completo em Markdown otimizado",
  "content_html": "conteúdo completo em HTML otimizado"
}`;

      let responseText = '';
      let lastStatus = 0;
      let lastErrText = '';
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const geminiBody = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 16384,
          responseMimeType: 'application/json',
        },
      });

      // Up to 2 attempts. Hard 45s timeout per attempt via AbortController.
      // Short backoff so total time never blocks the UI for too long.
      for (let attempt = 1; attempt <= 2; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);
        let geminiResponse: Response;
        try {
          geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: geminiBody,
            signal: controller.signal,
          });
        } catch (e: any) {
          clearTimeout(timeoutId);
          lastStatus = 0;
          lastErrText = e?.name === 'AbortError' ? 'timeout' : (e?.message || 'network error');
          console.error(`Gemini attempt ${attempt}/2 - ${lastErrText}`);
          if (attempt < 2) { await new Promise(r => setTimeout(r, 2000)); continue; }
          break;
        }
        clearTimeout(timeoutId);

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          break;
        }

        lastStatus = geminiResponse.status;
        lastErrText = await geminiResponse.text();
        console.error(`Gemini attempt ${attempt}/2 - status ${lastStatus}`);

        // Retry only on transient errors (429/500/502/503/504), short backoff
        if ([429, 500, 502, 503, 504].includes(lastStatus) && attempt < 2) {
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        break;
      }

      if (!responseText) {
        // Always return 200 with fallback so the UI never hangs
        const isQuota = lastStatus === 429;
        const isOverloaded = [500, 502, 503, 504].includes(lastStatus);
        return new Response(JSON.stringify({
          success: false,
          fallback: true,
          error_code: isQuota ? 'GEMINI_QUOTA_EXCEEDED' : (isOverloaded ? 'GEMINI_OVERLOADED' : (lastStatus ? `GEMINI_${lastStatus}` : 'GEMINI_TIMEOUT')),
          error: isQuota
            ? 'Cota diária do Gemini esgotada (20 req/dia no plano gratuito). Configure a otimização automática para distribuir ao longo do dia, ou aguarde 24h.'
            : isOverloaded
              ? 'Servidores do Gemini sobrecarregados no momento. Aguarde alguns minutos e tente novamente.'
              : lastStatus
                ? `Erro Gemini ${lastStatus}. Tente novamente.`
                : 'Tempo esgotado ao chamar o Gemini. Tente novamente.',
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      let optimized: any;
      try {
        optimized = parseGeminiJson(responseText);
      } catch (parseErr: any) {
        console.error('Gemini JSON parse failed:', parseErr?.message, '— first 500:', responseText.substring(0, 500));
        return new Response(JSON.stringify({
          success: false,
          fallback: true,
          error_code: 'GEMINI_PARSE_ERROR',
          error: 'A IA retornou conteúdo malformado. Tente novamente em instantes.',
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Validate
      const newWordCount = (optimized.content_md || optimized.content_html || '').replace(/<[^>]*>/g, '').split(/\s+/).length;
      if (newWordCount < 500) throw new Error('Conteúdo otimizado muito curto');

      // Update article
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({
          title: optimized.title || article.title,
          seo_title: optimized.seo_title || article.seo_title,
          seo_description: optimized.seo_description || article.seo_description,
          content_md: optimized.content_md || article.content_md,
          content_html: optimized.content_html || article.content_html,
          updated_at: new Date().toISOString(),
        })
        .eq('id', article_id);

      if (updateError) throw updateError;

      // Update score
      await supabase
        .from('seo_optimization_scores')
        .update({
          last_optimized: new Date().toISOString(),
          word_count: newWordCount,
        })
        .eq('article_id', article_id);

      return new Response(JSON.stringify({
        success: true,
        title: optimized.title,
        wordCount: newWordCount,
        article_id,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ACTION: get_config
    if (action === 'get_config') {
      const { data: config } = await supabase
        .from('seo_optimizer_config')
        .select('*')
        .limit(1)
        .maybeSingle();
      return new Response(JSON.stringify({ config }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: update_config
    if (action === 'update_config') {
      const { enabled, articles_per_day, hours_interval, min_score } = body;
      const { data: existing } = await supabase
        .from('seo_optimizer_config')
        .select('id')
        .limit(1)
        .maybeSingle();

      const payload: any = { updated_at: new Date().toISOString() };
      if (typeof enabled === 'boolean') payload.enabled = enabled;
      if (typeof articles_per_day === 'number') payload.articles_per_day = Math.max(1, Math.min(50, articles_per_day));
      if (typeof hours_interval === 'number') payload.hours_interval = Math.max(1, Math.min(24, hours_interval));
      if (typeof min_score === 'number') payload.min_score = Math.max(0, Math.min(100, min_score));

      if (existing?.id) {
        await supabase.from('seo_optimizer_config').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('seo_optimizer_config').insert(payload);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: run_scheduled - executa 1 artigo respeitando config (chamado por cron)
    if (action === 'run_scheduled') {
      const { data: config } = await supabase
        .from('seo_optimizer_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!config || !config.enabled) {
        return new Response(JSON.stringify({ skipped: true, reason: 'disabled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // reset diário
      const today = new Date().toISOString().slice(0, 10);
      let articlesToday = config.articles_today || 0;
      if (config.reset_date !== today) {
        articlesToday = 0;
        await supabase.from('seo_optimizer_config')
          .update({ articles_today: 0, reset_date: today })
          .eq('id', config.id);
      }

      if (articlesToday >= config.articles_per_day) {
        return new Response(JSON.stringify({ skipped: true, reason: 'daily_limit_reached', articlesToday }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // checa intervalo
      if (config.last_run_at) {
        const lastRun = new Date(config.last_run_at).getTime();
        const elapsedH = (Date.now() - lastRun) / (1000 * 60 * 60);
        if (elapsedH < config.hours_interval) {
          return new Response(JSON.stringify({ skipped: true, reason: 'interval_not_reached', elapsedH }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // pega artigo de maior score que ainda não foi otimizado recentemente
      const { data: candidates } = await supabase
        .from('seo_optimization_scores')
        .select('article_id, opportunity_score, last_optimized')
        .gte('opportunity_score', config.min_score)
        .order('opportunity_score', { ascending: false })
        .limit(20);

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const target = (candidates || []).find(c =>
        !c.last_optimized || new Date(c.last_optimized).getTime() < sevenDaysAgo
      );

      if (!target) {
        return new Response(JSON.stringify({ skipped: true, reason: 'no_candidates' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // chama auto_optimize via fetch interno
      const optResp = await fetch(`${supabaseUrl}/functions/v1/seo-optimizer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ action: 'auto_optimize', article_id: target.article_id }),
      });

      const optResult = await optResp.json();

      await supabase.from('seo_optimizer_config')
        .update({
          last_run_at: new Date().toISOString(),
          last_article_id: target.article_id,
          articles_today: articlesToday + 1,
          reset_date: today,
        })
        .eq('id', config.id);

      return new Response(JSON.stringify({
        success: optResp.ok,
        article_id: target.article_id,
        result: optResult,
        articlesToday: articlesToday + 1,
        dailyLimit: config.articles_per_day,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ACTION: get_dashboard
    if (action === 'get_dashboard') {
      const { data: scores } = await supabase
        .from('seo_optimization_scores')
        .select('*, blog_posts!inner(title, slug, status)')
        .order('opportunity_score', { ascending: false });

      const urgent = (scores || []).filter(s => s.priority === 'urgent');
      const high = (scores || []).filter(s => s.priority === 'high');
      const rising = (scores || []).filter(s => s.position_trend === 'rising');
      const falling = (scores || []).filter(s => s.position_trend === 'falling');

      return new Response(JSON.stringify({
        total: scores?.length || 0,
        urgent: urgent.length,
        high: high.length,
        rising: rising.length,
        falling: falling.length,
        scores: scores || [],
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
