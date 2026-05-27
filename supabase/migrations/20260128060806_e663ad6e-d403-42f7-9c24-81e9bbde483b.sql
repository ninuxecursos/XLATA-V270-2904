-- =============================================
-- LOCAL SEO TABLES FOR NATIONAL COVERAGE
-- =============================================

-- Table: local_seo_states (27 estados brasileiros + DF)
CREATE TABLE public.local_seo_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: local_seo_cities (principais cidades por estado)
CREATE TABLE public.local_seo_cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state_id UUID NOT NULL REFERENCES public.local_seo_states(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_capital BOOLEAN NOT NULL DEFAULT false,
  population_rank INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(state_id, slug)
);

-- Table: local_seo_pages (páginas com conteúdo único)
CREATE TABLE public.local_seo_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  page_type TEXT NOT NULL CHECK (page_type IN ('state', 'city')),
  state_id UUID NOT NULL REFERENCES public.local_seo_states(id) ON DELETE CASCADE,
  city_id UUID REFERENCES public.local_seo_cities(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  subheadline TEXT,
  content_html TEXT NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  faq JSONB DEFAULT '[]'::jsonb,
  seo_title TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  og_image TEXT,
  canonical_url TEXT NOT NULL,
  schema_data JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  allow_indexing BOOLEAN NOT NULL DEFAULT true,
  sitemap_priority DECIMAL(2,1) NOT NULL DEFAULT 0.6,
  sitemap_changefreq TEXT NOT NULL DEFAULT 'monthly',
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_local_seo_states_active ON public.local_seo_states(is_active, display_order);
CREATE INDEX idx_local_seo_cities_state ON public.local_seo_cities(state_id, is_active, population_rank);
CREATE INDEX idx_local_seo_pages_slug ON public.local_seo_pages(slug);
CREATE INDEX idx_local_seo_pages_status ON public.local_seo_pages(status, allow_indexing);
CREATE INDEX idx_local_seo_pages_state ON public.local_seo_pages(state_id);
CREATE INDEX idx_local_seo_pages_city ON public.local_seo_pages(city_id);

-- Enable RLS
ALTER TABLE public.local_seo_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_seo_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_seo_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read for active/published content
CREATE POLICY "States are publicly readable" 
ON public.local_seo_states FOR SELECT 
USING (is_active = true);

CREATE POLICY "Cities are publicly readable" 
ON public.local_seo_cities FOR SELECT 
USING (is_active = true);

CREATE POLICY "Published pages are publicly readable" 
ON public.local_seo_pages FOR SELECT 
USING (status = 'published');

-- Admin policies for management (using correct enum values)
CREATE POLICY "Admins can manage states" 
ON public.local_seo_states FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_master', 'admin_operacional')
  )
);

CREATE POLICY "Admins can manage cities" 
ON public.local_seo_cities FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_master', 'admin_operacional')
  )
);

CREATE POLICY "Admins can manage pages" 
ON public.local_seo_pages FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_master', 'admin_operacional')
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_local_seo_states_updated_at
BEFORE UPDATE ON public.local_seo_states
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_local_seo_cities_updated_at
BEFORE UPDATE ON public.local_seo_cities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_local_seo_pages_updated_at
BEFORE UPDATE ON public.local_seo_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SEED DATA: BRAZILIAN STATES (27)
-- =============================================

INSERT INTO public.local_seo_states (name, abbreviation, slug, display_order) VALUES
('São Paulo', 'SP', 'sao-paulo', 1),
('Minas Gerais', 'MG', 'minas-gerais', 2),
('Rio de Janeiro', 'RJ', 'rio-de-janeiro', 3),
('Paraná', 'PR', 'parana', 4),
('Rio Grande do Sul', 'RS', 'rio-grande-do-sul', 5),
('Bahia', 'BA', 'bahia', 6),
('Santa Catarina', 'SC', 'santa-catarina', 7),
('Goiás', 'GO', 'goias', 8),
('Pernambuco', 'PE', 'pernambuco', 9),
('Ceará', 'CE', 'ceara', 10),
('Distrito Federal', 'DF', 'distrito-federal', 11),
('Espírito Santo', 'ES', 'espirito-santo', 12),
('Mato Grosso', 'MT', 'mato-grosso', 13),
('Mato Grosso do Sul', 'MS', 'mato-grosso-do-sul', 14),
('Pará', 'PA', 'para', 15),
('Maranhão', 'MA', 'maranhao', 16),
('Amazonas', 'AM', 'amazonas', 17),
('Paraíba', 'PB', 'paraiba', 18),
('Rio Grande do Norte', 'RN', 'rio-grande-do-norte', 19),
('Piauí', 'PI', 'piaui', 20),
('Alagoas', 'AL', 'alagoas', 21),
('Sergipe', 'SE', 'sergipe', 22),
('Rondônia', 'RO', 'rondonia', 23),
('Tocantins', 'TO', 'tocantins', 24),
('Acre', 'AC', 'acre', 25),
('Amapá', 'AP', 'amapa', 26),
('Roraima', 'RR', 'roraima', 27);

