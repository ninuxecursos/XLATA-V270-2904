-- Create ai_automation_config table
CREATE TABLE IF NOT EXISTS public.ai_automation_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ai_provider text NOT NULL DEFAULT 'lovable_cloud' CHECK (ai_provider IN ('lovable_cloud', 'google_gemini')),
  ai_model text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  is_ai_active boolean NOT NULL DEFAULT true,
  automation_enabled boolean NOT NULL DEFAULT false,
  articles_per_month integer NOT NULL DEFAULT 8,
  publish_hour integer NOT NULL DEFAULT 6 CHECK (publish_hour >= 0 AND publish_hour <= 23),
  publish_interval_days integer NOT NULL DEFAULT 3 CHECK (publish_interval_days >= 1 AND publish_interval_days <= 14),
  min_word_count integer NOT NULL DEFAULT 1200,
  max_word_count integer NOT NULL DEFAULT 2000,
  default_category_id uuid REFERENCES public.blog_categories(id),
  last_generation_at timestamptz,
  next_generation_at timestamptz,
  total_articles_generated integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create seo_topic_bank table
CREATE TABLE IF NOT EXISTS public.seo_topic_bank (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  category text NOT NULL DEFAULT 'educacional' CHECK (category IN ('educacional', 'tecnico', 'comercial')),
  priority integer NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  is_used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create article_generation_log table
CREATE TABLE IF NOT EXISTS public.article_generation_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_id uuid REFERENCES public.blog_posts(id),
  topic_id uuid REFERENCES public.seo_topic_bank(id),
  topic_used text NOT NULL,
  ai_provider text NOT NULL,
  ai_model text,
  generation_time_ms integer,
  word_count integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ai_automation_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_topic_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_generation_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_automation_config (admin only via service role)
CREATE POLICY "Allow admins to read ai_automation_config" 
ON public.ai_automation_config FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_master', 'admin_operacional')
  )
);

CREATE POLICY "Allow admins to update ai_automation_config" 
ON public.ai_automation_config FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_master', 'admin_operacional')
  )
);

CREATE POLICY "Allow admins to insert ai_automation_config" 
ON public.ai_automation_config FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_master', 'admin_operacional')
  )
);

-- RLS policies for seo_topic_bank (admin only)
CREATE POLICY "Allow admins to manage seo_topic_bank" 
ON public.seo_topic_bank FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_master', 'admin_operacional')
  )
);

-- RLS policies for article_generation_log (admin only)
CREATE POLICY "Allow admins to read article_generation_log" 
ON public.article_generation_log FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_master', 'admin_operacional')
  )
);

CREATE POLICY "Allow service role to insert article_generation_log" 
ON public.article_generation_log FOR INSERT 
WITH CHECK (true);

-- Insert default config
INSERT INTO public.ai_automation_config (
  ai_provider, 
  ai_model, 
  is_ai_active, 
  automation_enabled, 
  articles_per_month,
  publish_hour,
  publish_interval_days,
  min_word_count,
  max_word_count
) VALUES (
  'lovable_cloud',
  'google/gemini-3-flash-preview',
  true,
  false,
  8,
  6,
  3,
  1200,
  2000
);

