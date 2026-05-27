import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { marked } from "https://esm.sh/marked@9.1.6";
import { parseGeminiJson } from "../_shared/gemini-json.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 10000; // 10s between retries
const MIN_WORDS = 1200;
const MIN_HTML_LENGTH = 1000;

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validateArticleQuality(article: { content_md: string; title: string; seo_title?: string; seo_description?: string }) {
  const errors: string[] = [];
  const wordCount = article.content_md.split(/\s+/).length;

  if (wordCount < MIN_WORDS) errors.push(`Palavras insuficientes: ${wordCount} < ${MIN_WORDS}`);
  if (!article.title || article.title.length < 10) errors.push("Título muito curto ou ausente");
  if (!article.seo_description || article.seo_description.length < 30) errors.push("Meta description ausente ou muito curta");
  if (!article.content_md.match(/##\s/)) errors.push("Sem subtítulos H2");
  if (!article.content_md.includes("xlata") && !article.content_md.includes("XLata") && !article.content_md.includes("cadastro")) errors.push("Sem CTAs do XLata");

  return { valid: errors.length === 0, errors, wordCount };
}

async function sendAdminAlert(supabase: ReturnType<typeof createClient>, title: string, message: string) {
  try {
    // Log to article_generation_log is already done elsewhere
    // Also create a notification for admin
    const { data: admins } = await supabase
      .from("admin_user_roles")
      .select("user_id")
      .eq("role", "admin_master")
      .limit(3);

    if (admins && admins.length > 0) {
      const adminId = admins[0].user_id;
      await supabase.from("user_direct_messages").insert({
        sender_id: adminId,
        sender_name: "Sistema de Automação",
        recipient_id: adminId,
        title: `⚠️ ${title}`,
        message,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }).catch(() => {});
    }
  } catch (e) {
    console.warn("[alert] Failed to send admin alert:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("[auto-gen] Starting...");

    // ═══ PHASE 0: Fix any published articles missing content_html ═══
    const { data: brokenArticles } = await supabase
      .from("blog_posts")
      .select("id, title, content_md")
      .eq("status", "published")
      .not("content_md", "is", null)
      .or("content_html.is.null,content_html.eq.");

    if (brokenArticles && brokenArticles.length > 0) {
      console.log(`[auto-gen] Fixing ${brokenArticles.length} articles missing content_html`);
      for (const art of brokenArticles) {
        if (art.content_md) {
          const html = await marked(art.content_md);
          await supabase.from("blog_posts").update({ content_html: html }).eq("id", art.id);
          console.log(`[auto-gen] Fixed HTML for: ${art.title}`);
        }
      }
    }

    // ═══ PHASE 1: Load config ═══
    const { data: config, error: cfgErr } = await supabase
      .from("ai_automation_config")
      .select("*")
      .single();

    if (cfgErr || !config) throw new Error("Config não encontrada");

    if (!config.automation_enabled || !config.is_ai_active) {
      console.log("[auto-gen] Automação desativada");
      return jsonResp({ message: "Automação desativada", generated: 0, published: 0 });
    }

    const now = new Date();
    const results = { generated: 0, published: 0, fixed: brokenArticles?.length || 0, errors: [] as string[] };

    // ═══ PHASE 2: Pre-validate & auto-publish drafts ═══
    const { data: toPublish } = await supabase
      .from("blog_posts")
      .select("id, title, slug, content_html, content_md, seo_title, seo_description")
      .eq("status", "draft")
      .not("published_at", "is", null)
      .lte("published_at", now.toISOString());

    if (toPublish && toPublish.length > 0) {
      const validIds: string[] = [];
      const invalidIds: string[] = [];

      for (const art of toPublish) {
        // Pre-publish validation
        let htmlContent = art.content_html;

        // If no HTML but has MD, convert it
        if ((!htmlContent || htmlContent.length < MIN_HTML_LENGTH) && art.content_md) {
          htmlContent = await marked(art.content_md);
          await supabase.from("blog_posts").update({ content_html: htmlContent }).eq("id", art.id);
        }

        const hasContent = htmlContent && htmlContent.length >= MIN_HTML_LENGTH;
        const hasSeo = art.seo_title && art.seo_description;
        const hasTitle = art.title && art.title.length >= 10;

        if (hasContent && hasSeo && hasTitle) {
          validIds.push(art.id);
        } else {
          invalidIds.push(art.id);
          const reason = !hasContent ? "Conteúdo HTML vazio/curto" : !hasSeo ? "SEO incompleto" : "Título curto";
          console.warn(`[auto-gen] BLOCKED publish "${art.title}": ${reason}`);
          results.errors.push(`Bloqueado: "${art.title}" - ${reason}`);

          await sendAdminAlert(supabase, "Artigo bloqueado",
            `O artigo "${art.title}" não passou na validação pré-publicação: ${reason}. Ele permanece como rascunho.`);
        }
      }

      if (validIds.length > 0) {
        await supabase.from("blog_posts").update({ status: "published" }).in("id", validIds);
        results.published = validIds.length;
        console.log(`[auto-gen] Published ${validIds.length} articles`);
      }
    }

    // ═══ PHASE 3: Check if we should generate ═══
    const lastGen = config.last_generation_at ? new Date(config.last_generation_at) : null;
    const daysSinceLast = lastGen
      ? Math.floor((now.getTime() - lastGen.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceLast < config.publish_interval_days) {
      console.log(`[auto-gen] Skip gen: ${daysSinceLast}d < ${config.publish_interval_days}d`);
      return jsonResp({ message: "Ainda não é hora", ...results });
    }

    // Monthly limit
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count: monthlyCount } = await supabase
      .from("article_generation_log")
      .select("*", { count: "exact", head: true })
      .eq("status", "success")
      .gte("created_at", startOfMonth);

    if ((monthlyCount || 0) >= config.articles_per_month) {
      console.log("[auto-gen] Monthly limit reached");
      return jsonResp({ message: "Limite mensal atingido", ...results });
    }

    // ═══ PHASE 4: Pick next topic (queue order by priority) ═══
    const { data: topicRows } = await supabase
      .from("seo_topic_bank")
      .select("*")
      .eq("is_used", false)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1);

    const topic = topicRows?.[0];
    if (!topic) {
      console.log("[auto-gen] No topics available");
      await sendAdminAlert(supabase, "Banco de temas vazio", "Todos os temas SEO foram usados. Adicione novos temas para continuar a automação.");
      return jsonResp({ message: "Sem temas disponíveis", ...results });
    }

    console.log(`[auto-gen] Topic: "${topic.topic}" (priority: ${topic.priority})`);

    // Create pending log
    const { data: logEntry } = await supabase
      .from("article_generation_log")
      .insert({
        topic_id: topic.id,
        topic_used: topic.topic,
        ai_provider: config.ai_provider,
        ai_model: config.ai_model,
        status: "pending",
      })
      .select("id")
      .single();

    const logId = logEntry?.id;

    // ═══ PHASE 5: Generate with RETRY ═══
    let article: { title: string; seo_title: string; seo_description: string; slug: string; excerpt: string; content_md: string; tags: string[] } | null = null;
    let lastError = "";
    let generationTime = 0;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`[auto-gen] Attempt ${attempt}/${MAX_RETRIES}...`);
      const startTime = Date.now();

      try {
        const prompt = buildPrompt(topic.topic, topic.keywords);
        let aiResponse: string;
        const geminiApiKey = config.gemini_api_key;
        const useGemini = config.ai_provider === "google_gemini" && geminiApiKey;

        if (useGemini) {
          const rawModel = config.ai_model || "gemini-2.0-flash";
          const geminiModel = rawModel.includes("/") ? rawModel.split("/").pop() : rawModel;
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;

          const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.8, maxOutputTokens: 16384, responseMimeType: "application/json" },
            }),
          });

          if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(`Gemini ${resp.status}: ${errText.substring(0, 200)}`);
          }

          const data = await resp.json();
          aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } else {
          if (!LOVABLE_API_KEY) throw new Error("Nenhuma API key configurada");

          const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: config.ai_model || "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: "Especialista SEO para reciclagem. Retorne JSON válido." },
                { role: "user", content: prompt },
              ],
              temperature: 0.8,
            }),
          });

          if (!resp.ok) throw new Error(`Gateway ${resp.status}`);
          const data = await resp.json();
          aiResponse = data.choices?.[0]?.message?.content || "";
        }

        generationTime = Date.now() - startTime;

        // Parse JSON
        const parsed = parseGeminiJson(aiResponse);

        if (!parsed.title || !parsed.content_md) throw new Error("Artigo incompleto (sem título ou conteúdo)");

        // Quality validation
        const quality = validateArticleQuality(parsed);
        if (!quality.valid) {
          console.warn(`[auto-gen] Quality check failed (attempt ${attempt}):`, quality.errors);
          if (attempt < MAX_RETRIES) {
            lastError = `Qualidade insuficiente: ${quality.errors.join("; ")}`;
            await sleep(RETRY_DELAY_MS);
            continue;
          }
          // On last attempt, accept if word count is at least 800
          if (quality.wordCount < 800) throw new Error(`Qualidade final insuficiente: ${quality.errors.join("; ")}`);
          console.warn("[auto-gen] Accepting article on final attempt despite quality issues");
        }

        article = parsed;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Erro desconhecido";
        generationTime = Date.now() - startTime;
        console.error(`[auto-gen] Attempt ${attempt} failed:`, lastError);

        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS);
        }
      }
    }

    if (!article) {
      // All retries failed
      if (logId) {
        await supabase.from("article_generation_log").update({
          status: "failed",
          error_message: `Falha após ${MAX_RETRIES} tentativas: ${lastError}`,
          generation_time_ms: generationTime,
        }).eq("id", logId);
      }

      await sendAdminAlert(supabase, "Geração de artigo falhou",
        `O tema "${topic.topic}" falhou após ${MAX_RETRIES} tentativas.\nÚltimo erro: ${lastError}`);

      return jsonResp({ success: false, error: `Falha após ${MAX_RETRIES} tentativas`, ...results }, 500);
    }

    // ═══ PHASE 6: Generate slug, convert MD→HTML, save ═══
    if (!article.slug) {
      article.slug = article.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }

    const wordCount = article.content_md.split(/\s+/).length;
    const contentHtml = await marked(article.content_md);

    // Final validation: HTML must exist
    if (!contentHtml || contentHtml.length < MIN_HTML_LENGTH) {
      const errMsg = "HTML gerado é vazio ou muito curto após conversão";
      if (logId) {
        await supabase.from("article_generation_log").update({ status: "failed", error_message: errMsg, generation_time_ms: generationTime }).eq("id", logId);
      }
      await sendAdminAlert(supabase, "Artigo com HTML vazio", `O artigo "${article.title}" gerou HTML vazio. Reprocessando necessário.`);
      return jsonResp({ success: false, error: errMsg, ...results }, 500);
    }

    const publishDate = new Date(now);
    publishDate.setDate(publishDate.getDate() + config.publish_interval_days);
    publishDate.setHours(config.publish_hour, 0, 0, 0);

    const { data: post, error: postErr } = await supabase
      .from("blog_posts")
      .insert({
        title: article.title,
        slug: article.slug,
        seo_title: article.seo_title || article.title,
        seo_description: article.seo_description || article.excerpt,
        excerpt: article.excerpt,
        content_md: article.content_md,
        content_html: contentHtml,
        tags: article.tags || [],
        category_id: config.default_category_id,
        status: "draft",
        published_at: publishDate.toISOString(),
        allow_indexing: true,
        reading_time_minutes: Math.ceil(wordCount / 200),
      })
      .select("id, title, slug")
      .single();

    if (postErr) throw new Error(`Erro ao salvar: ${postErr.message}`);

    // Mark topic used
    await supabase.from("seo_topic_bank").update({ is_used: true, used_at: now.toISOString() }).eq("id", topic.id);

    // Update config
    await supabase.from("ai_automation_config").update({
      last_generation_at: now.toISOString(),
      next_generation_at: publishDate.toISOString(),
      total_articles_generated: config.total_articles_generated + 1,
      updated_at: now.toISOString(),
    }).eq("id", config.id);

    // Update log
    if (logId) {
      await supabase.from("article_generation_log").update({
        blog_post_id: post.id,
        status: "success",
        word_count: wordCount,
        generation_time_ms: generationTime,
      }).eq("id", logId);
    }

    // Log usage
    await supabase.from("ai_usage_log").insert({
      usage_type: "auto_scheduled_article",
      ai_provider: config.ai_provider,
      ai_model: config.ai_model,
    }).catch(() => {});

    results.generated = 1;
    console.log(`[auto-gen] ✅ Done! "${post.title}" (${wordCount} words, HTML: ${contentHtml.length} chars, publish: ${publishDate.toISOString()})`);

    return jsonResp({
      success: true,
      ...results,
      article: { id: post.id, title: post.title, slug: post.slug, wordCount, htmlLength: contentHtml.length, publishDate: publishDate.toISOString() },
    });
  } catch (error) {
    console.error("[auto-gen] Fatal error:", error);
    return jsonResp({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }, 500);
  }
});

