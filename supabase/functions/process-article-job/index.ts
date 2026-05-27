// Worker que processa UM job da fila article_jobs.
// Pode ser chamado manualmente (POST com {job_id}) ou pelo CRON (sem body, pega o próximo).
// Usa Gemini v1beta diretamente com prompts vindos de ai_prompts (fallback embutido).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { marked } from "https://esm.sh/marked@9.1.6";
import { parseGeminiJson } from "../_shared/gemini-json.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MIN_WORDS = 800;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 80);
}

function validateArticle(a: { title: string; content_md: string }) {
  const errors: string[] = [];
  const wordCount = (a.content_md || "").split(/\s+/).filter(Boolean).length;
  if (wordCount < MIN_WORDS) errors.push(`Palavras: ${wordCount} < ${MIN_WORDS}`);
  if (!a.title || a.title.length < 10) errors.push("Título curto");
  if (!a.content_md.match(/##\s/)) errors.push("Sem H2");
  return { valid: errors.length === 0, errors, wordCount };
}

async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const cleanModel = model.replace(/^models\//, "").replace(/^google\//, "");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    }),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini ${resp.status}: ${errText.substring(0, 250)}`);
  }
  const data = await resp.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}


// ───────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  let jobId: string | null = null;
  const startedAt = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    jobId = body.job_id || null;

    // Se não veio job_id, pega o próximo pending pronto para rodar
    if (!jobId) {
      const { data: nextJob } = await supabase
        .from("article_jobs")
        .select("id")
        .eq("status", "pending")
        .lte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!nextJob) {
        return new Response(
          JSON.stringify({ success: true, message: "Nenhum job pendente" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      jobId = nextJob.id;
    }

    // Buscar job + lock por status
    const { data: job, error: jobErr } = await supabase
      .from("article_jobs")
      .select("*")
      .eq("id", jobId)
      .single();
    if (jobErr || !job) throw new Error("Job não encontrado");
    if (job.status === "completed" || job.status === "cancelled") {
      return new Response(
        JSON.stringify({ success: true, message: `Job já está ${job.status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Marca como generating
    await supabase
      .from("article_jobs")
      .update({
        status: "generating",
        started_at: new Date().toISOString(),
        progress: 10,
        error_message: null,
      })
      .eq("id", jobId);

    // ── Buscar config + API key Gemini ──
    const { data: config } = await supabase
      .from("ai_automation_config")
      .select("*")
      .single();
    if (!config) throw new Error("Configuração de IA não encontrada");
    if (!config.is_ai_active) throw new Error("IA desativada nas configurações");

    const geminiKey = config.gemini_api_key;
    if (!geminiKey) throw new Error("API key Gemini não configurada");

    // ── Buscar prompt customizado (se houver) ──
    const { data: promptRow } = await supabase
      .from("ai_prompts")
      .select("system_prompt, user_prompt_template, is_active")
      .eq("feature_key", "article_generation")
      .maybeSingle();

    const systemPrompt =
      promptRow?.is_active && promptRow.system_prompt
        ? promptRow.system_prompt
        : FALLBACK_SYSTEM_PROMPT;
    const userTemplate =
      promptRow?.is_active && promptRow.user_prompt_template
        ? promptRow.user_prompt_template
        : FALLBACK_USER_TEMPLATE;

    // ── Montar variáveis a partir do payload ──
    const payload = job.payload || {};
    const vars: Record<string, string> = {
      topic: payload.topic || job.title,
      title: job.title,
      keywords: Array.isArray(payload.keywords) ? payload.keywords.join(", ") : (payload.keywords || ""),
      tone: payload.tone || "profissional, prático e direto",
      focus: payload.focus || "conversão de donos de ferro velho para o XLata",
      category: payload.category || "Geral",
      minWords: String(payload.minWords || MIN_WORDS),
    };
    const userPrompt = renderTemplate(userTemplate, vars);

    await supabase.from("article_jobs").update({ progress: 25 }).eq("id", jobId);

    // ── Gerar com retry ──
    let article: any = null;
    let lastErr = "";

    for (let attempt = 1; attempt <= MAX_AI_RETRIES; attempt++) {
      try {
        const content = await callGemini(
          geminiKey,
          config.ai_model || "gemini-2.5-flash",
          systemPrompt,
          userPrompt
        );
        const parsed = parseGeminiJson(content);
        if (!parsed.title || !parsed.content_md) throw new Error("Artigo incompleto");

        const quality = validateArticle(parsed);
        if (!quality.valid && attempt < MAX_AI_RETRIES) {
          lastErr = `Qualidade: ${quality.errors.join("; ")}`;
          await sleep(AI_RETRY_DELAY_MS);
          continue;
        }
        article = parsed;
        break;
      } catch (err) {
        lastErr = err instanceof Error ? err.message : String(err);
        console.error(`[process-article-job] Tentativa ${attempt} falhou:`, lastErr);
        if (attempt < MAX_AI_RETRIES) await sleep(AI_RETRY_DELAY_MS);
      }
    }

    if (!article) throw new Error(`Falha após ${MAX_AI_RETRIES} tentativas: ${lastErr}`);

    await supabase.from("article_jobs").update({ progress: 70 }).eq("id", jobId);

    // ── Salvar blog_post ──
    const wordCount = article.content_md.split(/\s+/).filter(Boolean).length;
    const contentHtml = await marked(article.content_md);
    if (!contentHtml || contentHtml.length < MIN_HTML_LENGTH) {
      throw new Error("HTML resultante vazio");
    }
    const slug = article.slug || slugify(article.title);

    const publishAt = payload.publishAt
      ? new Date(payload.publishAt)
      : new Date(Date.now() + (config.publish_interval_days || 0) * 86400000);

    const { data: blogPost, error: postErr } = await supabase
      .from("blog_posts")
      .insert({
        title: article.title,
        slug,
        seo_title: article.seo_title || article.title,
        seo_description: article.seo_description || article.excerpt,
        excerpt: article.excerpt,
        content_md: article.content_md,
        content_html: contentHtml,
        tags: article.tags || [],
        category_id: payload.category_id || config.default_category_id || null,
        status: payload.autoPublish ? "published" : "draft",
        published_at: publishAt.toISOString(),
        allow_indexing: true,
        sitemap_priority: 0.7,
        sitemap_changefreq: "monthly",
        reading_time_minutes: Math.ceil(wordCount / 200),
      })
      .select("id, title, slug")
      .single();

    if (postErr) throw new Error(`Erro ao salvar artigo: ${postErr.message}`);

    // ── Marcar topic_id como usado se for caso ──
    if (job.topic_id) {
      await supabase
        .from("seo_topic_bank")
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq("id", job.topic_id);
    }

    // ── Finalizar job ──
    await supabase
      .from("article_jobs")
      .update({
        status: "completed",
        progress: 100,
        finished_at: new Date().toISOString(),
        blog_post_id: blogPost.id,
      })
      .eq("id", jobId);

    // Log opcional
    try {
      await supabase.from("ai_usage_log").insert({
        usage_type: "seo_article",
        ai_provider: "google_gemini",
        ai_model: config.ai_model,
      });
    } catch (_) { /* ignore */ }

    console.log(
      `[process-article-job] ✅ Job ${jobId} → "${blogPost.title}" (${wordCount} palavras, ${Date.now() - startedAt}ms)`
    );

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        blog_post: blogPost,
        wordCount,
        durationMs: Date.now() - startedAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[process-article-job] Erro:", msg);

    if (jobId) {
      try {
        const { data: cur } = await supabase
          .from("article_jobs")
          .select("retry_count, max_retries")
          .eq("id", jobId)
          .single();
        const retry = (cur?.retry_count ?? 0) + 1;
        const max = cur?.max_retries ?? 3;
        const willRetry = retry < max;

        await supabase
          .from("article_jobs")
          .update({
            status: willRetry ? "pending" : "error",
            retry_count: retry,
            error_message: msg.substring(0, 1000),
            finished_at: willRetry ? null : new Date().toISOString(),
            // se vai retentar, agenda 5 min depois
            scheduled_at: willRetry
              ? new Date(Date.now() + 5 * 60 * 1000).toISOString()
              : undefined,
            progress: willRetry ? 0 : 0,
          })
          .eq("id", jobId);
      } catch (e) {
        console.error("[process-article-job] Falha ao registrar erro:", e);
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: msg, job_id: jobId }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
