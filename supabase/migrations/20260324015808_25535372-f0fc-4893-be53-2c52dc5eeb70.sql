
CREATE TABLE IF NOT EXISTS public.visitor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  profile_type text DEFAULT 'curious',
  source text,
  referrer text,
  entry_keyword text,
  entry_page text,
  device text,
  city text,
  time_on_site integer DEFAULT 0,
  pages_viewed integer DEFAULT 0,
  cta_clicks integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.visitor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert visitor_profiles"
  ON public.visitor_profiles FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins can read visitor_profiles"
  ON public.visitor_profiles FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can update visitor_profiles"
  ON public.visitor_profiles FOR UPDATE TO authenticated USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.copy_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_type text NOT NULL,
  element_type text NOT NULL,
  content text NOT NULL,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  is_winner boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.copy_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active copy_variations"
  ON public.copy_variations FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "Admins can manage copy_variations"
  ON public.copy_variations FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.copy_ab_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  variation_id uuid REFERENCES public.copy_variations(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.copy_ab_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert copy_ab_events"
  ON public.copy_ab_events FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins can read copy_ab_events"
  ON public.copy_ab_events FOR SELECT TO authenticated USING (public.is_admin());

-- Seed default copy variations
INSERT INTO public.copy_variations (profile_type, element_type, content) VALUES
-- Buyer
('buyer', 'headline', 'Pare de Perder Dinheiro — Comece a Lucrar Agora'),
('buyer', 'cta_text', 'Começar Teste Grátis Agora'),
('buyer', 'cta_subtitle', 'Sem cartão de crédito. Resultado em 5 minutos.'),
('buyer', 'argument', 'Donos de ferro velho que usam o XLata aumentam o lucro em até 40% no primeiro mês.'),
-- Interested
('interested', 'headline', 'Descubra Como os Melhores Ferro Velhos se Organizam'),
('interested', 'cta_text', 'Ver Como Funciona'),
('interested', 'cta_subtitle', 'Conheça o sistema que já ajuda centenas de depósitos.'),
('interested', 'argument', 'O XLata automatiza tudo: compra, venda, estoque e financeiro. Veja como.'),
-- Curious
('curious', 'headline', 'Guia Completo: Como Funciona um Ferro Velho Lucrativo'),
('curious', 'cta_text', 'Aprender Mais'),
('curious', 'cta_subtitle', 'Conteúdo gratuito e completo para quem quer entender o mercado.'),
('curious', 'argument', 'Milhares de pessoas buscam informação sobre sucata todos os dias. Aprenda com especialistas.'),
-- Problem
('problem', 'headline', 'Seu Ferro Velho Está Desorganizado? Resolva Hoje'),
('problem', 'cta_text', 'Resolver Agora'),
('problem', 'cta_subtitle', 'Chega de perder vendas e controle. Organize em minutos.'),
('problem', 'argument', 'A falta de controle custa em média R$ 2.000/mês para donos de ferro velho.'),
-- Owner
('owner', 'headline', 'Sistema Profissional Para Seu Depósito de Sucata'),
('owner', 'cta_text', 'Testar Grátis por 7 Dias'),
('owner', 'cta_subtitle', 'Feito por quem entende o dia a dia do ferro velho.'),
('owner', 'argument', 'PDV, estoque, financeiro e clientes — tudo em um só lugar.'),
-- Beginner
('beginner', 'headline', 'Quer Abrir um Ferro Velho? Comece do Jeito Certo'),
('beginner', 'cta_text', 'Ver Guia Completo'),
('beginner', 'cta_subtitle', 'Passo a passo para iniciar com segurança e organização.'),
('beginner', 'argument', 'O XLata ajuda desde o primeiro dia com controle total de compras e vendas.');