-- =============================================
-- SEED DATA: MAIN CITIES (5 per state = 135)
-- =============================================

-- São Paulo (SP)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'São Paulo', 'sao-paulo', true, 1 FROM public.local_seo_states WHERE abbreviation = 'SP'
UNION ALL
SELECT id, 'Campinas', 'campinas', false, 2 FROM public.local_seo_states WHERE abbreviation = 'SP'
UNION ALL
SELECT id, 'Guarulhos', 'guarulhos', false, 3 FROM public.local_seo_states WHERE abbreviation = 'SP'
UNION ALL
SELECT id, 'Santos', 'santos', false, 4 FROM public.local_seo_states WHERE abbreviation = 'SP'
UNION ALL
SELECT id, 'São Bernardo do Campo', 'sao-bernardo-do-campo', false, 5 FROM public.local_seo_states WHERE abbreviation = 'SP';

-- Minas Gerais (MG)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Belo Horizonte', 'belo-horizonte', true, 1 FROM public.local_seo_states WHERE abbreviation = 'MG'
UNION ALL
SELECT id, 'Uberlândia', 'uberlandia', false, 2 FROM public.local_seo_states WHERE abbreviation = 'MG'
UNION ALL
SELECT id, 'Contagem', 'contagem', false, 3 FROM public.local_seo_states WHERE abbreviation = 'MG'
UNION ALL
SELECT id, 'Juiz de Fora', 'juiz-de-fora', false, 4 FROM public.local_seo_states WHERE abbreviation = 'MG'
UNION ALL
SELECT id, 'Betim', 'betim', false, 5 FROM public.local_seo_states WHERE abbreviation = 'MG';

-- Rio de Janeiro (RJ)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Rio de Janeiro', 'rio-de-janeiro', true, 1 FROM public.local_seo_states WHERE abbreviation = 'RJ'
UNION ALL
SELECT id, 'São Gonçalo', 'sao-goncalo', false, 2 FROM public.local_seo_states WHERE abbreviation = 'RJ'
UNION ALL
SELECT id, 'Duque de Caxias', 'duque-de-caxias', false, 3 FROM public.local_seo_states WHERE abbreviation = 'RJ'
UNION ALL
SELECT id, 'Nova Iguaçu', 'nova-iguacu', false, 4 FROM public.local_seo_states WHERE abbreviation = 'RJ'
UNION ALL
SELECT id, 'Niterói', 'niteroi', false, 5 FROM public.local_seo_states WHERE abbreviation = 'RJ';

-- Paraná (PR)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Curitiba', 'curitiba', true, 1 FROM public.local_seo_states WHERE abbreviation = 'PR'
UNION ALL
SELECT id, 'Londrina', 'londrina', false, 2 FROM public.local_seo_states WHERE abbreviation = 'PR'
UNION ALL
SELECT id, 'Maringá', 'maringa', false, 3 FROM public.local_seo_states WHERE abbreviation = 'PR'
UNION ALL
SELECT id, 'Ponta Grossa', 'ponta-grossa', false, 4 FROM public.local_seo_states WHERE abbreviation = 'PR'
UNION ALL
SELECT id, 'Cascavel', 'cascavel', false, 5 FROM public.local_seo_states WHERE abbreviation = 'PR';

-- Rio Grande do Sul (RS)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Porto Alegre', 'porto-alegre', true, 1 FROM public.local_seo_states WHERE abbreviation = 'RS'
UNION ALL
SELECT id, 'Caxias do Sul', 'caxias-do-sul', false, 2 FROM public.local_seo_states WHERE abbreviation = 'RS'
UNION ALL
SELECT id, 'Canoas', 'canoas', false, 3 FROM public.local_seo_states WHERE abbreviation = 'RS'
UNION ALL
SELECT id, 'Pelotas', 'pelotas', false, 4 FROM public.local_seo_states WHERE abbreviation = 'RS'
UNION ALL
SELECT id, 'Santa Maria', 'santa-maria', false, 5 FROM public.local_seo_states WHERE abbreviation = 'RS';

