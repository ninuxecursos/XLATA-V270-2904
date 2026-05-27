import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const { sourceText, targetKeyword, categoryId } = await req.json();
    if (!sourceText || sourceText.trim().length < 100) {
      throw new Error("Texto fonte deve ter no mínimo 100 caracteres");
    }

    // Get AI config for provider/model
    const { data: aiConfig } = await supabase
      .from("ai_automation_config")
      .select("*")
      .single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const geminiApiKey = aiConfig?.gemini_api_key;
    const provider = aiConfig?.ai_provider || "lovable_cloud";
    const model = aiConfig?.ai_model || "google/gemini-3-flash-preview";

    const systemPrompt = `Você é um redator SEO sênior e copywriter de conversão especialista em reciclagem, sucata e ferro velho no Brasil. Você escreve artigos que RANQUEIAM no Google, SEGURAM o usuário na página e CONVERTEM em cadastros.

REGRAS ABSOLUTAS:
1. NUNCA copie frases do texto original
2. NUNCA mantenha a mesma estrutura de parágrafos
3. Extraia APENAS o tema e tópicos principais
4. Reconstrua o conteúdo DO ZERO com sua própria perspectiva
5. O artigo deve ser SUPERIOR ao original em profundidade e valor
6. MÍNIMO 1500 palavras — artigos curtos serão rejeitados
7. O artigo é um FUNIL DE VENDAS disfarçado de conteúdo educativo

═══════════════════════════════════════
ESTRUTURA DE FUNIL OBRIGATÓRIA
═══════════════════════════════════════

## TOPO DO FUNIL — ATRAÇÃO (Seções 1-2)

1. TÍTULO SEO FORTE
   - Palavra-chave principal no início
   - Máximo 60 caracteres
   - Gerar curiosidade ou urgência

2. INTRODUÇÃO COM DOR + PROMESSA (150-200 palavras)
   - Abrir com dor REAL do dono de ferro velho:
     • "Você sabe quanto dinheiro perdeu essa semana por erro no preço da sucata?"
     • "A falta de controle no seu ferro velho está consumindo seu lucro silenciosamente"
   - Gatilhos: perda de dinheiro, falta de controle, erros no preço
   - Prometer solução ao final
   - Palavra-chave nos primeiros 100 caracteres

## MEIO DO FUNIL — EDUCAÇÃO (Seções 3-4)

3. EXPLICAÇÃO COMPLETA DO TEMA (400-500 palavras)
   - Profundidade real com dados do mercado
   - Mostrar IMPACTO FINANCEIRO dos problemas
   - Exemplo: "Um erro de R$ 0,10/kg em 500kg = R$ 50 perdidos por dia = R$ 1.500/mês"
   - Subtítulos H2 com variações da palavra-chave
   - **CTA 1**: Sutil, educativo → "Donos de ferro velho que usam o XLata já eliminaram esse problema"

4. COMO FAZER NA PRÁTICA (300-400 palavras)
   - Passo a passo numerado
   - Exemplos reais do dia a dia
   - Mostrar a complexidade do processo manual
   - **CTA 2**: Comparativo → "Manualmente isso leva 2 horas. Com o XLata, 30 segundos."

## TRANSIÇÃO — QUEBRA MENTAL (Seção 5)

5. COMPARAÇÃO: MANUAL vs AUTOMATIZADO (200-250 palavras)
   - Criar tabela ou lista comparativa:
     • Caderno/planilha → erros, demora, retrabalho
     • Sistema XLata → automático, preciso, rápido
   - Usar formato: "Você pode continuar fazendo manualmente... OU automatizar tudo"
   - **CTA 3**: Direto → "Mais de 130 depósitos já automatizaram com o XLata. [Teste grátis](https://xlata.site/cadastro)"

## FUNDO DO FUNIL — CONVERSÃO (Seções 6-8)

6. ERROS COMUNS QUE CUSTAM DINHEIRO (200-300 palavras)
   - 5-7 erros reais com consequência financeira
   - Cada erro = dinheiro perdido
   - **CTA 4**: Solução → "O XLata evita TODOS esses erros automaticamente"

7. DICAS AVANÇADAS (200-300 palavras)
   - Estratégias que poucos conhecem
   - Diferencial competitivo
   - Tendências do mercado 2026

8. CONCLUSÃO — FECHAMENTO DE VENDA (150-200 palavras)
   - Resumo dos pontos (reforçar dor)
   - Apresentar XLata como solução definitiva:
     • Automatiza cálculo de preço
     • Controla estoque em tempo real
     • Evita erros que custam dinheiro
     • Funciona no celular
   - Prova social: "Mais de 130 depósitos já usam"
   - Quebra de objeção: "Teste grátis por 7 dias, sem cartão"
   - **CTA FINAL FORTE**: "👉 [Teste grátis o XLata e pare de perder dinheiro hoje mesmo](https://xlata.site/cadastro)"

═══════════════════════════════════════
GATILHOS PSICOLÓGICOS (usar ao longo do texto)
═══════════════════════════════════════
- DOR: perder dinheiro, desorganização, prejuízo invisível
- URGÊNCIA: "todo dia sem controle é dinheiro perdido"
- PROVA SOCIAL: "130+ depósitos já usam o XLata"
- SIMPLICIDADE: "funciona no celular, sem instalação"
- SEGURANÇA: "teste grátis, sem compromisso"

═══════════════════════════════════════
REGRAS DE SEO
═══════════════════════════════════════
- Palavra-chave no título, H1, primeiro parágrafo
- Variações semânticas nos H2 e H3
- Densidade de keyword: 1-2% natural
- Subtítulos a cada 200-300 palavras

═══════════════════════════════════════
ESCANEABILIDADE
═══════════════════════════════════════
- Parágrafos de 2-4 linhas máximo
- Listas com bullets ou números
- **Negrito** em termos importantes
- Blocos visuais bem separados

Use Markdown: ## para H2, ### para H3, - para listas, **texto** para negrito, [link](url) para links.

RETORNE EM JSON VÁLIDO com esta estrutura exata:
{
  "title": "Título SEO otimizado (máx 60 chars)",
  "slug": "slug-do-artigo-seo",
  "seo_title": "Título SEO para meta tag (máx 60 chars)",
  "seo_description": "Meta description com CTA (máx 155 chars)",
  "excerpt": "Resumo do artigo (máx 200 chars)",
  "content_md": "Conteúdo completo em Markdown com 1500+ palavras e funil de conversão",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "word_count": 1500
}`;

    const userPrompt = `Analise o texto abaixo e crie um artigo COMPLETAMENTE NOVO e ORIGINAL sobre o mesmo tema.

${targetKeyword ? `PALAVRA-CHAVE ALVO: ${targetKeyword}` : ""}

TEXTO FONTE (apenas para referência de tema, NÃO copie):
---
${sourceText.substring(0, 8000)}
---

Gere o artigo reconstruído em JSON.`;

    let aiResponse: string;
    const startTime = Date.now();

    if (provider === "google_gemini" && geminiApiKey) {
      // Direct Gemini API
      const geminiModel = model.includes("/") ? model.split("/")[1] : model;
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
      
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: { 
            temperature: 0.8, 
            maxOutputTokens: 16384,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${err}`);
      }

      const data = await response.json();
      aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      // Lovable AI Gateway
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error("Rate limit atingido. Tente novamente em alguns minutos.");
        if (response.status === 402) throw new Error("Créditos insuficientes. Adicione créditos no workspace.");
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      aiResponse = data.choices?.[0]?.message?.content || "";
    }

    const generationTime = Date.now() - startTime;

    // Parse JSON from response
    let articleData;
    try {
      // Remove markdown code fences if present
      let cleaned = aiResponse.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      articleData = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("AI response (first 500 chars):", aiResponse.substring(0, 500));
      throw new Error("Falha ao processar resposta da IA. Tente novamente.");
    }

    // Validate required fields
    if (!articleData.title || !articleData.content_md) {
      throw new Error("Artigo gerado incompleto. Tente novamente.");
    }

    // Generate slug if not provided
    if (!articleData.slug) {
      articleData.slug = articleData.title
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    // Convert markdown to HTML
    const contentHtml = articleData.content_md
      .replace(/^### (.*$)/gm, "<h3>$1</h3>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      .replace(/^# (.*$)/gm, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^- (.*$)/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
      .replace(/\n\n/g, "</p><p>")
      .replace(/^(?!<[hul])/gm, "<p>")
      .replace(/(?<![>])$/gm, "</p>");

    const wordCount = articleData.content_md.split(/\s+/).length;

    // Save to blog_posts
    const { data: post, error: insertError } = await supabase
      .from("blog_posts")
      .insert({
        title: articleData.title,
        slug: articleData.slug,
        seo_title: articleData.seo_title || articleData.title,
        seo_description: articleData.seo_description || articleData.excerpt,
        excerpt: articleData.excerpt,
        content_md: articleData.content_md,
        content_html: contentHtml,
        tags: articleData.tags || [],
        category_id: categoryId || null,
        author_id: user.id,
        status: "draft",
        reading_time_minutes: Math.ceil(wordCount / 200),
        allow_indexing: true,
      })
      .select("id, title, slug")
      .single();

    if (insertError) throw new Error(`Erro ao salvar artigo: ${insertError.message}`);

    // Log generation
    await supabase.from("article_generation_log").insert({
      blog_post_id: post.id,
      topic_used: `[Reconstrução] ${articleData.title}`,
      ai_provider: provider,
      ai_model: model,
      generation_time_ms: generationTime,
      word_count: wordCount,
      status: "success",
    });

    // Log AI usage
    await supabase.from("ai_usage_log").insert({
      usage_type: "article_reconstruction",
      ai_provider: provider,
      ai_model: model,
    });

    return new Response(JSON.stringify({
      success: true,
      article: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        wordCount,
        generationTime,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("reconstruct-article error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
