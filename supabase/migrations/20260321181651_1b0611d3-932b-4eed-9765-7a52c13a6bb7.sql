
-- Subscription Tiers table
CREATE TABLE public.subscription_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tier Features mapping table
CREATE TABLE public.tier_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id uuid REFERENCES public.subscription_tiers(id) ON DELETE CASCADE NOT NULL,
  feature_key text NOT NULL,
  feature_label text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tier_id, feature_key)
);

-- Add tier column to user_subscriptions
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS tier text DEFAULT 'pro';

-- Enable RLS
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_features ENABLE ROW LEVEL SECURITY;

-- RLS: Everyone can read tiers and features (public pricing info)
CREATE POLICY "Anyone can read subscription tiers" ON public.subscription_tiers FOR SELECT USING (true);
CREATE POLICY "Anyone can read tier features" ON public.tier_features FOR SELECT USING (true);

-- RLS: Only admins can modify
CREATE POLICY "Admins can manage tiers" ON public.subscription_tiers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can manage tier features" ON public.tier_features FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Updated_at trigger
CREATE TRIGGER update_subscription_tiers_updated_at BEFORE UPDATE ON public.subscription_tiers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the 3 tiers
INSERT INTO public.subscription_tiers (name, display_name, description, sort_order) VALUES
  ('essencial', 'Essencial', 'PDV manual, compras, despesas e histórico básico', 1),
  ('controle', 'Controle', 'Tudo do Essencial + estoque, custos e relatórios básicos', 2),
  ('pro', 'Pro', 'Tudo do Controle + dashboard avançado, projeções e exportação', 3);

-- Insert features for ESSENCIAL
INSERT INTO public.tier_features (tier_id, feature_key, feature_label)
SELECT id, unnest(ARRAY['pdv_access', 'register_purchases', 'register_expenses', 'basic_history']),
       unnest(ARRAY['PDV (vendas manuais)', 'Registrar compras', 'Registrar despesas', 'Histórico básico'])
FROM public.subscription_tiers WHERE name = 'essencial';

-- Insert features for CONTROLE (includes essencial + extras)
INSERT INTO public.tier_features (tier_id, feature_key, feature_label)
SELECT id, unnest(ARRAY['pdv_access', 'register_purchases', 'register_expenses', 'basic_history', 'stock_control', 'cost_tracking', 'basic_reports', 'profit_per_sale']),
       unnest(ARRAY['PDV (vendas manuais)', 'Registrar compras', 'Registrar despesas', 'Histórico básico', 'Controle de estoque', 'Rastreamento de custos', 'Relatórios básicos', 'Lucro por venda'])
FROM public.subscription_tiers WHERE name = 'controle';

-- Insert features for PRO (includes controle + extras)
INSERT INTO public.tier_features (tier_id, feature_key, feature_label)
SELECT id, unnest(ARRAY['pdv_access', 'register_purchases', 'register_expenses', 'basic_history', 'stock_control', 'cost_tracking', 'basic_reports', 'profit_per_sale', 'advanced_dashboard', 'profit_projections', 'advanced_analytics', 'export_csv_excel']),
       unnest(ARRAY['PDV (vendas manuais)', 'Registrar compras', 'Registrar despesas', 'Histórico básico', 'Controle de estoque', 'Rastreamento de custos', 'Relatórios básicos', 'Lucro por venda', 'Dashboard avançado', 'Projeções de lucro', 'Analytics avançado', 'Exportar CSV/Excel'])
FROM public.subscription_tiers WHERE name = 'pro';