-- Bahia (BA)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Salvador', 'salvador', true, 1 FROM public.local_seo_states WHERE abbreviation = 'BA'
UNION ALL
SELECT id, 'Feira de Santana', 'feira-de-santana', false, 2 FROM public.local_seo_states WHERE abbreviation = 'BA'
UNION ALL
SELECT id, 'Vitória da Conquista', 'vitoria-da-conquista', false, 3 FROM public.local_seo_states WHERE abbreviation = 'BA'
UNION ALL
SELECT id, 'Camaçari', 'camacari', false, 4 FROM public.local_seo_states WHERE abbreviation = 'BA'
UNION ALL
SELECT id, 'Itabuna', 'itabuna', false, 5 FROM public.local_seo_states WHERE abbreviation = 'BA';

-- Santa Catarina (SC)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Florianópolis', 'florianopolis', true, 1 FROM public.local_seo_states WHERE abbreviation = 'SC'
UNION ALL
SELECT id, 'Joinville', 'joinville', false, 2 FROM public.local_seo_states WHERE abbreviation = 'SC'
UNION ALL
SELECT id, 'Blumenau', 'blumenau', false, 3 FROM public.local_seo_states WHERE abbreviation = 'SC'
UNION ALL
SELECT id, 'São José', 'sao-jose-sc', false, 4 FROM public.local_seo_states WHERE abbreviation = 'SC'
UNION ALL
SELECT id, 'Criciúma', 'criciuma', false, 5 FROM public.local_seo_states WHERE abbreviation = 'SC';

-- Goiás (GO)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Goiânia', 'goiania', true, 1 FROM public.local_seo_states WHERE abbreviation = 'GO'
UNION ALL
SELECT id, 'Aparecida de Goiânia', 'aparecida-de-goiania', false, 2 FROM public.local_seo_states WHERE abbreviation = 'GO'
UNION ALL
SELECT id, 'Anápolis', 'anapolis', false, 3 FROM public.local_seo_states WHERE abbreviation = 'GO'
UNION ALL
SELECT id, 'Rio Verde', 'rio-verde', false, 4 FROM public.local_seo_states WHERE abbreviation = 'GO'
UNION ALL
SELECT id, 'Luziânia', 'luziania', false, 5 FROM public.local_seo_states WHERE abbreviation = 'GO';

-- Pernambuco (PE)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Recife', 'recife', true, 1 FROM public.local_seo_states WHERE abbreviation = 'PE'
UNION ALL
SELECT id, 'Jaboatão dos Guararapes', 'jaboatao-dos-guararapes', false, 2 FROM public.local_seo_states WHERE abbreviation = 'PE'
UNION ALL
SELECT id, 'Olinda', 'olinda', false, 3 FROM public.local_seo_states WHERE abbreviation = 'PE'
UNION ALL
SELECT id, 'Caruaru', 'caruaru', false, 4 FROM public.local_seo_states WHERE abbreviation = 'PE'
UNION ALL
SELECT id, 'Petrolina', 'petrolina', false, 5 FROM public.local_seo_states WHERE abbreviation = 'PE';

-- Ceará (CE)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Fortaleza', 'fortaleza', true, 1 FROM public.local_seo_states WHERE abbreviation = 'CE'
UNION ALL
SELECT id, 'Caucaia', 'caucaia', false, 2 FROM public.local_seo_states WHERE abbreviation = 'CE'
UNION ALL
SELECT id, 'Juazeiro do Norte', 'juazeiro-do-norte', false, 3 FROM public.local_seo_states WHERE abbreviation = 'CE'
UNION ALL
SELECT id, 'Maracanaú', 'maracanau', false, 4 FROM public.local_seo_states WHERE abbreviation = 'CE'
UNION ALL
SELECT id, 'Sobral', 'sobral', false, 5 FROM public.local_seo_states WHERE abbreviation = 'CE';

