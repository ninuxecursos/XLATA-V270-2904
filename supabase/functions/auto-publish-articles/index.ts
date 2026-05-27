import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { marked } from "https://esm.sh/marked@9.1.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIN_HTML_LENGTH = 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[auto-publish] Starting...");

    const { data: config } = await supabase
      .from("ai_automation_config")
      .select("automation_enabled")
      .single();

    if (!config?.automation_enabled) {
      return new Response(
        JSON.stringify({ message: "Automação desativada", published: 0, blocked: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date().toISOString();

    // ═══ PHASE 1: Fix broken published articles (content_html missing) ═══
    const { data: brokenPublished } = await supabase
      .from("blog_posts")
      .select("id, title, content_md")
      .eq("status", "published")
      .not("content_md", "is", null)
      .or("content_html.is.null,content_html.eq.");

    let fixed = 0;
    if (brokenPublished && brokenPublished.length > 0) {
      for (const art of brokenPublished) {
        if (art.content_md) {
          const html = await marked(art.content_md);
          await supabase.from("blog_posts").update({ content_html: html }).eq("id", art.id);
          fixed++;
          console.log(`[auto-publish] Fixed HTML for published article: "${art.title}"`);
        }
      }
    }

    // ═══ PHASE 2: Pre-validate & publish scheduled drafts ═══
    const { data: articlesToPublish } = await supabase
      .from("blog_posts")
      .select("id, title, slug, published_at, content_html, content_md, seo_title, seo_description")
      .eq("status", "draft")
      .not("published_at", "is", null)
      .lte("published_at", now);

    if (!articlesToPublish || articlesToPublish.length === 0) {
      console.log("[auto-publish] No articles to publish");
      return new Response(
        JSON.stringify({ message: "Nenhum artigo para publicar", published: 0, blocked: 0, fixed }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const published: { id: string; title: string; slug: string }[] = [];
    const blocked: { id: string; title: string; reason: string }[] = [];

    for (const art of articlesToPublish) {
      let htmlContent = art.content_html;

      // Auto-fix: if has MD but no HTML, convert
      if ((!htmlContent || htmlContent.length < MIN_HTML_LENGTH) && art.content_md) {
        htmlContent = await marked(art.content_md);
        await supabase.from("blog_posts").update({ content_html: htmlContent }).eq("id", art.id);
        console.log(`[auto-publish] Auto-converted MD→HTML for: "${art.title}"`);
      }

      // Validation checks
      const checks = {
        hasContent: htmlContent && htmlContent.length >= MIN_HTML_LENGTH,
        hasTitle: art.title && art.title.length >= 10,
        hasSeoTitle: art.seo_title && art.seo_title.length > 0,
        hasSeoDesc: art.seo_description && art.seo_description.length > 0,
      };

      const allValid = checks.hasContent && checks.hasTitle && checks.hasSeoTitle && checks.hasSeoDesc;

      if (allValid) {
        published.push({ id: art.id, title: art.title, slug: art.slug });
      } else {
        const reasons: string[] = [];
        if (!checks.hasContent) reasons.push("Conteúdo HTML vazio ou muito curto");
        if (!checks.hasTitle) reasons.push("Título ausente");
        if (!checks.hasSeoTitle) reasons.push("SEO Title ausente");
        if (!checks.hasSeoDesc) reasons.push("Meta Description ausente");
        
        blocked.push({ id: art.id, title: art.title, reason: reasons.join("; ") });
        console.warn(`[auto-publish] ❌ BLOCKED: "${art.title}" — ${reasons.join("; ")}`);

        // Send admin alert
        try {
          const { data: admins } = await supabase
            .from("admin_user_roles")
            .select("user_id")
            .eq("role", "admin_master")
            .limit(1);

          if (admins?.[0]) {
            await supabase.from("user_direct_messages").insert({
              sender_id: admins[0].user_id,
              sender_name: "Auto-Publish",
              recipient_id: admins[0].user_id,
              title: "⚠️ Artigo bloqueado na publicação",
              message: `O artigo "${art.title}" não passou na validação: ${reasons.join("; ")}. Ele permanece como rascunho.`,
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            }).catch(() => {});
          }
        } catch (_e) { /* ignore */ }
      }
    }

    // Batch update valid articles
    if (published.length > 0) {
      const ids = published.map((a) => a.id);
      await supabase.from("blog_posts").update({ status: "published" }).in("id", ids);
      console.log(`[auto-publish] ✅ Published ${published.length} articles`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${published.length} publicado(s), ${blocked.length} bloqueado(s), ${fixed} corrigido(s)`,
        published: published.length,
        blocked: blocked.length,
        fixed,
        articles: published,
        blockedArticles: blocked,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[auto-publish] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        published: 0,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
