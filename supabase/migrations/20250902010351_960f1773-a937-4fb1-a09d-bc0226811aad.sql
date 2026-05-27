-- Criar tabela de clientes da campanha
CREATE TABLE public.campaign_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Criar tabela de materiais da campanha
CREATE TABLE public.campaign_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  price_per_kg NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de entregas da campanha
CREATE TABLE public.campaign_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  material_id UUID NOT NULL,
  weight_kg NUMERIC NOT NULL,
  price_per_kg NUMERIC NOT NULL,
  total_value NUMERIC NOT NULL,
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de períodos da campanha
CREATE TABLE public.campaign_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_accumulated NUMERIC NOT NULL DEFAULT 0,
  final_value NUMERIC NOT NULL DEFAULT 0,
  account_value NUMERIC,
  discount_percentage NUMERIC,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de comprovantes da campanha
CREATE TABLE public.campaign_vouchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  period_id UUID NOT NULL,
  voucher_data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.campaign_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_vouchers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para campaign_clients
CREATE POLICY "Users can manage their own campaign clients" 
ON public.campaign_clients 
FOR ALL 
USING (auth.uid() = user_id);

-- Políticas RLS para campaign_materials
CREATE POLICY "Users can manage their own campaign materials" 
ON public.campaign_materials 
FOR ALL 
USING (auth.uid() = user_id);

-- Políticas RLS para campaign_deliveries
CREATE POLICY "Users can manage their own campaign deliveries" 
ON public.campaign_deliveries 
FOR ALL 
USING (auth.uid() = user_id);

-- Políticas RLS para campaign_periods
CREATE POLICY "Users can manage their own campaign periods" 
ON public.campaign_periods 
FOR ALL 
USING (auth.uid() = user_id);

-- Políticas RLS para campaign_vouchers
CREATE POLICY "Users can manage their own campaign vouchers" 
ON public.campaign_vouchers 
FOR ALL 
USING (auth.uid() = user_id);

-- Criar índices para performance
CREATE INDEX idx_campaign_clients_user_id ON public.campaign_clients(user_id);
CREATE INDEX idx_campaign_materials_user_id ON public.campaign_materials(user_id);
CREATE INDEX idx_campaign_deliveries_user_id ON public.campaign_deliveries(user_id);
CREATE INDEX idx_campaign_deliveries_client_id ON public.campaign_deliveries(client_id);
CREATE INDEX idx_campaign_deliveries_period_id ON public.campaign_deliveries(period_id);
CREATE INDEX idx_campaign_periods_user_id ON public.campaign_periods(user_id);
CREATE INDEX idx_campaign_periods_client_id ON public.campaign_periods(client_id);
CREATE INDEX idx_campaign_vouchers_user_id ON public.campaign_vouchers(user_id);

-- Criar triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_campaign_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_clients_updated_at
  BEFORE UPDATE ON public.campaign_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_campaign_updated_at();

CREATE TRIGGER update_campaign_materials_updated_at
  BEFORE UPDATE ON public.campaign_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_campaign_updated_at();

CREATE TRIGGER update_campaign_deliveries_updated_at
  BEFORE UPDATE ON public.campaign_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_campaign_updated_at();

CREATE TRIGGER update_campaign_periods_updated_at
  BEFORE UPDATE ON public.campaign_periods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_campaign_updated_at();

-- Inserir materiais padrão da campanha
INSERT INTO public.campaign_materials (user_id, name, price_per_kg) VALUES
  ('00000000-0000-0000-0000-000000000000', 'PET', 2.50),
  ('00000000-0000-0000-0000-000000000000', 'Alumínio', 8.00),
  ('00000000-0000-0000-0000-000000000000', 'Papelão', 0.80),
  ('00000000-0000-0000-0000-000000000000', 'Ferro', 1.20),
  ('00000000-0000-0000-0000-000000000000', 'Cobre', 25.00),
  ('00000000-0000-0000-0000-000000000000', 'Vidro', 0.30);