-- Distrito Federal (DF)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Brasília', 'brasilia', true, 1 FROM public.local_seo_states WHERE abbreviation = 'DF'
UNION ALL
SELECT id, 'Taguatinga', 'taguatinga', false, 2 FROM public.local_seo_states WHERE abbreviation = 'DF'
UNION ALL
SELECT id, 'Ceilândia', 'ceilandia', false, 3 FROM public.local_seo_states WHERE abbreviation = 'DF'
UNION ALL
SELECT id, 'Samambaia', 'samambaia', false, 4 FROM public.local_seo_states WHERE abbreviation = 'DF'
UNION ALL
SELECT id, 'Planaltina', 'planaltina', false, 5 FROM public.local_seo_states WHERE abbreviation = 'DF';

-- Espírito Santo (ES)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Vitória', 'vitoria-es', true, 1 FROM public.local_seo_states WHERE abbreviation = 'ES'
UNION ALL
SELECT id, 'Vila Velha', 'vila-velha', false, 2 FROM public.local_seo_states WHERE abbreviation = 'ES'
UNION ALL
SELECT id, 'Serra', 'serra-es', false, 3 FROM public.local_seo_states WHERE abbreviation = 'ES'
UNION ALL
SELECT id, 'Cariacica', 'cariacica', false, 4 FROM public.local_seo_states WHERE abbreviation = 'ES'
UNION ALL
SELECT id, 'Cachoeiro de Itapemirim', 'cachoeiro-de-itapemirim', false, 5 FROM public.local_seo_states WHERE abbreviation = 'ES';

-- Mato Grosso (MT)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Cuiabá', 'cuiaba', true, 1 FROM public.local_seo_states WHERE abbreviation = 'MT'
UNION ALL
SELECT id, 'Várzea Grande', 'varzea-grande', false, 2 FROM public.local_seo_states WHERE abbreviation = 'MT'
UNION ALL
SELECT id, 'Rondonópolis', 'rondonopolis', false, 3 FROM public.local_seo_states WHERE abbreviation = 'MT'
UNION ALL
SELECT id, 'Sinop', 'sinop', false, 4 FROM public.local_seo_states WHERE abbreviation = 'MT'
UNION ALL
SELECT id, 'Tangará da Serra', 'tangara-da-serra', false, 5 FROM public.local_seo_states WHERE abbreviation = 'MT';

-- Mato Grosso do Sul (MS)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Campo Grande', 'campo-grande', true, 1 FROM public.local_seo_states WHERE abbreviation = 'MS'
UNION ALL
SELECT id, 'Dourados', 'dourados', false, 2 FROM public.local_seo_states WHERE abbreviation = 'MS'
UNION ALL
SELECT id, 'Três Lagoas', 'tres-lagoas', false, 3 FROM public.local_seo_states WHERE abbreviation = 'MS'
UNION ALL
SELECT id, 'Corumbá', 'corumba', false, 4 FROM public.local_seo_states WHERE abbreviation = 'MS'
UNION ALL
SELECT id, 'Ponta Porã', 'ponta-pora', false, 5 FROM public.local_seo_states WHERE abbreviation = 'MS';

-- Pará (PA)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Belém', 'belem', true, 1 FROM public.local_seo_states WHERE abbreviation = 'PA'
UNION ALL
SELECT id, 'Ananindeua', 'ananindeua', false, 2 FROM public.local_seo_states WHERE abbreviation = 'PA'
UNION ALL
SELECT id, 'Santarém', 'santarem', false, 3 FROM public.local_seo_states WHERE abbreviation = 'PA'
UNION ALL
SELECT id, 'Marabá', 'maraba', false, 4 FROM public.local_seo_states WHERE abbreviation = 'PA'
UNION ALL
SELECT id, 'Parauapebas', 'parauapebas', false, 5 FROM public.local_seo_states WHERE abbreviation = 'PA';

-- Maranhão (MA)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'São Luís', 'sao-luis', true, 1 FROM public.local_seo_states WHERE abbreviation = 'MA'
UNION ALL
SELECT id, 'Imperatriz', 'imperatriz', false, 2 FROM public.local_seo_states WHERE abbreviation = 'MA'
UNION ALL
SELECT id, 'São José de Ribamar', 'sao-jose-de-ribamar', false, 3 FROM public.local_seo_states WHERE abbreviation = 'MA'
UNION ALL
SELECT id, 'Timon', 'timon', false, 4 FROM public.local_seo_states WHERE abbreviation = 'MA'
UNION ALL
SELECT id, 'Caxias', 'caxias-ma', false, 5 FROM public.local_seo_states WHERE abbreviation = 'MA';

