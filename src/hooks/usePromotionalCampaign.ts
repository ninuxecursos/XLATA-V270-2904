import { useEffect, useState, useCallback, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from './useAuth';

export interface PromotionalCampaign {
  id: string;
  title: string;
  headline: string;
  description: string;
  benefit_text: string | null;
  cta_text: string;
  base_plan_id: string;
  original_price: number;
  promo_price: number;
  promo_period_days: number;
  promo_period_label: string;
  starts_at: string;
  ends_at: string;
  target_audience: 'all' | 'expired' | 'trial' | 'essencial' | 'no_subscription';
  is_active: boolean;
  max_displays_per_user: number;
}

// Mostrar a cada nova "sessão de página" (navegação/refresh), até o usuário dispensar permanentemente.
// Pequeno cooldown para evitar reabrir em re-renders dentro da mesma sessão.
const MIN_INTERVAL_BETWEEN_VIEWS_MS = 30 * 1000; // 30s

const isPdvRoute = (pathname: string) =>
  pathname.startsWith('/pdv') || pathname.includes('/pdv/');

const isPublicRoute = (pathname: string) => {
  const publicPrefixes = ['/login', '/register', '/landing', '/reset-password', '/termos', '/blog', '/glossario', '/ajuda', '/loja', '/shop'];
  return publicPrefixes.some(p => pathname.startsWith(p));
};

async function classifyAudience(userId: string): Promise<'expired' | 'trial' | 'essencial' | 'pro' | 'no_subscription'> {
  const { data } = await supabase
    .from('user_subscriptions')
    .select('is_active, expires_at, plan_type, tier')
    .eq('user_id', userId)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return 'no_subscription';
  const expired = !data.is_active || (data.expires_at && new Date(data.expires_at) < new Date());
  if (expired) return 'expired';
  if (data.plan_type === 'trial') return 'trial';
  if ((data.tier || '').toLowerCase() === 'essencial') return 'essencial';
  return 'pro';
}

export function usePromotionalCampaign() {
  const auth = useContext(AuthContext);
  const user = auth?.user ?? null;
  const location = useLocation();
  const [campaign, setCampaign] = useState<PromotionalCampaign | null>(null);
  const [open, setOpen] = useState(false);

  const fetchAndDecide = useCallback(async () => {
    if (!user) return;
    if (isPdvRoute(location.pathname)) return;
    if (isPublicRoute(location.pathname)) return;

    try {
      // Buscar campanha ativa mais recente dentro da janela
      const nowIso = new Date().toISOString();
      const { data: campaigns, error } = await supabase
        .from('promotional_campaigns')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', nowIso)
        .gte('ends_at', nowIso)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error || !campaigns || campaigns.length === 0) return;

      const audience = await classifyAudience(user.id);

      // Selecionar primeira campanha cujo target case
      const eligible = campaigns.find((c: any) => {
        if (c.target_audience === 'all') return true;
        if (c.target_audience === audience) return true;
        return false;
      }) as PromotionalCampaign | undefined;

      if (!eligible) return;

      // Verificar registro de exibições
      const { data: viewRow } = await supabase
        .from('promotional_campaign_views')
        .select('*')
        .eq('campaign_id', eligible.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (viewRow) {
        if (viewRow.dismissed) return; // "Não mostrar mais" — bloqueio definitivo
        if (viewRow.converted) return;
        // Cooldown curto contra reabertura em re-renders/efeitos múltiplos da mesma sessão
        if (viewRow.last_shown_at) {
          const last = new Date(viewRow.last_shown_at).getTime();
          if (Date.now() - last < MIN_INTERVAL_BETWEEN_VIEWS_MS) return;
        }
      }

      // Registrar exibição
      if (viewRow) {
        await supabase
          .from('promotional_campaign_views')
          .update({
            view_count: (viewRow.view_count || 0) + 1,
            last_shown_at: new Date().toISOString(),
          })
          .eq('id', viewRow.id);
      } else {
        await supabase
          .from('promotional_campaign_views')
          .insert({
            campaign_id: eligible.id,
            user_id: user.id,
            view_count: 1,
            last_shown_at: new Date().toISOString(),
          });
      }

      setCampaign(eligible);
      setOpen(true);
    } catch (err) {
      console.error('[promo-campaign] erro:', err);
    }
  }, [user, location.pathname]);

  useEffect(() => {
    if (!user) return;
    // Debounce inicial para não atropelar outros bootstrap effects
    const t = setTimeout(fetchAndDecide, 4000);
    return () => clearTimeout(t);
  }, [user, fetchAndDecide]);

  const dismiss = useCallback(async (permanent = false) => {
    setOpen(false);
    if (!user || !campaign) return;
    if (permanent) {
      await supabase
        .from('promotional_campaign_views')
        .update({ dismissed: true })
        .eq('campaign_id', campaign.id)
        .eq('user_id', user.id);
    }
  }, [user, campaign]);

  const close = useCallback(() => setOpen(false), []);

  return { campaign, open, dismiss, close };
}
