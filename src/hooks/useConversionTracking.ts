import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ATTRIBUTION_KEY = 'xlata_attribution';

interface AttributionData {
  articleId?: string;
  articleSlug?: string;
  sourceUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  referrer?: string;
  firstPage?: string;
  timestamp?: number;
}

// Capture attribution on first visit
export const captureAttribution = () => {
  try {
    const existing = localStorage.getItem(ATTRIBUTION_KEY);
    if (existing) return;

    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    const blogMatch = path.match(/^\/blog\/(.+)/);
    
    const data: AttributionData = {
      articleSlug: blogMatch?.[1] || undefined,
      sourceUrl: window.location.href,
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
      utmContent: params.get('utm_content') || undefined,
      referrer: document.referrer || undefined,
      firstPage: path,
      timestamp: Date.now(),
    };

    localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(data));
  } catch {
    // Silently fail
  }
};

// Save attribution to DB when user signs up
export const saveUserAttribution = async (userId: string) => {
  try {
    const raw = localStorage.getItem(ATTRIBUTION_KEY);
    if (!raw) return;

    const data: AttributionData = JSON.parse(raw);
    
    let articleId: string | null = null;
    if (data.articleSlug) {
      const { data: article } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', data.articleSlug)
        .maybeSingle();
      articleId = article?.id || null;
    }

    // Use edge function to save (bypasses type issues with new tables)
    await supabase.functions.invoke('calculate-article-revenue', {
      body: {
        action: 'track_event',
        event_type: 'signup',
        article_id: articleId,
        user_id: userId,
        metadata: {
          utm_source: data.utmSource,
          utm_medium: data.utmMedium,
          utm_campaign: data.utmCampaign,
          referrer: data.referrer,
        },
      },
    });
  } catch (err) {
    console.error('Attribution save error:', err);
  }
};

// Track article view
export const trackArticleView = async (articleId: string) => {
  try {
    const sessionId = sessionStorage.getItem('xlata_session') || crypto.randomUUID();
    sessionStorage.setItem('xlata_session', sessionId);

    await supabase.functions.invoke('calculate-article-revenue', {
      body: {
        action: 'track_event',
        event_type: 'article_view',
        article_id: articleId,
        session_id: sessionId,
      },
    });
  } catch {
    // Silently fail
  }
};

// Track CTA click
export const trackCtaClick = async (articleId?: string, ctaLabel?: string) => {
  try {
    const sessionId = sessionStorage.getItem('xlata_session') || crypto.randomUUID();
    
    await supabase.functions.invoke('calculate-article-revenue', {
      body: {
        action: 'track_event',
        event_type: 'cta_click',
        article_id: articleId || null,
        session_id: sessionId,
        metadata: { cta_label: ctaLabel },
      },
    });
  } catch {
    // Silently fail
  }
};

export const useConversionTracking = () => {
  useEffect(() => {
    captureAttribution();
  }, []);

  return {
    trackArticleView,
    trackCtaClick,
    saveUserAttribution,
  };
};
