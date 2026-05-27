-- =====================================================
-- LANDING PAGE COMPLETE RESTRUCTURE
-- Tables for full admin control of all landing sections
-- =====================================================

-- 1. LANDING SECTIONS - Control visibility and order of all sections
CREATE TABLE public.landing_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL,
  background_class TEXT DEFAULT 'bg-gray-900',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. LANDING HOW IT WORKS - "Como funciona na prática"
CREATE TABLE public.landing_how_it_works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT 'Scale',
  image_url TEXT,
  video_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. LANDING REQUIREMENTS - "O que você precisa para usar"
CREATE TABLE public.landing_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  icon TEXT DEFAULT 'Check',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. LANDING PROBLEMS - "Onde você perde dinheiro hoje"
CREATE TABLE public.landing_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  loss_value TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT 'XCircle',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. LANDING KPIS - "O XLata resolve"
CREATE TABLE public.landing_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. LANDING VIDEOS - Vídeos demonstrativos
CREATE TABLE public.landing_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. LANDING TESTIMONIALS - Depoimentos (structured table)
CREATE TABLE public.landing_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  location TEXT,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  revenue TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. LANDING FAQ - Perguntas frequentes
CREATE TABLE public.landing_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. LANDING CTA FINAL - Call to action final
CREATE TABLE public.landing_cta_final (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_text TEXT NOT NULL,
  sub_text TEXT,
  button_text TEXT NOT NULL,
  button_url TEXT DEFAULT '/cadastro',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.landing_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_how_it_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_cta_final ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PUBLIC READ POLICIES (Landing is public)
-- =====================================================

CREATE POLICY "Landing sections are publicly readable"
ON public.landing_sections FOR SELECT USING (true);

CREATE POLICY "Landing how it works are publicly readable"
ON public.landing_how_it_works FOR SELECT USING (true);

CREATE POLICY "Landing requirements are publicly readable"
ON public.landing_requirements FOR SELECT USING (true);

CREATE POLICY "Landing problems are publicly readable"
ON public.landing_problems FOR SELECT USING (true);

CREATE POLICY "Landing KPIs are publicly readable"
ON public.landing_kpis FOR SELECT USING (true);

CREATE POLICY "Landing videos are publicly readable"
ON public.landing_videos FOR SELECT USING (true);

CREATE POLICY "Landing testimonials are publicly readable"
ON public.landing_testimonials FOR SELECT USING (true);

CREATE POLICY "Landing FAQ are publicly readable"
ON public.landing_faq FOR SELECT USING (true);

CREATE POLICY "Landing CTA final is publicly readable"
ON public.landing_cta_final FOR SELECT USING (true);

-- =====================================================
-- ADMIN WRITE POLICIES (Only admins can modify)
-- =====================================================

CREATE POLICY "Admins can manage landing sections"
ON public.landing_sections FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'));

CREATE POLICY "Admins can manage landing how it works"
ON public.landing_how_it_works FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'));

CREATE POLICY "Admins can manage landing requirements"
ON public.landing_requirements FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'));

CREATE POLICY "Admins can manage landing problems"
ON public.landing_problems FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'));

CREATE POLICY "Admins can manage landing KPIs"
ON public.landing_kpis FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'));

CREATE POLICY "Admins can manage landing videos"
ON public.landing_videos FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'));

CREATE POLICY "Admins can manage landing testimonials"
ON public.landing_testimonials FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'));

CREATE POLICY "Admins can manage landing FAQ"
ON public.landing_faq FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'));

CREATE POLICY "Admins can manage landing CTA final"
ON public.landing_cta_final FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'admin'));

-- =====================================================
-- SEED DATA - Default content for landing page
-- =====================================================

-- Sections order and visibility
INSERT INTO public.landing_sections (section_key, title, subtitle, display_order, is_visible) VALUES
('hero', 'Hero', 'Seção principal com headline e CTA', 1, true),
('how_it_works', 'Como Funciona', 'Passo a passo do sistema', 2, true),
('requirements', 'Requisitos', 'O que precisa para usar', 3, true),
('problems', 'Problemas', 'Onde você perde dinheiro', 4, true),
('kpis', 'Resultados', 'O XLata resolve', 5, true),
('videos', 'Vídeos', 'Demonstrações em vídeo', 6, true),
('testimonials', 'Depoimentos', 'O que nossos clientes dizem', 7, true),
('plans', 'Planos', 'Escolha seu plano', 8, true),
('faq', 'FAQ', 'Perguntas frequentes', 9, true),
('cta_final', 'CTA Final', 'Chamada para ação final', 10, true);

-- How it works steps
INSERT INTO public.landing_how_it_works (step_number, title, description, icon, display_order) VALUES
(1, 'Pesagem', 'Coloque o material na balança. O sistema captura o peso automaticamente ou você digita.', 'Scale', 1),
(2, 'Cálculo Automático', 'O XLata multiplica peso × preço do material. Zero erro de conta, zero discussão.', 'Calculator', 2),
(3, 'Comprovante na Hora', 'Imprime o recibo com todos os detalhes. Cliente sai satisfeito, você organizado.', 'Printer', 3);

-- Requirements checklist
INSERT INTO public.landing_requirements (text, icon, display_order) VALUES
('Qualquer celular, tablet ou computador', 'Smartphone', 1),
('Conexão com internet', 'Wifi', 2),
('Sua balança atual (qualquer modelo)', 'Scale', 3),
('Impressora térmica (opcional)', 'Printer', 4);

