import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { action, article_id, keyword, keywords } = await req.json();

    // ACTION: add_keywords - Associate keywords to an article
    if (action === 'add_keywords') {
      const inserts = keywords.map((kw: { keyword: string; is_primary: boolean }) => ({
        article_id,
        keyword: kw.keyword.toLowerCase().trim(),
        is_primary: kw.is_primary || false,
      }));

      const { error } = await supabase
        .from('article_keywords')
        .upsert(inserts, { onConflict: 'article_id,keyword' });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ACTION: check_ranking - Check Google ranking for a keyword
    if (action === 'check_ranking') {
      const site = 'xlata.site';
      const results = [];

      // Get keywords to check
      let keywordsToCheck: { article_id: string; keyword: string }[] = [];

      if (keyword && article_id) {
        keywordsToCheck = [{ article_id, keyword }];
      } else {
        // Get all keywords, prioritize primary ones
        const { data: allKeywords } = await supabase
          .from('article_keywords')
          .select('article_id, keyword, is_primary')
          .order('is_primary', { ascending: false });

        keywordsToCheck = allKeywords || [];
      }

      for (const kw of keywordsToCheck) {
        try {
          // Get previous position for this keyword
          const { data: lastRanking } = await supabase
            .from('ranking_tracking')
            .select('position')
            .eq('article_id', kw.article_id)
            .eq('keyword', kw.keyword)
            .order('checked_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const previousPosition = lastRanking?.position || null;

          // Use Google Custom Search API if available
          const googleApiKey = Deno.env.get('GOOGLE_SEARCH_API_KEY');
          const searchEngineId = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID');

          let position: number | null = null;
          let foundUrl: string | null = null;

          if (googleApiKey && searchEngineId) {
            // Real Google Custom Search API
            for (let start = 1; start <= 50; start += 10) {
              const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(kw.keyword)}&start=${start}&num=10`;
              
              const response = await fetch(searchUrl);
              const data = await response.json();

              if (data.items) {
                for (let i = 0; i < data.items.length; i++) {
                  const link = data.items[i].link || '';
                  if (link.includes(site)) {
                    position = start + i;
                    foundUrl = link;
                    break;
                  }
                }
              }
              if (position !== null) break;

              // Rate limit: wait 1s between requests
              await new Promise(r => setTimeout(r, 1000));
            }
          } else {
            // Manual/simulated mode - position stays null (user can input manually)
            console.log(`No Google API configured. Keyword "${kw.keyword}" set to manual mode.`);
          }

          // Insert tracking record
          const { error: insertError } = await supabase
            .from('ranking_tracking')
            .insert({
              article_id: kw.article_id,
              keyword: kw.keyword,
              position,
              url: foundUrl,
              device: 'desktop',
              previous_position: previousPosition,
            });

          if (insertError) {
            console.error('Insert error:', insertError);
          }

          // Generate alerts
          if (position !== null && previousPosition !== null) {
            const change = previousPosition - position;

            // Entered top 10
            if (previousPosition > 10 && position <= 10) {
              await supabase.from('ranking_alerts').insert({
                article_id: kw.article_id,
                keyword: kw.keyword,
                alert_type: 'entered_top10',
                old_position: previousPosition,
                new_position: position,
                message: `🎉 "${kw.keyword}" entrou no TOP 10! Posição #${position} (era #${previousPosition})`,
              });
            }

            // Dropped significantly (lost 10+ positions)
            if (change < -10) {
              await supabase.from('ranking_alerts').insert({
                article_id: kw.article_id,
                keyword: kw.keyword,
                alert_type: 'dropped',
                old_position: previousPosition,
                new_position: position,
                message: `⚠️ "${kw.keyword}" caiu de #${previousPosition} para #${position} (-${Math.abs(change)} posições)`,
              });
            }
          }

          // Lost ranking (was ranked, now not found)
          if (previousPosition !== null && position === null) {
            await supabase.from('ranking_alerts').insert({
              article_id: kw.article_id,
              keyword: kw.keyword,
              alert_type: 'lost_ranking',
              old_position: previousPosition,
              new_position: null,
              message: `🔴 "${kw.keyword}" saiu do ranking! Era #${previousPosition}`,
            });
          }

          // Opportunity (position > 20)
          if (position !== null && position > 20) {
            await supabase.from('ranking_alerts').insert({
              article_id: kw.article_id,
              keyword: kw.keyword,
              alert_type: 'opportunity',
              old_position: previousPosition,
              new_position: position,
              message: `💡 "${kw.keyword}" está na posição #${position} - oportunidade de melhoria`,
            });
          }

          results.push({
            keyword: kw.keyword,
            position,
            previousPosition,
            change: position && previousPosition ? previousPosition - position : null,
            url: foundUrl,
          });

        } catch (kwError) {
          console.error(`Error checking keyword "${kw.keyword}":`, kwError);
          results.push({ keyword: kw.keyword, error: kwError.message });
        }
      }

      return new Response(JSON.stringify({ success: true, results, total: results.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: manual_update - Manually input position
    if (action === 'manual_update') {
      const { position, device } = await req.json().catch(() => ({}));

      const { data: lastRanking } = await supabase
        .from('ranking_tracking')
        .select('position')
        .eq('article_id', article_id)
        .eq('keyword', keyword)
        .order('checked_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { error } = await supabase
        .from('ranking_tracking')
        .insert({
          article_id,
          keyword,
          position,
          device: device || 'desktop',
          previous_position: lastRanking?.position || null,
        });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ACTION: get_dashboard - Get ranking dashboard data
    if (action === 'get_dashboard') {
      // Top keywords (best positions)
      const { data: topKeywords } = await supabase
        .from('ranking_tracking')
        .select('keyword, position, article_id, checked_at')
        .not('position', 'is', null)
        .order('checked_at', { ascending: false })
        .limit(200);

      // Get latest position per keyword
      const latestByKeyword = new Map();
      (topKeywords || []).forEach(r => {
        if (!latestByKeyword.has(r.keyword)) {
          latestByKeyword.set(r.keyword, r);
        }
      });

      const latestPositions = Array.from(latestByKeyword.values());
      const top10 = latestPositions.filter(r => r.position <= 10).sort((a, b) => a.position - b.position);
      const opportunities = latestPositions.filter(r => r.position > 20).sort((a, b) => a.position - b.position);
      const outside50 = latestPositions.filter(r => r.position > 50);

      // Unread alerts
      const { data: alerts } = await supabase
        .from('ranking_alerts')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20);

      // Total keywords tracked
      const { count: totalKeywords } = await supabase
        .from('article_keywords')
        .select('*', { count: 'exact', head: true });

      return new Response(JSON.stringify({
        top10,
        opportunities,
        outside50,
        alerts: alerts || [],
        totalKeywords: totalKeywords || 0,
        totalTracked: latestPositions.length,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