function buildPrompt(topic: string, keywords: string[]) {
  return `Você é um especialista ABSOLUTO em SEO para o setor de ferro velho e reciclagem no Brasil.
Sua missão é criar conteúdo que DOMINE o Google e CONVERTA visitantes em clientes do XLata.

TEMA: ${topic}
PALAVRAS-CHAVE: ${keywords.join(", ")}

Crie um artigo ÚNICO e PROFISSIONAL com MÍNIMO 1800 palavras seguindo esta estrutura de FUNIL DE VENDAS:

## TOPO — ATRAÇÃO (300+ palavras)
1. Título SEO FORTE (palavra-chave EXATA no início, máx 60 chars)
2. Introdução com DOR REAL e URGENTE do dono de ferro velho
3. Dado impactante: "Donos de ferro velho perdem em média R$ 2.000/mês com erros de precificação"

## MEIO — EDUCAÇÃO PROFUNDA (500+ palavras)
4. Explicação COMPLETA do tema com IMPACTO FINANCEIRO REAL
5. Como fazer na prática — passo a passo DETALHADO (400+ palavras)

## TRANSIÇÃO — COMPARAÇÃO (250+ palavras)
6. Tabela comparativa: Método Manual vs Sistema Automatizado

## FUNDO — CONVERSÃO (400+ palavras)
7. Erros comuns que CUSTAM DINHEIRO (com valores reais)
8. Dicas avançadas que poucos conhecem
9. Conclusão com URGÊNCIA e CTA FORTE para XLata

═══ INTERLINKING OBRIGATÓRIO ═══
- Link para artigo pilar: [preço da sucata hoje](/blog/preco-sucata-hoje-tabela-atualizada)
- Link para landing: [sistema para ferro velho](/sistema-para-ferro-velho)
- 3-5 links internos para artigos relacionados
- Link para cadastro: [Teste grátis o XLata](https://xlata.site/cadastro)

═══ CTAs OBRIGATÓRIOS (mínimo 4) ═══
1. Após intro: "👉 **[Teste grátis o XLata e pare de perder dinheiro](https://xlata.site/cadastro)**"
2. Meio: "💡 **Mais de 130 depósitos já automatizaram com o [XLata](/sistema-para-ferro-velho). Teste grátis!**"
3. Antes conclusão: "⚡ **[Calcule seus preços automaticamente — 7 dias grátis](https://xlata.site/cadastro)**"
4. Final: "🚀 **[Comece agora — Teste grátis por 7 dias, sem cartão](https://xlata.site/cadastro)**"

═══ QUALIDADE ═══
- Prova social: "Mais de 130 depósitos já usam o XLata"
- Parágrafos CURTOS (máx 3 linhas)
- Listas com bullet points frequentes
- **Negrito** em termos importantes
- Markdown: ## H2, ### H3, - listas
- NUNCA copiar conteúdo
- VARIAR estrutura
- Linguagem SIMPLES e PRÁTICA

RETORNE JSON válido (sem code blocks):
{
  "title": "Título SEO (máx 60 chars, keyword no início)",
  "seo_title": "Título SEO meta tag (máx 60 chars)",
  "seo_description": "Meta description com benefício + CTA (máx 155 chars)",
  "slug": "url-amigavel-com-keyword",
  "excerpt": "Resumo com gancho de conversão (máx 200 chars)",
  "content_md": "Conteúdo completo Markdown 1800+ palavras com todos os CTAs e links internos",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;
}
