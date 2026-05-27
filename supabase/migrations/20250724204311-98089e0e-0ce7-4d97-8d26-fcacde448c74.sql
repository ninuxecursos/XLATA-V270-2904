-- Criar tabela para gerenciar planos públicos
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  period TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  is_popular BOOLEAN DEFAULT false,
  is_promotional BOOLEAN DEFAULT false,
  promotional_price NUMERIC,
  promotional_period TEXT,
  promotional_description TEXT,
  savings TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only admins can manage plans" 
ON public.subscription_plans 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Insert default plans
INSERT INTO public.subscription_plans (plan_id, name, price, period, description, amount, is_popular, savings, display_order) VALUES
('promocional', 'Plano Promocional', 97.90, '/mês nos 3 primeiros meses', 'Oferta especial limitada', 97.90, false, 'Depois R$ 147,90/mês', 1),
('mensal', 'Plano Mensal', 147.90, '/mês', 'Ideal para começar', 147.90, false, null, 2),
('trimestral', 'Plano Trimestral', 387.90, '/3 meses', 'Melhor custo-benefício', 387.90, true, 'Economize R$ 56,80', 3),
('trienal', 'Plano Trienal', 4497.90, '/3 anos', 'Máxima economia', 4497.90, false, 'Economize R$ 884,50', 4);

-- Update the promotional plan
UPDATE public.subscription_plans 
SET 
  is_promotional = true,
  promotional_price = 97.90,
  promotional_period = '/mês nos 3 primeiros meses',
  promotional_description = 'Depois R$ 147,90/mês'
WHERE plan_id = 'promocional';

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_plans_updated_at();