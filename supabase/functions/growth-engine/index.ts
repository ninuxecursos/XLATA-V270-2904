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

    const body = await req.json().catch(() => ({}));
    const action = body.action || "run_cycle";

    // Get config
    const { data: config } = await supabase.from("growth_engine_config").select("*").single();
    if (!config) throw new Error("Config não encontrada");

    // Get sector-specific config, fallback to global
    const { data: sectorConfig } = await supabase.from("ai_sector_config").select("*").eq("sector_key", "growth_engine").single();
    const { data: aiConfig } = await supabase.from("ai_automation_config").select("*").single();
    const useGlobal = sectorConfig?.use_global_key !== false;
    const geminiApiKey = useGlobal ? aiConfig?.gemini_api_key : (sectorConfig?.api_key || aiConfig?.gemini_api_key);
    const aiModel = (sectorConfig?.ai_model || aiConfig?.ai_model || "gemini-2.5-flash").replace("google/", "");

    if (!geminiApiKey) {
      return new Response(JSON.stringify({ success: false, error: "Gemini API Key não configurada" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle different actions
    if (action === "update_config") {
      const updates = body.updates || {};
      const { error } = await supabase.from("growth_engine_config").update(updates).eq("id", config.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "approve_action") {
      const { error } = await supabase.from("growth_engine_actions").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", body.action_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "skip_action") {
      const { error } = await supabase.from("growth_engine_actions").update({ status: "skipped", reviewed_at: new Date().toISOString() }).eq("id", body.action_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "rollback") {
      return await handleRollback(supabase, body.action_id);
    }

    if (action === "execute_action") {
      return await executeAction(supabase, supabaseUrl, supabaseKey, body.action_id);
    }

    // ===== MAIN CYCLE =====
    // Check daily limits
    const today = new Date().toISOString().split("T")[0];
    const { count: todayActions } = await supabase
      .from("growth_engine_actions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today)
      .in("status", ["success", "executing"]);

    if ((todayActions || 0) >= config.max_actions_per_day) {
      return new Response(JSON.stringify({ success: true, message: "Limite diário atingido", actions_today: todayActions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Collect ecosystem data
    const [postsRes, rankingRes, indexRes, revenueRes] = await Promise.all([
      supabase.from("blog_posts").select("id, title, slug, status, content_html, seo_title, seo_description, published_at, view_count, updated_at").eq("status", "published").order("published_at", { ascending: false }).limit(80),
      supabase.from("ranking_tracking").select("article_id, keyword, position").order("checked_at", { ascending: false }).limit(200),
      supabase.from("index_tracking").select("url, status").order("last_checked", { ascending: false }).limit(200),
      supabase.from("article_revenue_tracking").select("article_id, revenue_generated, conversion_rate, clicks_cta, paying_customers"),
    ]);

    // Check learnings
    const { data: learnings } = await supabase.from("growth_engine_learnings").select("action_type, outcome").order("created_at", { ascending: false }).limit(50);

    const posts = postsRes.data || [];
    const rankings = rankingRes.data || [];
    const indexData = indexRes.data || [];
    const revenue = revenueRes.data || [];

    const articleData = posts.map(p => {
      const rank = rankings.find(r => r.article_id === p.id);
      const idx = indexData.find(i => i.url?.includes(p.slug));
      const rev = revenue.find(r => r.article_id === p.id);
      const contentLen = (p.content_html || "").length;
      return {
        id: p.id, title: p.title, slug: p.slug,
        views: p.view_count || 0, content_length: contentLen,
        has_seo: !!p.seo_title && !!p.seo_description,
        position: rank?.position || null, keyword: rank?.keyword || null,
        indexed: idx?.status === "indexed",
        revenue: rev?.revenue_generated || 0,
        conversion: rev?.conversion_rate || 0,
        cta_clicks: rev?.clicks_cta || 0,
        customers: rev?.paying_customers || 0,
        days_old: p.updated_at ? Math.floor((Date.now() - new Date(p.updated_at).getTime()) / 86400000) : 999,
      };
    });

    // Summarize learnings for AI
    const learningsSummary = (learnings || []).reduce((acc: any, l: any) => {
      acc[l.action_type] = acc[l.action_type] || { positive: 0, negative: 0 };
      acc[l.action_type][l.outcome === "positive" ? "positive" : "negative"]++;
      return acc;
    }, {});

    // Ask Gemini what to do
    const prompt = `Você é o motor de crescimento autônomo do blog XLata (nicho: sucata, ferro velho, reciclagem no Brasil).

CONFIGURAÇÃO ATUAL:
- Modo: ${config.mode}
- Máx ações/dia: ${config.max_actions_per_day}
- Ações já executadas hoje: ${todayActions || 0}
- Proteger artigos top 5: ${config.protect_top5}
- Proteger alta conversão: ${config.protect_high_conversion}

APRENDIZADOS ANTERIORES (o que funcionou/não funcionou):
${JSON.stringify(learningsSummary)}

ARTIGOS (top 25 por impacto):
${JSON.stringify(articleData.slice(0, 25))}

REGRAS DE SEGURANÇA:
1. NUNCA alterar artigos em posição 1-5 no Google (${config.protect_top5 ? "ATIVO" : "DESATIVADO"})
2. NUNCA reescrever artigos com conversão > 3% (${config.protect_high_conversion ? "ATIVO" : "DESATIVADO"})
3. Máximo ${config.max_actions_per_day - (todayActions || 0)} ações restantes hoje
4. Máximo ${config.max_rewrites_per_day} reescritas por dia
5. Priorizar: posição 5-20 > tráfego sem conversão > escalar sucesso > não indexados
6. Evitar ações que historicamente tiveram resultado negativo

Responda EXCLUSIVAMENTE em JSON:
{
  "analysis_summary": "resumo da análise em 2 frases",
  "health_score": 0-100,
  "actions": [
    {
      "article_id": "uuid",
      "article_title": "título",
      "action_type": "optimize_seo|update_content|add_cta|scale|rewrite|regenerate",
      "reason": "motivo específico",
      "priority": "high|medium|low",
      "expected_impact": "impacto esperado",
      "safe": true/false
    }
  ]
}

Sugira no máximo ${config.max_actions_per_day - (todayActions || 0)} ações, ordenadas por prioridade.
Apenas ações SEGURAS e com alto potencial de impacto.`;

    // Clean model name - just strip google/ prefix
    const resolvedModel = (aiModel || "gemini-2.0-flash").replace("google/", "");
    console.log("Using Gemini model:", resolvedModel);
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${geminiApiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 16384,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      if (geminiRes.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "Limite Gemini atingido. Tente mais tarde.", retryable: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (geminiRes.status === 503) {
        return new Response(JSON.stringify({ success: false, error: "Gemini sobrecarregado. Aguarde 1-2 minutos.", retryable: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Gemini ${geminiRes.status}: ${errText.substring(0, 200)}`);
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const finishReason = geminiData?.candidates?.[0]?.finishReason || "unknown";
    console.log("Growth engine Gemini finishReason:", finishReason, "len:", rawText.length);

    let decision;
    try {
      decision = parseGeminiJson(rawText);
    } catch (e) {
      console.error("Parse failed:", (e as Error).message, "preview:", rawText.substring(0, 500));
      return new Response(JSON.stringify({
        success: false,
        error: "Erro ao processar resposta da IA. Tente novamente em alguns instantes.",
        retryable: true,
        finishReason,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Insert actions
    const actions = decision.actions || [];
    const insertedActions = [];

    for (const act of actions) {
      if (!act.safe) continue;

      const initialStatus = config.mode === "auto" ? "approved" : "pending";
      const { data: inserted, error } = await supabase.from("growth_engine_actions").insert({
        article_id: act.article_id,
        article_title: act.article_title,
        action_type: act.action_type,
        action_reason: act.reason,
        priority: act.priority,
        status: initialStatus,
      }).select().single();

      if (!error && inserted) insertedActions.push(inserted);
    }

    // If auto mode, execute approved actions
    let executedCount = 0;
    if (config.mode === "auto") {
      for (const act of insertedActions) {
        try {
          await executeActionInternal(supabase, supabaseUrl, supabaseKey, act);
          executedCount++;
        } catch (e) {
          console.error("Auto-execute failed:", e);
        }
      }
    }

    // Update config
    await supabase.from("growth_engine_config").update({
      last_run_at: new Date().toISOString(),
      next_run_at: new Date(Date.now() + config.run_interval_hours * 3600000).toISOString(),
      total_actions_executed: config.total_actions_executed + executedCount,
    }).eq("id", config.id);

    return new Response(JSON.stringify({
      success: true,
      analysis: decision.analysis_summary,
      health_score: decision.health_score,
      actions_suggested: actions.length,
      actions_created: insertedActions.length,
      actions_executed: executedCount,
      mode: config.mode,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Growth engine error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function executeActionInternal(supabase: any, supabaseUrl: string, supabaseKey: string, action: any) {
  // Save snapshot first
  if (action.article_id) {
    const { data: article } = await supabase.from("blog_posts").select("content_html, content_md, title, seo_title, seo_description, tags, view_count").eq("id", action.article_id).single();
    if (article) {
      await supabase.from("content_snapshots").insert({
        article_id: action.article_id,
        action_id: action.id,
        content_html: article.content_html,
        content_md: article.content_md,
        title: article.title,
        seo_title: article.seo_title,
        seo_description: article.seo_description,
        tags: article.tags,
      });

      // Store views_before
      await supabase.from("growth_engine_actions").update({
        status: "executing",
        views_before: article.view_count || 0,
      }).eq("id", action.id);
    }
  }

  // Call the appropriate edge function
  let fnName = "";
  const fnBody: any = {};

  switch (action.action_type) {
    case "optimize_seo":
      fnName = "seo-optimizer";
      fnBody.article_id = action.article_id;
      break;
    case "update_content":
    case "rewrite":
    case "regenerate":
      fnName = "reconstruct-article";
      fnBody.article_id = action.article_id;
      break;
    case "scale":
      fnName = "scale-content";
      fnBody.article_id = action.article_id;
      break;
    case "add_cta":
      fnName = "seo-optimizer";
      fnBody.article_id = action.article_id;
      fnBody.focus = "cta";
      break;
    default:
      fnName = "seo-optimizer";
      fnBody.article_id = action.article_id;
  }

  const fnUrl = `${supabaseUrl}/functions/v1/${fnName}`;
  const res = await fetch(fnUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify(fnBody),
  });

  const result = await res.json().catch(() => ({}));

  if (res.ok && result.success !== false) {
    await supabase.from("growth_engine_actions").update({
      status: "success",
      result_summary: result.message || "Executado com sucesso",
      executed_at: new Date().toISOString(),
    }).eq("id", action.id);
  } else {
    await supabase.from("growth_engine_actions").update({
      status: "failed",
      error_message: result.error || `HTTP ${res.status}`,
      executed_at: new Date().toISOString(),
    }).eq("id", action.id);
  }
}

async function executeAction(supabase: any, supabaseUrl: string, supabaseKey: string, actionId: string) {
  const corsH = { ...corsHeaders, "Content-Type": "application/json" };
  const { data: action } = await supabase.from("growth_engine_actions").select("*").eq("id", actionId).single();
  if (!action) return new Response(JSON.stringify({ success: false, error: "Ação não encontrada" }), { headers: corsH });

  try {
    await executeActionInternal(supabase, supabaseUrl, supabaseKey, action);
    return new Response(JSON.stringify({ success: true }), { headers: corsH });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: corsH });
  }
}

async function handleRollback(supabase: any, actionId: string) {
  const corsH = { ...corsHeaders, "Content-Type": "application/json" };
  const { data: snapshot } = await supabase.from("content_snapshots").select("*").eq("action_id", actionId).single();
  if (!snapshot) return new Response(JSON.stringify({ success: false, error: "Snapshot não encontrado" }), { headers: corsH });

  const { error } = await supabase.from("blog_posts").update({
    content_html: snapshot.content_html,
    content_md: snapshot.content_md,
    title: snapshot.title,
    seo_title: snapshot.seo_title,
    seo_description: snapshot.seo_description,
    tags: snapshot.tags,
  }).eq("id", snapshot.article_id);

  if (error) return new Response(JSON.stringify({ success: false, error: error.message }), { headers: corsH });

  await supabase.from("growth_engine_actions").update({ status: "rolled_back" }).eq("id", actionId);

  // Log negative learning
  await supabase.from("growth_engine_learnings").insert({
    action_type: "rollback",
    outcome: "negative",
    details: "Ação revertida manualmente",
    article_id: snapshot.article_id,
  });

  return new Response(JSON.stringify({ success: true }), { headers: corsH });
}