-- Problems (money loss points)
INSERT INTO public.landing_problems (title, loss_value, description, icon, display_order) VALUES
('Fila na Balança', 'R$ 3.500/mês', 'Cada cliente esperando 5 minutos = menos clientes por dia', 'Clock', 1),
('Erro de Conta', 'R$ 2.800/mês', 'Calculadora errada, conta de cabeça. Você paga a diferença.', 'Calculator', 2),
('Cliente Desconfiado', 'R$ 4.200/mês', 'Sem comprovante = cliente não volta. Perde fidelização.', 'UserX', 3),
('Bagunça no Fechamento', 'R$ 1.500/mês', 'Final do dia conferindo papel, somando valores. Tempo perdido.', 'FileX', 4);

-- KPIs
INSERT INTO public.landing_kpis (value, label, description, icon, display_order) VALUES
('+300%', 'Produtividade', 'Atenda 3x mais clientes no mesmo tempo', 'TrendingUp', 1),
('0', 'Erros de Conta', 'Sistema calcula automaticamente. Zero erro.', 'CheckCircle', 2),
('+40%', 'Fidelização', 'Cliente recebe comprovante, confia e volta', 'Heart', 3),
('5min', 'Fechamento', 'Relatório pronto em 5 minutos, não em horas', 'Clock', 4);

-- Videos
INSERT INTO public.landing_videos (title, description, video_url, display_order) VALUES
('Como Pesar Materiais', 'Veja como é simples registrar uma pesagem no XLata', 'https://www.youtube.com/watch?v=exemplo1', 1),
('Calculando Valores', 'O sistema calcula tudo automaticamente', 'https://www.youtube.com/watch?v=exemplo2', 2),
('Imprimindo Comprovante', 'Comprovante profissional em segundos', 'https://www.youtube.com/watch?v=exemplo3', 3);

-- Testimonials
INSERT INTO public.landing_testimonials (name, company, location, rating, text, revenue, display_order) VALUES
('João Silva', 'Sucata Silva', 'São Paulo, SP', 5, 'Antes eu perdia 2 horas por dia conferindo papel. Agora fecho o caixa em 10 minutos.', '+R$ 4.500/mês', 1),
('Maria Santos', 'Reciclagem Santos', 'Belo Horizonte, MG', 5, 'Meus clientes confiam mais porque recebem comprovante. Voltam sempre.', '+R$ 6.200/mês', 2),
('Pedro Oliveira', 'Depósito Oliveira', 'Curitiba, PR', 5, 'Eliminei erro de conta. Não perco mais dinheiro com diferença.', '+R$ 3.800/mês', 3);

-- FAQ
INSERT INTO public.landing_faq (question, answer, display_order) VALUES
('Preciso trocar minha balança?', 'Não! O XLata funciona com qualquer balança que você já usa. Digital ou mecânica.', 1),
('Funciona sem internet?', 'Precisa de internet para sincronizar, mas em caso de queda você continua operando normalmente.', 2),
('É difícil de aprender?', 'Se você sabe usar WhatsApp, sabe usar o XLata. Simples assim.', 3),
('Posso cancelar quando quiser?', 'Sim! Sem multa, sem fidelidade. Cancela quando quiser.', 4),
('Tem suporte?', 'Suporte via WhatsApp direto com a equipe. Resposta rápida.', 5),
('Funciona no celular?', 'Sim! Celular, tablet, computador. Qualquer aparelho com navegador.', 6);

-- CTA Final
INSERT INTO public.landing_cta_final (main_text, sub_text, button_text, button_url, notes) VALUES
('Comece a Lucrar Mais Hoje', 'Teste grátis por 7 dias. Sem cartão de crédito.', 'Começar Teste Grátis', '/cadastro', '✓ 7 dias grátis  ✓ Sem cartão  ✓ Cancela quando quiser');

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_landing_sections_order ON public.landing_sections(display_order);
CREATE INDEX idx_landing_how_it_works_order ON public.landing_how_it_works(display_order);
CREATE INDEX idx_landing_requirements_order ON public.landing_requirements(display_order);
CREATE INDEX idx_landing_problems_order ON public.landing_problems(display_order);
CREATE INDEX idx_landing_kpis_order ON public.landing_kpis(display_order);
CREATE INDEX idx_landing_videos_order ON public.landing_videos(display_order);
CREATE INDEX idx_landing_testimonials_order ON public.landing_testimonials(display_order);
CREATE INDEX idx_landing_faq_order ON public.landing_faq(display_order);

-- =====================================================
-- UPDATE TIMESTAMP TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_landing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_landing_sections_timestamp
BEFORE UPDATE ON public.landing_sections
FOR EACH ROW EXECUTE FUNCTION update_landing_updated_at();

CREATE TRIGGER update_landing_how_it_works_timestamp
BEFORE UPDATE ON public.landing_how_it_works
FOR EACH ROW EXECUTE FUNCTION update_landing_updated_at();

CREATE TRIGGER update_landing_requirements_timestamp
BEFORE UPDATE ON public.landing_requirements
FOR EACH ROW EXECUTE FUNCTION update_landing_updated_at();

CREATE TRIGGER update_landing_problems_timestamp
BEFORE UPDATE ON public.landing_problems
FOR EACH ROW EXECUTE FUNCTION update_landing_updated_at();

CREATE TRIGGER update_landing_kpis_timestamp
BEFORE UPDATE ON public.landing_kpis
FOR EACH ROW EXECUTE FUNCTION update_landing_updated_at();

CREATE TRIGGER update_landing_videos_timestamp
BEFORE UPDATE ON public.landing_videos
FOR EACH ROW EXECUTE FUNCTION update_landing_updated_at();

CREATE TRIGGER update_landing_testimonials_timestamp
BEFORE UPDATE ON public.landing_testimonials
FOR EACH ROW EXECUTE FUNCTION update_landing_updated_at();

CREATE TRIGGER update_landing_faq_timestamp
BEFORE UPDATE ON public.landing_faq
FOR EACH ROW EXECUTE FUNCTION update_landing_updated_at();