-- Insert initial topic bank (50 topics)
INSERT INTO public.seo_topic_bank (topic, keywords, category, priority) VALUES
-- Educacional (20 temas)
('Como funciona um ferro velho: guia completo para iniciantes', ARRAY['ferro velho', 'como funciona', 'reciclagem', 'sucata'], 'educacional', 10),
('CNAE correto para ferro velho e depósito de reciclagem', ARRAY['CNAE ferro velho', 'CNAE reciclagem', 'abertura empresa'], 'educacional', 9),
('Licenças ambientais obrigatórias para operar ferro velho', ARRAY['licença ambiental', 'IBAMA', 'ferro velho legalizado'], 'educacional', 9),
('Diferença entre sucata ferrosa e não ferrosa: guia prático', ARRAY['sucata ferrosa', 'sucata não ferrosa', 'tipos de sucata'], 'educacional', 8),
('Como montar um ferro velho do zero: passo a passo completo', ARRAY['montar ferro velho', 'abrir ferro velho', 'negócio reciclagem'], 'educacional', 10),
('Tipos de materiais recicláveis e seus valores de mercado', ARRAY['materiais recicláveis', 'preço sucata', 'valor materiais'], 'educacional', 8),
('História da reciclagem no Brasil e importância econômica', ARRAY['história reciclagem', 'reciclagem Brasil', 'economia circular'], 'educacional', 6),
('Economia circular: como o ferro velho contribui para sustentabilidade', ARRAY['economia circular', 'sustentabilidade', 'ferro velho sustentável'], 'educacional', 7),
('Impacto ambiental positivo da reciclagem de metais', ARRAY['impacto ambiental', 'reciclagem metais', 'meio ambiente'], 'educacional', 7),
('Como identificar e classificar diferentes tipos de alumínio', ARRAY['tipos alumínio', 'classificar alumínio', 'sucata alumínio'], 'educacional', 8),
('Documentação necessária para comprar e vender sucata', ARRAY['documentação sucata', 'nota fiscal sucata', 'legalização'], 'educacional', 9),
('Segurança no trabalho em depósitos de reciclagem', ARRAY['segurança trabalho', 'EPI reciclagem', 'normas segurança'], 'educacional', 8),
('Como funciona a cotação de sucata no mercado brasileiro', ARRAY['cotação sucata', 'preço sucata hoje', 'mercado sucata'], 'educacional', 9),
('Principais fornecedores de sucata para ferro velhos', ARRAY['fornecedores sucata', 'onde comprar sucata', 'catadores'], 'educacional', 7),
('Como negociar preços de compra e venda de sucata', ARRAY['negociar sucata', 'margem lucro sucata', 'preço justo'], 'educacional', 8),
('Equipamentos essenciais para ferro velho profissional', ARRAY['equipamentos ferro velho', 'balança sucata', 'ferramentas'], 'educacional', 8),
('Logística de coleta e transporte de materiais recicláveis', ARRAY['logística reciclagem', 'transporte sucata', 'coleta materiais'], 'educacional', 7),
('Como calcular o peso real de materiais com impurezas', ARRAY['calcular peso sucata', 'impurezas sucata', 'peso líquido'], 'educacional', 8),
('Normas da Receita Federal para compra de sucata de pessoas físicas', ARRAY['Receita Federal sucata', 'nota avulsa sucata', 'tributação'], 'educacional', 9),
('Tendências do mercado de reciclagem para os próximos anos', ARRAY['tendências reciclagem', 'futuro ferro velho', 'mercado 2025'], 'educacional', 6),

-- Técnico (15 temas)
('Como fazer controle de caixa eficiente em ferro velho', ARRAY['controle de caixa', 'fluxo de caixa', 'gestão financeira'], 'tecnico', 10),
('Gestão financeira completa para depósitos de reciclagem', ARRAY['gestão financeira', 'finanças reciclagem', 'controle financeiro'], 'tecnico', 10),
('Relatórios essenciais para gestão de ferro velho', ARRAY['relatórios ferro velho', 'indicadores reciclagem', 'métricas gestão'], 'tecnico', 9),
('Controle de entrada e saída de materiais: métodos eficientes', ARRAY['entrada saída materiais', 'controle estoque', 'movimentação sucata'], 'tecnico', 9),
('Como organizar estoque de sucata por categoria e valor', ARRAY['organizar estoque', 'categorizar sucata', 'estoque reciclagem'], 'tecnico', 9),
('Precificação de materiais recicláveis: estratégias lucrativas', ARRAY['precificação sucata', 'margem lucro', 'preço venda'], 'tecnico', 10),
('Fluxo de caixa diário para depósitos de materiais', ARRAY['fluxo caixa diário', 'controle diário', 'movimentação dinheiro'], 'tecnico', 9),
('Margem de lucro ideal para cada tipo de material reciclável', ARRAY['margem lucro reciclagem', 'lucro por material', 'rentabilidade'], 'tecnico', 10),
('Como calcular o lucro real do ferro velho mensalmente', ARRAY['calcular lucro', 'lucro mensal', 'resultado financeiro'], 'tecnico', 10),
('Controle de peso e calibração de balanças: guia técnico', ARRAY['controle peso', 'calibrar balança', 'precisão pesagem'], 'tecnico', 8),
('Como fazer inventário de estoque em depósito de reciclagem', ARRAY['inventário estoque', 'contagem materiais', 'balanço estoque'], 'tecnico', 8),
('Indicadores de desempenho (KPIs) para ferro velhos', ARRAY['KPIs ferro velho', 'indicadores desempenho', 'métricas negócio'], 'tecnico', 8),
('Gestão de contas a pagar e receber em reciclagem', ARRAY['contas pagar receber', 'gestão financeira', 'controle pagamentos'], 'tecnico', 8),
('Como criar um plano de contas para ferro velho', ARRAY['plano de contas', 'contabilidade reciclagem', 'categorias financeiras'], 'tecnico', 7),
('Controle de despesas operacionais em depósitos', ARRAY['despesas operacionais', 'custos fixos', 'gastos ferro velho'], 'tecnico', 8),

