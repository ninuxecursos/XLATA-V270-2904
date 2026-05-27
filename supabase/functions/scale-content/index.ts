import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseGeminiJson } from "../_shared/gemini-json.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VARIATION_TEMPLATES: Record<string, { keywords: string[]; titleTemplate: string }> = {
  city: {
    keywords: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Guarulhos', 'Campinas', 'Fortaleza', 'Salvador', 'Recife', 'Goiânia', 'Manaus', 'Belém', 'Brasília', 'Osasco'],
    titleTemplate: '{keyword} em {variation}',
  },
  material: {
    keywords: ['cobre', 'alumínio', 'ferro', 'latão', 'aço inox', 'bronze', 'chumbo', 'metal misto'],
    titleTemplate: '{keyword} - {variation}',
  },
  problem: {
    keywords: ['como evitar prejuízo', 'erros comuns', 'como resolver', 'como organizar', 'como aumentar lucro'],
    titleTemplate: '{variation} com {keyword}',
  },
  question: {
    keywords: ['como calcular', 'quanto vale', 'vale a pena', 'como funciona', 'qual o melhor'],
    titleTemplate: '{variation} {keyword}',
  },
  comparative: {
    keywords: ['melhor sistema', 'comparativo', 'alternativa', 'qual escolher'],
    titleTemplate: '{variation} para {keyword}',
  },
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

    if (action === 'get_money_pages') {
      // Decoupled queries: avoid FK-name dependency, return empty list gracefully
      const { data: revenueRows, error: revErr } = await supabase
        .from('article_revenue_tracking')
        .select('*')
        .in('classification', ['high_revenue', 'medium_revenue'])
        .order('revenue_generated', { ascending: false });

      if (revErr) {
        console.error('get_money_pages revenue error:', revErr);
        return new Response(JSON.stringify({ success: true, money_pages: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const articleIds = (revenueRows || []).map((r: any) => r.article_id).filter(Boolean);
      let postsMap: Record<string, any> = {};
      if (articleIds.length) {
        const { data: posts } = await supabase
          .from('blog_posts')
          .select('id, title, slug, content_md, tags, category_id')
          .in('id', articleIds);
        (posts || []).forEach((p: any) => { postsMap[p.id] = p; });
      }

      const { data: scaledCounts } = await supabase
        .from('scaled_articles')
        .select('source_article_id, status');

      const countMap: Record<string, { total: number; success: number }> = {};
      scaledCounts?.forEach((s: any) => {
        if (!countMap[s.source_article_id]) countMap[s.source_article_id] = { total: 0, success: 0 };
        countMap[s.source_article_id].total++;
        if (s.status === 'published') countMap[s.source_article_id].success++;
      });

      const enriched = (revenueRows || [])
        .filter((mp: any) => postsMap[mp.article_id])
        .map((mp: any) => ({
          ...mp,
          blog_posts: postsMap[mp.article_id],
          scaled_total: countMap[mp.article_id]?.total || 0,
          scaled_success: countMap[mp.article_id]?.success || 0,
        }));

      return new Response(JSON.stringify({ success: true, money_pages: enriched }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'suggest_variations') {
      const { article_id } = await req.json();

      const { data: article } = await supabase
        .from('blog_posts')
        .select('id, title, slug, tags')
        .eq('id', article_id)
        .single();

      if (!article) throw new Error('Article not found');

      // Check existing scaled articles to avoid duplicates
      const { data: existing } = await supabase
        .from('scaled_articles')
        .select('variation_type, variation_keyword')
        .eq('source_article_id', article_id);

      const existingSet = new Set((existing || []).map((e: any) => `${e.variation_type}:${e.variation_keyword}`));

      const suggestions: any[] = [];
      for (const [type, template] of Object.entries(VARIATION_TEMPLATES)) {
        for (const variation of template.keywords) {
          const key = `${type}:${variation}`;
          if (!existingSet.has(key)) {
            suggestions.push({
              variation_type: type,
              variation_keyword: variation,
              suggested_title: template.titleTemplate
                .replace('{keyword}', article.title.split(' ').slice(0, 4).join(' '))
                .replace('{variation}', variation),
            });
          }
        }
      }

      return new Response(JSON.stringify({ success: true, suggestions: suggestions.slice(0, 30) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'scale_article') {
      const { source_article_id, variation_type, variation_keyword } = body;

      // Get source article
      const { data: source } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', source_article_id)
        .single();

      if (!source) throw new Error('Source article not found');

      // Get Gemini API key
      const { data: aiConfig } = await supabase
        .from('ai_automation_config')
        .select('gemini_api_key, ai_model')
        .limit(1)
        .single();

      const apiKey = aiConfig?.gemini_api_key;
      if (!apiKey) throw new Error('Gemini API key not configured');

      // Check for duplicate
      const { data: existingArticle } = await supabase
        .from('scaled_articles')
        .select('id')
        .eq('source_article_id', source_article_id)
        .eq('variation_type', variation_type)
        .eq('variation_keyword', variation_keyword)
        .maybeSingle();

      if (existingArticle) throw new Error('This variation already exists');

      // Extract structure from source
      const headings = (source.content_md || '').match(/^#{1,3}\s.+$/gm) || [];
      const structureDesc = headings.slice(0, 10).join('\n');

      const prompt = `Você é um especialista em SEO e copywriting para o nicho de ferro velho, sucata e reciclagem.

ARTIGO ORIGINAL DE SUCESSO (que gera clientes):
Título: ${source.title}
Estrutura de headings:
${structureDesc}

TAREFA: Criar um artigo COMPLETAMENTE NOVO baseado no padrão de sucesso acima, mas focado em:
- Tipo de variação: ${variation_type}
- Variação específica: ${variation_keyword}
- Keyword alvo: ${source.title.split(' ').slice(0, 4).join(' ')} ${variation_keyword}

REGRAS OBRIGATÓRIAS:
1. Mínimo 1500 palavras
2. Conteúdo 100% original (NÃO copiar do original)
3. Manter mesma estrutura de conversão (dor → problema → solução → XLata)
4. Incluir 4+ CTAs distribuídos: início, meio, antes da conclusão, final
5. CTAs devem direcionar para /cadastro
6. Usar H2 e H3 para organizar
7. Incluir dados específicos sobre ${variation_keyword}
8. Mencionar o XLata como solução
9. Incluir link para o artigo original: /blog/${source.slug}
10. Tom profissional mas acessível

FORMATO DE RESPOSTA (JSON):
{
  "title": "título SEO otimizado",
  "seo_title": "título SEO (max 60 chars)",
  "seo_description": "meta description (max 160 chars)",
  "slug": "slug-do-artigo",
  "excerpt": "resumo curto",
  "content_md": "conteúdo completo em Markdown",
  "tags": ["tag1", "tag2"]
}`;

      const modelName = (aiConfig?.ai_model || 'gemini-2.5-flash').replace('google/', '');
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 16384, responseMimeType: 'application/json' },
          }),
        }
      );

      if (!geminiResponse.ok) {
        const errText = await geminiResponse.text();
        throw new Error(`Gemini error: ${errText}`);
      }

      const geminiData = await geminiResponse.json();
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

      let articleData: any;
      try {
        articleData = parseGeminiJson(rawText);
      } catch (e) {
        console.error('Scale-content parse failed:', (e as Error).message);
        throw new Error('Erro ao processar resposta da IA. Tente novamente.');
      }

      // Convert MD to HTML
      const contentHtml = (articleData.content_md || '')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?!<[hulo])(.+)$/gm, '<p>$1</p>');

      // Validate quality
      const wordCount = (articleData.content_md || '').split(/\s+/).length;
      if (wordCount < 800) throw new Error(`Content too short: ${wordCount} words`);

      // Insert new article
      const { data: newArticle, error: insertError } = await supabase
        .from('blog_posts')
        .insert({
          title: articleData.title,
          slug: articleData.slug || `${source.slug}-${variation_keyword.toLowerCase().replace(/\s+/g, '-')}`,
          seo_title: articleData.seo_title,
          seo_description: articleData.seo_description,
          excerpt: articleData.excerpt,
          content_md: articleData.content_md,
          content_html: contentHtml,
          tags: articleData.tags || source.tags,
          category_id: source.category_id,
          status: 'draft',
          reading_time_minutes: Math.ceil(wordCount / 200),
          pillar_page_slug: source.slug,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Record scaling
      await supabase.from('scaled_articles').insert({
        source_article_id: source_article_id,
        generated_article_id: newArticle.id,
        variation_type,
        variation_keyword,
        source_keyword: source.title,
        status: 'generated',
      });

      // Add to topic bank (best effort)
      try {
        await supabase.from('seo_topic_bank').insert({
          topic: articleData.title,
          keywords: [variation_keyword, source.title.split(' ').slice(0, 3).join(' ')],
          category: 'comercial',
          priority: 8,
        });
      } catch (_e) { /* ignore */ }

      return new Response(JSON.stringify({
        success: true,
        article_id: newArticle.id,
        title: articleData.title,
        word_count: wordCount,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get_dashboard') {
      // Decoupled queries to avoid dependency on FK constraint names
      const { data: scaled, error: scaledErr } = await supabase
        .from('scaled_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (scaledErr) {
        console.error('get_dashboard scaled_articles error:', scaledErr);
        // Return empty dashboard instead of erroring
        return new Response(JSON.stringify({
          success: true,
          dashboard: { total_scaled: 0, published: 0, by_type: {} },
          articles: [],
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const list = scaled || [];
      const ids = Array.from(new Set([
        ...list.map((s: any) => s.source_article_id).filter(Boolean),
        ...list.map((s: any) => s.generated_article_id).filter(Boolean),
      ]));

      let postsMap: Record<string, any> = {};
      if (ids.length > 0) {
        const { data: posts } = await supabase
          .from('blog_posts')
          .select('id, title, slug, status')
          .in('id', ids);
        (posts || []).forEach((p: any) => { postsMap[p.id] = p; });
      }

      const enriched = list.map((s: any) => ({
        ...s,
        source: postsMap[s.source_article_id] || null,
        generated: postsMap[s.generated_article_id] || null,
      }));

      const totalScaled = enriched.length;
      const published = enriched.filter((s: any) => s.generated?.status === 'published').length;
      const byType: Record<string, number> = {};
      enriched.forEach((s: any) => {
        byType[s.variation_type] = (byType[s.variation_type] || 0) + 1;
      });

      return new Response(JSON.stringify({
        success: true,
        dashboard: { total_scaled: totalScaled, published, by_type: byType },
        articles: enriched,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
