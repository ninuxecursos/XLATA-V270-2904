
-- Tabela principal de campanhas promocionais
CREATE TABLE public.promotional_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  headline TEXT NOT NULL,
  description TEXT NOT NULL,
  benefit_text TEXT,
  cta_text TEXT NOT NULL DEFAULT 'Pagar com PIX agora',
  base_plan_id TEXT NOT NULL,
  original_price NUMERIC(10,2) NOT NULL,
  promo_price NUMERIC(10,2) NOT NULL,
  promo_period_days INTEGER NOT NULL,
  promo_period_label TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all','expired','trial','essencial','no_subscription')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_displays_per_user INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_promo_campaigns_active ON public.promotional_campaigns (is_active, starts_at, ends_at);

ALTER TABLE public.promotional_campaigns ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados visualizam campanhas ativas e dentro da janela
CREATE POLICY "Authenticated users can view active campaigns"
ON public.promotional_campaigns
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND now() BETWEEN starts_at AND ends_at
);

-- Admins visualizam tudo
CREATE POLICY "Admins can view all campaigns"
ON public.promotional_campaigns
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert campaigns"
ON public.promotional_campaigns
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update campaigns"
ON public.promotional_campaigns
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete campaigns"
ON public.promotional_campaigns
FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE TRIGGER trg_promotional_campaigns_updated_at
BEFORE UPDATE ON public.promotional_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de views por usuário
CREATE TABLE public.promotional_campaign_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.promotional_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  last_shown_at TIMESTAMPTZ,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  converted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, user_id)
);

CREATE INDEX idx_promo_views_user ON public.promotional_campaign_views (user_id, campaign_id);

ALTER TABLE public.promotional_campaign_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own campaign views"
ON public.promotional_campaign_views
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users insert own campaign views"
ON public.promotional_campaign_views
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own campaign views"
ON public.promotional_campaign_views
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE TRIGGER trg_promotional_campaign_views_updated_at
BEFORE UPDATE ON public.promotional_campaign_views
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campaign_id em mercado_pago_payments
ALTER TABLE public.mercado_pago_payments
ADD COLUMN IF NOT EXISTS campaign_id UUID NULL REFERENCES public.promotional_campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mp_payments_campaign ON public.mercado_pago_payments (campaign_id);
