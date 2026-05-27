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

    const { action, article_id } = await req.json();

    if (action === 'calculate_all') {
      // Get all published articles
      const { data: articles } = await supabase
        .from('blog_posts')
        .select('id, title, slug, view_count')
        .eq('status', 'published');

      if (!articles?.length) {
        return new Response(JSON.stringify({ success: true, message: 'No articles found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const results = [];

      for (const article of articles) {
        // Count views from conversion_events
        const { count: viewCount } = await supabase
          .from('conversion_events')
          .select('*', { count: 'exact', head: true })
          .eq('article_id', article.id)
          .eq('event_type', 'article_view');

        // Count CTA clicks
        const { count: ctaClicks } = await supabase
          .from('conversion_events')
          .select('*', { count: 'exact', head: true })
          .eq('article_id', article.id)
          .eq('event_type', 'cta_click');

        // Count signups attributed to this article
        const { count: signups } = await supabase
          .from('user_attribution')
          .select('*', { count: 'exact', head: true })
          .eq('source_article_id', article.id);

        // Count paying customers - users attributed to this article who have active subscriptions
        const { data: attributedUsers } = await supabase
          .from('user_attribution')
          .select('user_id')
          .eq('source_article_id', article.id);

        let payingCustomers = 0;
        let totalRevenue = 0;

        if (attributedUsers?.length) {
          const userIds = attributedUsers.map(u => u.user_id);
          
          const { data: subscriptions } = await supabase
            .from('user_subscriptions')
            .select('user_id, valor')
            .in('user_id', userIds)
            .eq('is_active', true);

          if (subscriptions?.length) {
            payingCustomers = subscriptions.length;
            totalRevenue = subscriptions.reduce((sum: number, s: any) => sum + (s.valor || 0), 0);
          }
        }

        // Use blog_posts view_count as fallback for total views
        const totalViews = Math.max(viewCount || 0, article.view_count || 0);
        const conversionRate = totalViews > 0 ? ((payingCustomers / totalViews) * 100) : 0;
        const revenuePerVisitor = totalViews > 0 ? (totalRevenue / totalViews) : 0;

        // Classification
        let classification = 'low_performance';
        let insight = '';

        if (payingCustomers >= 3 || totalRevenue >= 200) {
          classification = 'high_revenue';
          insight = 'Este artigo gera receita consistente → escalar com conteúdos similares';
        } else if (totalViews >= 100 && payingCustomers < 2) {
          classification = 'high_traffic';
          insight = 'Alto tráfego mas pouca conversão → melhorar CTAs e funil';
        } else if (payingCustomers >= 1) {
          classification = 'medium_revenue';
          insight = 'Artigo com potencial → otimizar para aumentar conversão';
        } else if (totalViews < 50) {
          classification = 'low_performance';
          insight = 'Baixo desempenho → revisar SEO ou promover';
        } else {
          classification = 'low_performance';
          insight = 'Tráfego moderado sem conversão → necessita revisão de CTA';
        }

        // Upsert tracking data
        const { error } = await supabase
          .from('article_revenue_tracking')
          .upsert({
            article_id: article.id,
            views: totalViews,
            clicks_cta: ctaClicks || 0,
            signups: signups || 0,
            paying_customers: payingCustomers,
            revenue_generated: totalRevenue,
            conversion_rate: Number(conversionRate.toFixed(2)),
            revenue_per_visitor: Number(revenuePerVisitor.toFixed(2)),
            classification,
            insight,
            last_updated: new Date().toISOString(),
          }, { onConflict: 'article_id' });

        if (error) {
          console.error(`Error upserting article ${article.id}:`, error);
        }

        results.push({
          article_id: article.id,
          title: article.title,
          views: totalViews,
          paying_customers: payingCustomers,
          revenue: totalRevenue,
          classification,
        });
      }

      return new Response(JSON.stringify({
        success: true,
        articles_processed: results.length,
        results,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get_dashboard') {
      const { data: tracking } = await supabase
        .from('article_revenue_tracking')
        .select(`
          *,
          blog_posts!inner(title, slug, status)
        `)
        .order('revenue_generated', { ascending: false });

      const totalRevenue = tracking?.reduce((sum, t) => sum + (t.revenue_generated || 0), 0) || 0;
      const totalCustomers = tracking?.reduce((sum, t) => sum + (t.paying_customers || 0), 0) || 0;
      const totalViews = tracking?.reduce((sum, t) => sum + (t.views || 0), 0) || 0;

      const highRevenue = tracking?.filter(t => t.classification === 'high_revenue') || [];
      const highTraffic = tracking?.filter(t => t.classification === 'high_traffic') || [];
      const lowPerformance = tracking?.filter(t => t.classification === 'low_performance') || [];

      return new Response(JSON.stringify({
        success: true,
        dashboard: {
          total_revenue: totalRevenue,
          total_customers: totalCustomers,
          total_views: totalViews,
          avg_conversion: totalViews > 0 ? ((totalCustomers / totalViews) * 100).toFixed(2) : '0',
          high_revenue_count: highRevenue.length,
          high_traffic_count: highTraffic.length,
          low_performance_count: lowPerformance.length,
        },
        articles: tracking || [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'track_event') {
      const { event_type, session_id, user_id, metadata, revenue_value } = await req.json();
      
      const { error } = await supabase.from('conversion_events').insert({
        event_type,
        article_id: article_id || null,
        session_id,
        user_id: user_id || null,
        metadata: metadata || {},
        revenue_value: revenue_value || 0,
      });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