-- Comercial (15 temas)
('Por que usar um sistema de gestão para ferro velho', ARRAY['sistema ferro velho', 'software reciclagem', 'gestão automatizada'], 'comercial', 10),
('Vantagens da automação para negócios de reciclagem', ARRAY['automação reciclagem', 'tecnologia ferro velho', 'digitalização'], 'comercial', 9),
('Diferença entre usar planilha Excel e sistema de gestão', ARRAY['planilha vs sistema', 'Excel ferro velho', 'sistema gestão'], 'comercial', 10),
('Como crescer seu negócio de sucata de forma sustentável', ARRAY['crescer ferro velho', 'expandir negócio', 'escalar reciclagem'], 'comercial', 9),
('Profissionalização do ferro velho: do informal ao empresarial', ARRAY['profissionalizar ferro velho', 'formalização negócio', 'empresa reciclagem'], 'comercial', 9),
('Tecnologia na reciclagem: transformação digital do setor', ARRAY['tecnologia reciclagem', 'inovação ferro velho', 'digital'], 'comercial', 8),
('Erros comuns na gestão de ferro velho e como evitá-los', ARRAY['erros gestão', 'problemas ferro velho', 'evitar prejuízo'], 'comercial', 10),
('Como evitar prejuízo no negócio de reciclagem', ARRAY['evitar prejuízo', 'lucro reciclagem', 'gestão eficiente'], 'comercial', 9),
('Modernização de depósitos de reciclagem: por onde começar', ARRAY['modernizar ferro velho', 'atualizar negócio', 'inovação'], 'comercial', 8),
('Competitividade no setor de reciclagem: como se destacar', ARRAY['competitividade reciclagem', 'diferencial mercado', 'concorrência'], 'comercial', 8),
('Casos de sucesso: ferro velhos que cresceram com tecnologia', ARRAY['casos sucesso', 'crescimento negócio', 'exemplos reciclagem'], 'comercial', 7),
('ROI de sistemas de gestão para depósitos de reciclagem', ARRAY['ROI sistema', 'retorno investimento', 'custo benefício'], 'comercial', 8),
('Como reduzir tempo gasto em tarefas administrativas', ARRAY['reduzir tempo', 'produtividade', 'eficiência operacional'], 'comercial', 8),
('Benefícios de ter controle em tempo real do seu ferro velho', ARRAY['controle tempo real', 'dashboard gestão', 'monitoramento'], 'comercial', 8),
('Preparando seu ferro velho para o futuro digital', ARRAY['futuro digital', 'transformação digital', 'negócio moderno'], 'comercial', 7);

-- Create trigger for updated_at
CREATE TRIGGER update_ai_automation_config_updated_at
BEFORE UPDATE ON public.ai_automation_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();