-- Amazonas (AM)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Manaus', 'manaus', true, 1 FROM public.local_seo_states WHERE abbreviation = 'AM'
UNION ALL
SELECT id, 'Parintins', 'parintins', false, 2 FROM public.local_seo_states WHERE abbreviation = 'AM'
UNION ALL
SELECT id, 'Itacoatiara', 'itacoatiara', false, 3 FROM public.local_seo_states WHERE abbreviation = 'AM'
UNION ALL
SELECT id, 'Manacapuru', 'manacapuru', false, 4 FROM public.local_seo_states WHERE abbreviation = 'AM'
UNION ALL
SELECT id, 'Coari', 'coari', false, 5 FROM public.local_seo_states WHERE abbreviation = 'AM';

-- Paraíba (PB)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'João Pessoa', 'joao-pessoa', true, 1 FROM public.local_seo_states WHERE abbreviation = 'PB'
UNION ALL
SELECT id, 'Campina Grande', 'campina-grande', false, 2 FROM public.local_seo_states WHERE abbreviation = 'PB'
UNION ALL
SELECT id, 'Santa Rita', 'santa-rita-pb', false, 3 FROM public.local_seo_states WHERE abbreviation = 'PB'
UNION ALL
SELECT id, 'Patos', 'patos', false, 4 FROM public.local_seo_states WHERE abbreviation = 'PB'
UNION ALL
SELECT id, 'Bayeux', 'bayeux', false, 5 FROM public.local_seo_states WHERE abbreviation = 'PB';

-- Rio Grande do Norte (RN)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Natal', 'natal', true, 1 FROM public.local_seo_states WHERE abbreviation = 'RN'
UNION ALL
SELECT id, 'Mossoró', 'mossoro', false, 2 FROM public.local_seo_states WHERE abbreviation = 'RN'
UNION ALL
SELECT id, 'Parnamirim', 'parnamirim', false, 3 FROM public.local_seo_states WHERE abbreviation = 'RN'
UNION ALL
SELECT id, 'São Gonçalo do Amarante', 'sao-goncalo-do-amarante', false, 4 FROM public.local_seo_states WHERE abbreviation = 'RN'
UNION ALL
SELECT id, 'Macaíba', 'macaiba', false, 5 FROM public.local_seo_states WHERE abbreviation = 'RN';

-- Piauí (PI)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Teresina', 'teresina', true, 1 FROM public.local_seo_states WHERE abbreviation = 'PI'
UNION ALL
SELECT id, 'Parnaíba', 'parnaiba', false, 2 FROM public.local_seo_states WHERE abbreviation = 'PI'
UNION ALL
SELECT id, 'Picos', 'picos', false, 3 FROM public.local_seo_states WHERE abbreviation = 'PI'
UNION ALL
SELECT id, 'Piripiri', 'piripiri', false, 4 FROM public.local_seo_states WHERE abbreviation = 'PI'
UNION ALL
SELECT id, 'Floriano', 'floriano', false, 5 FROM public.local_seo_states WHERE abbreviation = 'PI';

-- Alagoas (AL)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Maceió', 'maceio', true, 1 FROM public.local_seo_states WHERE abbreviation = 'AL'
UNION ALL
SELECT id, 'Arapiraca', 'arapiraca', false, 2 FROM public.local_seo_states WHERE abbreviation = 'AL'
UNION ALL
SELECT id, 'Rio Largo', 'rio-largo', false, 3 FROM public.local_seo_states WHERE abbreviation = 'AL'
UNION ALL
SELECT id, 'Palmeira dos Índios', 'palmeira-dos-indios', false, 4 FROM public.local_seo_states WHERE abbreviation = 'AL'
UNION ALL
SELECT id, 'União dos Palmares', 'uniao-dos-palmares', false, 5 FROM public.local_seo_states WHERE abbreviation = 'AL';

-- Sergipe (SE)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Aracaju', 'aracaju', true, 1 FROM public.local_seo_states WHERE abbreviation = 'SE'
UNION ALL
SELECT id, 'Nossa Senhora do Socorro', 'nossa-senhora-do-socorro', false, 2 FROM public.local_seo_states WHERE abbreviation = 'SE'
UNION ALL
SELECT id, 'Lagarto', 'lagarto', false, 3 FROM public.local_seo_states WHERE abbreviation = 'SE'
UNION ALL
SELECT id, 'Itabaiana', 'itabaiana-se', false, 4 FROM public.local_seo_states WHERE abbreviation = 'SE'
UNION ALL
SELECT id, 'São Cristóvão', 'sao-cristovao', false, 5 FROM public.local_seo_states WHERE abbreviation = 'SE';

