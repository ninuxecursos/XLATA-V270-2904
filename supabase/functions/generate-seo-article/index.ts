import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { marked } from "https://esm.sh/marked@9.1.6";
import { parseGeminiJson } from "../_shared/gemini-json.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_RETRIES = 3;
const MIN_WORDS = 1200;
const MIN_HTML_LENGTH = 1000;
// Backoff progressivo para erros 503/429/500 do Gemini (sobrecarga)
const OVERLOAD_BACKOFF_MS = [15000, 45000, 90000];
// Modelo de fallback usado quando o modelo configurado fica indisponível
const FALLBACK_MODEL = "gemini-2.5-flash-lite";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function classifyGeminiError(message: string): "overload" | "auth" | "parse" | "other" {
  if (/Gemini 5\d\d|Gemini 429|UNAVAILABLE|high demand|RESOURCE_EXHAUSTED/i.test(message)) return "overload";
  if (/Gemini 40[01]|Gemini 403|API key|PERMISSION_DENIED|invalid_argument/i.test(message)) return "auth";
  if (/JSON|Sem JSON|parse|Unexpected token|Artigo incompleto/i.test(message)) return "parse";
  return "other";
}

function validateArticle(article: { content_md: string; title: string; seo_description?: string }) {
  const errors: string[] = [];
  const wordCount = article.content_md.split(/\s+/).length;
  if (wordCount < MIN_WORDS) errors.push(`Palavras: ${wordCount} < ${MIN_WORDS}`);
  if (!article.title || article.title.length < 10) errors.push("Título curto");
  if (!article.content_md.match(/##\s/)) errors.push("Sem H2");
  return { valid: errors.length === 0, errors, wordCount };
}

const SEO_PROMPT = `Você é um especialista ABSOLUTO em SEO para o setor de ferro velho e reciclagem no Brasil.
Sua missão é criar conteúdo que DOMINE o Google e CONVERTA visitantes em clientes do XLata.

TEMA: {TOPIC}
PALAVRAS-CHAVE: {KEYWORDS}

Crie um artigo ÚNICO e PROFISSIONAL com MÍNIMO 1800 palavras seguindo esta estrutura de FUNIL DE VENDAS:

## TOPO — ATRAÇÃO (300+ palavras)
1. Título SEO FORTE (palavra-chave EXATA no início, máx 60 chars)
2. Introdução com DOR REAL e URGENTE do dono de ferro velho
3. Dado impactante com números reais

## MEIO — EDUCAÇÃO PROFUNDA (500+ palavras)
4. Explicação COMPLETA do tema com IMPACTO FINANCEIRO REAL
5. Como fazer na prática — passo a passo DETALHADO (400+ palavras)

## TRANSIÇÃO — COMPARAÇÃO (250+ palavras)
6. Tabela comparativa: Método Manual vs Sistema Automatizado

## FUNDO — CONVERSÃO (400+ palavras)
7. Erros comuns que CUSTAM DINHEIRO
8. Dicas avançadas
9. Conclusão com URGÊNCIA e CTA FORTE

═══ INTERLINKING OBRIGATÓRIO ═══
- Link para artigo pilar: [preço da sucata hoje](/blog/preco-sucata-hoje-tabela-atualizada)
- Link para landing: [sistema para ferro velho](/sistema-para-ferro-velho)
- 3-5 links internos relacionados
- Link cadastro: [Teste grátis o XLata](https://xlata.site/cadastro)

═══ CTAs OBRIGATÓRIOS (mínimo 4) ═══
1. Após intro: "👉 **[Teste grátis o XLata e pare de perder dinheiro](https://xlata.site/cadastro)**"
2. Meio: "💡 **Mais de 130 depósitos já automatizaram com o [XLata](/sistema-para-ferro-velho). Teste grátis!**"
3. Antes conclusão: "⚡ **[Calcule seus preços automaticamente — 7 dias grátis](https://xlata.site/cadastro)**"
4. Final: "🚀 **[Comece agora — Teste grátis por 7 dias, sem cartão](https://xlata.site/cadastro)**"

═══ QUALIDADE ═══
- Prova social: "Mais de 130 depósitos já usam o XLata"
- Parágrafos CURTOS (máx 3 linhas), listas frequentes
- **Negrito** em termos importantes
- Markdown: ## H2, ### H3, - listas
- 100% ORIGINAL, linguagem simples e prática
- VARIAR estrutura (nunca template fixo)

═══ REGRAS DE CTR (CRÍTICAS — afetam clique no Google) ═══
REGRA TÍTULO: começar com emoji forte (💰 ⚡ 🔥 📊 🚀), conter palavra-chave EXATA,
incluir "2026" OU uma destas: "atualizado", "hoje", "completo", "guia", "tabela".
Máx 60 caracteres. Exemplo: "💰 Preço do Cobre KG Hoje 2026 — Tabela Atualizada".

REGRA META DESCRIPTION: 150-155 chars, conter número/dado concreto + benefício claro
+ verbo no imperativo ("Confira", "Veja", "Descubra", "Calcule"). Exemplo:
"Veja o preço atualizado do cobre por kg em 2026. Tabela completa, dicas para
vender mais caro e evitar prejuízo. Atualizado hoje."

REGRA ABERTURA (FEATURED SNIPPET): o PRIMEIRO parágrafo deve responder DIRETAMENTE
à pergunta-chave do título em 1-2 frases objetivas (formato "X é Y, custa Z").
Só depois entre na narrativa de dor.

Retorne APENAS JSON válido (sem code blocks):
{
  "title": "Título SEO (máx 60 chars, keyword no início)",
  "seo_title": "Título SEO meta tag (máx 60 chars)",
  "seo_description": "Meta description com benefício + CTA (máx 155 chars)",
  "slug": "url-amigavel-com-keyword",
  "excerpt": "Resumo com gancho de conversão (máx 200 chars)",
  "content_md": "Conteúdo Markdown 1800+ palavras com CTAs e links internos",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  let logId: string | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const specificTopicId = body.topic_id;

    console.log("[gen-article] Starting", { specificTopicId });

    const { data: config, error: configError } = await supabase
      .from("ai_automation_config")
      .select("*")
      .single();

    if (configError || !config) throw new Error("Configuração não encontrada");
    if (!config.is_ai_active) throw new Error("IA desativada nas configurações");

    const geminiApiKey = config.gemini_api_key;

    // Get topic
    let topic: { id: string; topic: string; keywords: string[]; category: string; priority: number };

    if (specificTopicId) {
      const { data, error } = await supabase.from("seo_topic_bank").select("*").eq("id", specificTopicId).single();
      if (error || !data) throw new Error("Tema não encontrado");
      topic = data;
    } else {
      // Prioridade 1: tópicos com scheduled_for vencido (agendamento manual do usuário)
      const nowIso = new Date().toISOString();
      const { data: scheduledData } = await supabase
        .from("seo_topic_bank")
        .select("*")
        .eq("is_used", false)
        .not("scheduled_for", "is", null)
        .lte("scheduled_for", nowIso)
        .order("scheduled_for", { ascending: true })
        .limit(1);

      if (scheduledData?.[0]) {
        topic = scheduledData[0];
        console.log(`[gen-article] Using SCHEDULED topic (scheduled_for=${topic.scheduled_for ?? "n/a"})`);
      } else {
        // Prioridade 2: fila normal por prioridade
        const { data } = await supabase
          .from("seo_topic_bank")
          .select("*")
          .eq("is_used", false)
          .is("scheduled_for", null)
          .order("priority", { ascending: false })
          .order("created_at", { ascending: true })
          .limit(1);
        if (!data?.[0]) throw new Error("Nenhum tema disponível");
        topic = data[0];
      }
    }

    console.log(`[gen-article] Topic: "${topic.topic}"`);

    // Create log
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
    logId = logEntry?.id || null;

    // ═══ LOAD CUSTOM PROMPT (with fallback to hardcoded SEO_PROMPT) ═══
    let activeSystemPrompt = "Especialista SEO para reciclagem. Retorne JSON válido.";
    let activeUserTemplate = SEO_PROMPT;
    try {
      const { data: customPrompt } = await supabase
        .from("ai_prompts")
        .select("system_prompt, user_prompt_template")
        .eq("feature_key", "seo_article_generation")
        .eq("is_active", true)
        .maybeSingle();
      if (customPrompt?.user_prompt_template) {
        activeUserTemplate = customPrompt.user_prompt_template;
        if (customPrompt.system_prompt) activeSystemPrompt = customPrompt.system_prompt;
        console.log("[gen-article] Using custom prompt from ai_prompts");
      }
    } catch (e) {
      console.log("[gen-article] No custom prompt, using fallback");
    }

    // ═══ GENERATE WITH RETRY (resiliente a 503/429 do Gemini) ═══
    const prompt = activeUserTemplate.replace("{TOPIC}", topic.topic).replace("{KEYWORDS}", topic.keywords.join(", "));
    const useDirectGemini = config.ai_provider === "google_gemini" && geminiApiKey;

    let article: { title: string; seo_title: string; seo_description: string; slug: string; excerpt: string; content_md: string; tags: string[] } | null = null;
    let lastError = "";
    let lastErrorKind: "overload" | "auth" | "parse" | "other" | "quality" = "other";
    let generationTime = 0;

    // Tentamos MAX_RETRIES no modelo principal; se todas falharem por overload, fazemos +1 tentativa com modelo de fallback
    const totalAttempts = MAX_RETRIES + 1;

    for (let attempt = 1; attempt <= totalAttempts; attempt++) {
      const isFallbackAttempt = attempt > MAX_RETRIES;
      console.log(`[gen-article] Attempt ${attempt}/${totalAttempts}${isFallbackAttempt ? " (FALLBACK MODEL)" : ""}`);
      const attemptStart = Date.now();

      try {
        let content: string;

        if (useDirectGemini) {
          const rawModel = config.ai_model || "gemini-2.5-flash";
          const baseModel = rawModel.includes("/") ? rawModel.split("/").pop()! : rawModel;
          const geminiModel = isFallbackAttempt ? FALLBACK_MODEL : baseModel;
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;

          const resp = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `Sistema: ${activeSystemPrompt}\n\nUsuário: ${prompt}` }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 16384, responseMimeType: "application/json" },
            }),
          });

          if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(`Gemini ${resp.status}: ${errText.substring(0, 200)}`);
          }

          const data = await resp.json();
          content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } else {
          if (!lovableApiKey) throw new Error("Nenhuma API key configurada");

          const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: config.ai_model || "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: activeSystemPrompt },
                { role: "user", content: prompt },
              ],
              temperature: 0.7,
            }),
          });

          if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(`Gateway ${resp.status}: ${errText.substring(0, 200)}`);
          }
          const data = await resp.json();
          content = data.choices?.[0]?.message?.content || "";
        }

        // Parse
        const parsed = parseGeminiJson(content);
        if (!parsed.title || !parsed.content_md) throw new Error("Artigo incompleto");

        const quality = validateArticle(parsed);
        if (!quality.valid && attempt < totalAttempts) {
          lastError = `Qualidade: ${quality.errors.join("; ")}`;
          lastErrorKind = "quality";
          console.warn(`[gen-article] Quality fail (attempt ${attempt}):`, lastError);
          await sleep(5000);
          continue;
        }

        article = parsed;
        generationTime = Date.now() - attemptStart;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Erro desconhecido";
        const kind = classifyGeminiError(lastError);
        lastErrorKind = kind;
        generationTime = Date.now() - attemptStart;
        console.error(`[gen-article] Attempt ${attempt} failed (${kind}):`, lastError);

        // Erro de autenticação/permissão: NÃO faz sentido tentar de novo
        if (kind === "auth") {
          console.error("[gen-article] Auth error — aborting retry loop");
          break;
        }

        if (attempt < totalAttempts) {
          // Backoff progressivo (mais longo) para overload; rápido para parse
          let waitMs: number;
          if (kind === "overload") {
            waitMs = OVERLOAD_BACKOFF_MS[Math.min(attempt - 1, OVERLOAD_BACKOFF_MS.length - 1)];
          } else if (kind === "parse") {
            waitMs = 2000;
          } else {
            waitMs = 8000;
          }
          console.log(`[gen-article] Waiting ${waitMs}ms before next attempt`);
          await sleep(waitMs);
        }
      }
    }

    if (!article) {
      const friendly =
        lastErrorKind === "overload"
          ? "O Google Gemini está com alta demanda no momento. O tópico foi mantido na fila e o sistema tentará novamente em alguns minutos."
          : lastErrorKind === "auth"
          ? "Chave da API Gemini inválida ou sem permissão. Verifique em Covildomal → IA & Automação → Configurações."
          : lastErrorKind === "parse"
          ? "A resposta do Gemini veio incompleta. Tente novamente em instantes."
          : `Falha após ${MAX_RETRIES + 1} tentativas: ${lastError}`;

      if (logId) {
        await supabase.from("article_generation_log").update({
          status: "failed",
          error_message: friendly,
          generation_time_ms: generationTime,
        }).eq("id", logId);
      }
      throw new Error(friendly);
    }

    // ═══ SAVE WITH HTML CONVERSION ═══
    const wordCount = article.content_md.split(/\s+/).length;
    const contentHtml = await marked(article.content_md);

    if (!contentHtml || contentHtml.length < MIN_HTML_LENGTH) {
      throw new Error("HTML gerado é vazio após conversão MD→HTML");
    }

    if (!article.slug) {
      article.slug = article.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }

    const now = new Date();
    // Se o tópico tinha agendamento manual, publicar imediatamente (já chegou a hora)
    // Caso contrário, usar o intervalo configurado
    const publishDate = (topic as any).scheduled_for
      ? now
      : (() => {
          const d = new Date(now);
          d.setDate(d.getDate() + config.publish_interval_days);
          d.setHours(config.publish_hour, 0, 0, 0);
          return d;
        })();
    const shouldPublishNow = !!(topic as any).scheduled_for;

    const { data: blogPost, error: postError } = await supabase
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
        status: shouldPublishNow ? "published" : "draft",
        published_at: publishDate.toISOString(),
        allow_indexing: true,
        sitemap_priority: 0.7,
        sitemap_changefreq: "monthly",
        reading_time_minutes: Math.ceil(wordCount / 200),
      })
      .select("id, title, slug")
      .single();

    if (postError) throw new Error(`Erro ao salvar: ${postError.message}`);

    // Mark topic used
    await supabase.from("seo_topic_bank").update({ is_used: true, used_at: now.toISOString() }).eq("id", topic.id);

    // Update config
    const totalGenTime = Date.now() - startTime;
    await supabase.from("ai_automation_config").update({
      last_generation_at: now.toISOString(),
      next_generation_at: publishDate.toISOString(),
      total_articles_generated: config.total_articles_generated + 1,
      updated_at: now.toISOString(),
    }).eq("id", config.id);

    // Update log
    if (logId) {
      await supabase.from("article_generation_log").update({
        blog_post_id: blogPost.id,
        status: "success",
        word_count: wordCount,
        generation_time_ms: totalGenTime,
      }).eq("id", logId);
    }

    // Log usage
    try {
      await supabase.from("ai_usage_log").insert({
        usage_type: "seo_article",
        ai_provider: config.ai_provider,
        ai_model: config.ai_model,
      });
    } catch (_e) { /* ignore */ }

    console.log(`[gen-article] ✅ "${blogPost.title}" (${wordCount} words, HTML: ${contentHtml.length} chars)`);

    return new Response(
      JSON.stringify({
        success: true,
        article: { id: blogPost.id, title: blogPost.title, slug: blogPost.slug, wordCount, htmlLength: contentHtml.length, publishDate: publishDate.toISOString() },
        generationTime: totalGenTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[gen-article] Error:", error);
    const totalGenTime = Date.now() - startTime;

    if (logId) {
      try {
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await supabase.from("article_generation_log").update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Erro desconhecido",
          generation_time_ms: totalGenTime,
        }).eq("id", logId);
      } catch (_e) { /* ignore */ }
    }

    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
