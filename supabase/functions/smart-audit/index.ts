import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseGeminiJson } from "../_shared/gemini-json.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get sector-specific config, fallback to global
    const { data: sectorConfig } = await supabase.from("ai_sector_config").select("*").eq("sector_key", "smart_audit").single();
    const { data: aiConfig } = await supabase.from("ai_automation_config").select("*").single();
    
    const useGlobal = sectorConfig?.use_global_key !== false;
    const geminiApiKey = useGlobal ? aiConfig?.gemini_api_key : (sectorConfig?.api_key || aiConfig?.gemini_api_key);
    const aiModel = (sectorConfig?.ai_model || aiConfig?.ai_model || "gemini-2.5-flash").replace("google/", "");

    if (!geminiApiKey) {
      return new Response(JSON.stringify({ success: false, error: "Gemini API Key não configurada em AI & Automação" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Collect all ecosystem data in parallel
    const [postsRes, rankingRes, indexRes, revenueRes, topicsRes] = await Promise.all([
      supabase.from("blog_posts").select("id, title, slug, status, content_html, content_md, seo_title, seo_description, published_at, view_count, tags, category_id, reading_time_minutes, updated_at").order("published_at", { ascending: false }).limit(100),
      supabase.from("ranking_tracking").select("*").order("checked_at", { ascending: false }).limit(200),
      supabase.from("index_tracking").select("*").order("last_checked", { ascending: false }).limit(200),
      supabase.from("article_revenue_tracking").select("*"),
      supabase.from("seo_topic_bank").select("*"),
    ]);

    const posts = postsRes.data || [];
    const rankings = rankingRes.data || [];
    const indexData = indexRes.data || [];
    const revenue = revenueRes.data || [];
    const topics = topicsRes.data || [];

    // Build article summary for AI (compact to save tokens)
    // IMPORTANT: limit to top 30 articles to fit in Gemini's token budget.
    // Priority: top by views first, then articles missing SEO/CTA (high-impact targets).
    const allSummaries = posts.map(p => {
      const rank = rankings.find(r => r.article_id === p.id);
      const idx = indexData.find(i => i.url?.includes(p.slug));
      const rev = revenue.find(r => r.article_id === p.id);
      const contentLen = (p.content_html || p.content_md || "").length;
      const hasH2 = (p.content_html || "").includes("<h2");
      const hasCTA = (p.content_html || "").toLowerCase().includes("cta") || (p.content_html || "").includes("teste grátis") || (p.content_html || "").includes("criar conta");

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p.status,
        published_at: p.published_at,
        views: p.view_count || 0,
        content_length: contentLen,
        has_seo_title: !!p.seo_title,
        has_seo_desc: !!p.seo_description,
        has_h2: hasH2,
        has_cta: hasCTA,
        reading_time: p.reading_time_minutes,
        ranking_position: rank?.position || null,
        ranking_keyword: rank?.keyword || null,
        is_indexed: idx?.status === "indexed",
        index_status: idx?.status || "unknown",
        revenue: rev?.revenue_generated || 0,
        clicks_cta: rev?.clicks_cta || 0,
        signups: rev?.signups || 0,
        paying_customers: rev?.paying_customers || 0,
        conversion_rate: rev?.conversion_rate || 0,
        days_since_update: p.updated_at ? Math.floor((Date.now() - new Date(p.updated_at).getTime()) / 86400000) : null,
      };
    });

    // Sort by impact signal: revenue desc, then views desc, then missing SEO desc
    const articleSummaries = allSummaries
      .sort((a, b) => (b.revenue - a.revenue) || (b.views - a.views) || ((a.has_seo_title ? 1 : 0) - (b.has_seo_title ? 1 : 0)))
      .slice(0, 30);

    // Stats overview
    const stats = {
      total_articles: posts.length,
      published: posts.filter(p => p.status === "published").length,
      draft: posts.filter(p => p.status === "draft").length,
      indexed: indexData.filter(i => i.status === "indexed").length,
      not_indexed: indexData.filter(i => i.status === "not_indexed").length,
      top10: rankings.filter(r => r.position && r.position <= 10).length,
      top20: rankings.filter(r => r.position && r.position <= 20).length,
      total_revenue: revenue.reduce((s, r) => s + (r.revenue_generated || 0), 0),
      total_views: posts.reduce((s, p) => s + (p.view_count || 0), 0),
      available_topics: topics.filter(t => !t.is_used).length,
      used_topics: topics.filter(t => t.is_used).length,
    };

    // Send to Gemini for analysis
    const prompt = `Você é um consultor especialista em SEO e marketing digital para o nicho de sucata, ferro velho e reciclagem no Brasil. Analise o ecossistema de conteúdo do XLata e gere um relatório de auditoria inteligente.

DADOS DO SISTEMA:
${JSON.stringify(stats)}

ARTIGOS (resumo, top ${articleSummaries.length} por impacto):
${JSON.stringify(articleSummaries)}

Responda EXCLUSIVAMENTE em JSON válido com esta estrutura:
{
  "health_score": número de 0 a 100,
  "executive_summary": "resumo executivo em 2-3 frases",
  "traffic_increase_potential": "X%",
  "revenue_increase_potential": "Y%",
  "categories": {
    "content": { "score": 0-100, "issues": number, "label": "Conteúdo" },
    "seo": { "score": 0-100, "issues": number, "label": "SEO" },
    "performance": { "score": 0-100, "issues": number, "label": "Performance" },
    "conversion": { "score": 0-100, "issues": number, "label": "Conversão" },
    "revenue": { "score": 0-100, "issues": number, "label": "Receita" },
    "scale": { "score": 0-100, "issues": number, "label": "Escala" }
  },
  "articles_classification": [
    {
      "article_id": "id",
      "title": "título",
      "classification": "money|high_potential|low_performance|useless",
      "classification_label": "💰 Gerando dinheiro|📈 Potencial alto|⚠️ Baixa performance|❌ Inútil",
      "problems": ["problema1"],
      "actions": [
        {
          "type": "optimize_seo|add_cta|update_content|scale|rewrite",
          "label": "Ação sugerida",
          "priority": "high|medium|low",
          "impact": "descrição curta do impacto esperado"
        }
      ]
    }
  ],
  "action_plan": {
    "high": [{ "action": "descrição", "type": "optimize_seo|add_cta|update_content|scale|rewrite", "article_id": "id ou null", "article_title": "título" }],
    "medium": [{ "action": "descrição", "type": "...", "article_id": "...", "article_title": "..." }],
    "low": [{ "action": "descrição", "type": "...", "article_id": "...", "article_title": "..." }]
  },
  "opportunities": [
    { "description": "oportunidade detectada", "potential_impact": "alto|médio|baixo" }
  ]
}

REGRAS:
- Classifique TODOS os artigos fornecidos
- Sugira ações ESPECÍFICAS e acionáveis (não genéricas)
- Priorize impacto real em tráfego e receita
- Considere o nicho de sucata/ferro velho/reciclagem
- Máximo 5 ações por artigo
- Máximo 10 itens por nível de prioridade no plano de ação`;

    // Clean model name - just strip google/ prefix, use as-is
    const resolvedModel = (aiModel || "gemini-2.0-flash").replace("google/", "");
    console.log("Using Gemini model:", resolvedModel);
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${geminiApiKey}`;
    
    // Retry com backoff em erros transitórios (503/429/500/502/504)
    const transientCodes = new Set([429, 500, 502, 503, 504]);
    const maxAttempts = 3;
    let geminiRes: Response | null = null;
    let lastErrText = "";

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 32768,
            responseMimeType: "application/json",
          },
        }),
      });

      if (geminiRes.ok) break;

      lastErrText = await geminiRes.text().catch(() => "");
      console.error(`Gemini error (tentativa ${attempt}/${maxAttempts}):`, geminiRes.status, lastErrText);

      if (!transientCodes.has(geminiRes.status) || attempt === maxAttempts) break;

      // Backoff exponencial: 1s, 2s, 4s
      const delay = 1000 * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }

    if (!geminiRes || !geminiRes.ok) {
      const status = geminiRes?.status ?? 500;

      if (status === 503) {
        return new Response(JSON.stringify({
          success: false,
          error: "O Gemini está sobrecarregado no momento. Aguarde 1-2 minutos e tente novamente.",
          retryable: true,
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (status === 429) {
        return new Response(JSON.stringify({
          success: false,
          error: "Limite de requisições Gemini atingido. Tente novamente em alguns minutos.",
          retryable: true,
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({
        success: false,
        error: `Erro Gemini: ${status}`,
        retryable: transientCodes.has(status),
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const finishReason = geminiData?.candidates?.[0]?.finishReason || "unknown";
    console.log("Gemini finishReason:", finishReason, "rawLength:", rawText.length);

    let audit;
    try {
      audit = parseGeminiJson(rawText);
    } catch (e) {
      console.error("Failed to parse Gemini response:", (e as Error).message, "preview:", rawText.substring(0, 500));
      return new Response(JSON.stringify({
        success: false,
        error: finishReason === "MAX_TOKENS"
          ? "A análise ficou muito longa para o modelo. Tente novamente — vamos pedir um resumo mais conciso."
          : "Erro ao processar resposta da IA. Tente novamente.",
        retryable: true,
        finishReason,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, audit, stats, analyzed_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Smart audit error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