-- Rondônia (RO)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Porto Velho', 'porto-velho', true, 1 FROM public.local_seo_states WHERE abbreviation = 'RO'
UNION ALL
SELECT id, 'Ji-Paraná', 'ji-parana', false, 2 FROM public.local_seo_states WHERE abbreviation = 'RO'
UNION ALL
SELECT id, 'Ariquemes', 'ariquemes', false, 3 FROM public.local_seo_states WHERE abbreviation = 'RO'
UNION ALL
SELECT id, 'Vilhena', 'vilhena', false, 4 FROM public.local_seo_states WHERE abbreviation = 'RO'
UNION ALL
SELECT id, 'Cacoal', 'cacoal', false, 5 FROM public.local_seo_states WHERE abbreviation = 'RO';

-- Tocantins (TO)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Palmas', 'palmas', true, 1 FROM public.local_seo_states WHERE abbreviation = 'TO'
UNION ALL
SELECT id, 'Araguaína', 'araguaina', false, 2 FROM public.local_seo_states WHERE abbreviation = 'TO'
UNION ALL
SELECT id, 'Gurupi', 'gurupi', false, 3 FROM public.local_seo_states WHERE abbreviation = 'TO'
UNION ALL
SELECT id, 'Porto Nacional', 'porto-nacional', false, 4 FROM public.local_seo_states WHERE abbreviation = 'TO'
UNION ALL
SELECT id, 'Paraíso do Tocantins', 'paraiso-do-tocantins', false, 5 FROM public.local_seo_states WHERE abbreviation = 'TO';

-- Acre (AC)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Rio Branco', 'rio-branco', true, 1 FROM public.local_seo_states WHERE abbreviation = 'AC'
UNION ALL
SELECT id, 'Cruzeiro do Sul', 'cruzeiro-do-sul', false, 2 FROM public.local_seo_states WHERE abbreviation = 'AC'
UNION ALL
SELECT id, 'Sena Madureira', 'sena-madureira', false, 3 FROM public.local_seo_states WHERE abbreviation = 'AC'
UNION ALL
SELECT id, 'Tarauacá', 'tarauaca', false, 4 FROM public.local_seo_states WHERE abbreviation = 'AC'
UNION ALL
SELECT id, 'Feijó', 'feijo', false, 5 FROM public.local_seo_states WHERE abbreviation = 'AC';

-- Amapá (AP)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Macapá', 'macapa', true, 1 FROM public.local_seo_states WHERE abbreviation = 'AP'
UNION ALL
SELECT id, 'Santana', 'santana-ap', false, 2 FROM public.local_seo_states WHERE abbreviation = 'AP'
UNION ALL
SELECT id, 'Laranjal do Jari', 'laranjal-do-jari', false, 3 FROM public.local_seo_states WHERE abbreviation = 'AP'
UNION ALL
SELECT id, 'Oiapoque', 'oiapoque', false, 4 FROM public.local_seo_states WHERE abbreviation = 'AP'
UNION ALL
SELECT id, 'Mazagão', 'mazagao', false, 5 FROM public.local_seo_states WHERE abbreviation = 'AP';

-- Roraima (RR)
INSERT INTO public.local_seo_cities (state_id, name, slug, is_capital, population_rank)
SELECT id, 'Boa Vista', 'boa-vista', true, 1 FROM public.local_seo_states WHERE abbreviation = 'RR'
UNION ALL
SELECT id, 'Rorainópolis', 'rorainopolis', false, 2 FROM public.local_seo_states WHERE abbreviation = 'RR'
UNION ALL
SELECT id, 'Caracaraí', 'caracarai', false, 3 FROM public.local_seo_states WHERE abbreviation = 'RR'
UNION ALL
SELECT id, 'Alto Alegre', 'alto-alegre', false, 4 FROM public.local_seo_states WHERE abbreviation = 'RR'
UNION ALL
SELECT id, 'Mucajaí', 'mucajai', false, 5 FROM public.local_seo_states WHERE abbreviation = 'RR';