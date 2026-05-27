import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_DOMAIN = 'xlata.site';
const SITE_BASE = `https://${SITE_DOMAIN}`;

// Main pages to track
const MAIN_PAGES = [
  '/', '/cadastro', '/login', '/planos',
  '/sistema-para-ferro-velho', '/blog',
  '/glossario', '/ajuda', '/guia',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action } = await req.json();

    // ACTION: sync_urls - Collect all URLs from the site
    if (action === 'sync_urls') {
      const urls: { url: string; page_type: string; article_id?: string; priority: string }[] = [];

      // Main pages
      for (const page of MAIN_PAGES) {
        urls.push({ url: `${SITE_BASE}${page}`, page_type: 'page', priority: 'high' });
      }

      // Blog articles
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('id, slug, published_at, is_featured')
        .eq('status', 'published');

      for (const post of posts || []) {
        urls.push({
          url: `${SITE_BASE}/blog/${post.slug}`,
          page_type: 'blog',
          article_id: post.id,
          priority: post.is_featured ? 'high' : 'normal',
        });
      }

      // Glossary terms
      const { data: terms } = await supabase
        .from('glossary_terms')
        .select('slug')
        .eq('status', 'published');

      for (const term of terms || []) {
        urls.push({
          url: `${SITE_BASE}/glossario/${term.slug}`,
          page_type: 'page',
          priority: 'low',
        });
      }

      // Help articles
      const { data: helpArticles } = await supabase
        .from('help_articles')
        .select('slug')
        .eq('status', 'published');

      for (const ha of helpArticles || []) {
        urls.push({
          url: `${SITE_BASE}/ajuda/${ha.slug}`,
          page_type: 'page',
          priority: 'low',
        });
      }

      // Pillar pages
      const { data: pillars } = await supabase
        .from('pillar_pages')
        .select('slug')
        .eq('status', 'published');

      for (const p of pillars || []) {
        urls.push({
          url: `${SITE_BASE}/solucoes/${p.slug}`,
          page_type: 'page',
          priority: 'high',
        });
      }

      // Upsert all URLs
      let synced = 0;
      for (const item of urls) {
        const { error } = await supabase
          .from('index_tracking')
          .upsert({
            url: item.url,
            page_type: item.page_type,
            priority: item.priority,
            article_id: item.article_id || null,
          }, { onConflict: 'url' });

        if (!error) synced++;
      }

      return new Response(JSON.stringify({ success: true, synced, total: urls.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: check_indexation - Check if URLs are indexed
    if (action === 'check_indexation') {
      const googleApiKey = Deno.env.get('GOOGLE_SEARCH_API_KEY');
      const searchEngineId = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID');

      // Get URLs to check, prioritize high priority and unchecked
      const { data: urlsToCheck } = await supabase
        .from('index_tracking')
        .select('*')
        .order('last_checked', { ascending: true, nullsFirst: true })
        .limit(20); // Max 20 per run to respect API limits

      const results = [];

      for (const item of urlsToCheck || []) {
        let isIndexed: boolean | null = null;

        if (googleApiKey && searchEngineId) {
          try {
            // Use site: operator to check if specific URL is indexed
            const query = `site:${item.url.replace(SITE_BASE, SITE_DOMAIN)}`;
            const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=1`;

            const response = await fetch(searchUrl);
            const data = await response.json();

            if (data.searchInformation) {
              const totalResults = parseInt(data.searchInformation.totalResults || '0');
              isIndexed = totalResults > 0;
            }

            // Rate limit
            await new Promise(r => setTimeout(r, 1200));
          } catch (err) {
            console.error(`Error checking ${item.url}:`, err);
          }
        }

        const now = new Date().toISOString();
        const previousStatus = item.status;
        const newStatus = isIndexed === true ? 'indexed' : isIndexed === false ? 'not_indexed' : 'unknown';

        // Calculate days without index
        let daysWithoutIndex = item.days_without_index || 0;
        if (newStatus === 'not_indexed') {
          const firstDetected = new Date(item.first_detected);
          daysWithoutIndex = Math.floor((Date.now() - firstDetected.getTime()) / (1000 * 60 * 60 * 24));
        } else if (newStatus === 'indexed') {
          daysWithoutIndex = 0;
        }

        const needsAction = newStatus === 'not_indexed' && daysWithoutIndex >= 3;

        // Update tracking
        await supabase
          .from('index_tracking')
          .update({
            status: newStatus,
            last_checked: now,
            last_indexed_at: newStatus === 'indexed' ? now : item.last_indexed_at,
            check_attempts: (item.check_attempts || 0) + 1,
            days_without_index: daysWithoutIndex,
            needs_action: needsAction,
          })
          .eq('id', item.id);

        // Generate alerts
        if (previousStatus === 'indexed' && newStatus === 'not_indexed') {
          await supabase.from('index_alerts').insert({
            url: item.url,
            alert_type: 'lost_index',
            message: `🔴 Página perdeu indexação: ${item.url}`,
          });
        }

        if (previousStatus !== 'indexed' && newStatus === 'indexed') {
          await supabase.from('index_alerts').insert({
            url: item.url,
            alert_type: 'newly_indexed',
            message: `✅ Página indexada com sucesso: ${item.url}`,
          });
        }

        if (newStatus === 'not_indexed' && daysWithoutIndex >= 7 && daysWithoutIndex < 8) {
          await supabase.from('index_alerts').insert({
            url: item.url,
            alert_type: 'not_indexed_7d',
            message: `⚠️ Página não indexada há 7+ dias: ${item.url}`,
          });
        } else if (newStatus === 'not_indexed' && daysWithoutIndex >= 3 && daysWithoutIndex < 4) {
          await supabase.from('index_alerts').insert({
            url: item.url,
            alert_type: 'not_indexed_3d',
            message: `⚠️ Página não indexada há 3+ dias: ${item.url}`,
          });
        }

        results.push({ url: item.url, status: newStatus, daysWithoutIndex });
      }

      return new Response(JSON.stringify({ success: true, checked: results.length, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: get_dashboard - Get indexation dashboard
    if (action === 'get_dashboard') {
      const { data: allUrls } = await supabase
        .from('index_tracking')
        .select('*')
        .order('status', { ascending: true });

      const total = allUrls?.length || 0;
      const indexed = allUrls?.filter(u => u.status === 'indexed').length || 0;
      const notIndexed = allUrls?.filter(u => u.status === 'not_indexed').length || 0;
      const unknown = allUrls?.filter(u => u.status === 'unknown').length || 0;
      const needsAction = allUrls?.filter(u => u.needs_action).length || 0;
      const rate = total > 0 ? ((indexed / total) * 100).toFixed(1) : '0';

      const { data: alerts } = await supabase
        .from('index_alerts')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20);

      // Group by page_type
      const byType: Record<string, { total: number; indexed: number }> = {};
      for (const u of allUrls || []) {
        const t = u.page_type || 'page';
        if (!byType[t]) byType[t] = { total: 0, indexed: 0 };
        byType[t].total++;
        if (u.status === 'indexed') byType[t].indexed++;
      }

      return new Response(JSON.stringify({
        total, indexed, notIndexed, unknown, needsAction, rate,
        alerts: alerts || [],
        byType,
        problemUrls: (allUrls || []).filter(u => u.needs_action).slice(0, 20),
        urls: allUrls || [],
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ACTION: manual_update - Manually set indexation status
    if (action === 'manual_update') {
      const { url, status } = await req.json();
      const { error } = await supabase
        .from('index_tracking')
        .update({
          status,
          last_checked: new Date().toISOString(),
          last_indexed_at: status === 'indexed' ? new Date().toISOString() : undefined,
          needs_action: status === 'not_indexed',
        })
        .eq('url', url);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
