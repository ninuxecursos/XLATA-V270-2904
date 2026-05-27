-- Create initial local SEO pages with unique content
-- Page 1: Estado de São Paulo
INSERT INTO public.local_seo_pages (
  slug, page_type, state_id, headline, subheadline, content_html, features, faq,
  seo_title, seo_description, canonical_url, schema_data, status, allow_indexing
)
SELECT 
  'sistema-para-ferro-velho-em-sao-paulo',
  'state',
  s.id,
  'Sistema para Ferro Velho em São Paulo',
  'Controle completo para depósitos de reciclagem em todo o estado de São Paulo. 100% online, acesse de qualquer cidade.',
  '<h2>O XLata atende todo o estado de São Paulo</h2>
<p>São Paulo é o maior polo de reciclagem do Brasil, com milhares de depósitos de ferro velho e sucata espalhados por todas as regiões do estado. O XLata foi desenvolvido pensando na realidade desses empresários: operação rápida, controle financeiro preciso e relatórios que fazem sentido.</p>

<h3>Por que usar um sistema online para seu ferro velho?</h3>
<p>Diferente de sistemas instalados que dependem de um computador específico, o XLata funciona em qualquer dispositivo com internet. Isso significa que você pode:</p>
<ul>
<li>Acompanhar seu depósito mesmo quando não está fisicamente presente</li>
<li>Consultar relatórios pelo celular enquanto visita fornecedores</li>
<li>Ter seus dados sempre seguros na nuvem, sem risco de perder informações</li>
</ul>

<h3>Funcionalidades pensadas para o dia a dia</h3>
<p>O sistema XLata oferece tudo que um depósito de reciclagem precisa: PDV de compra para registrar materiais, controle de caixa com entradas e saídas, registro de despesas por categoria, e relatórios de lucro baseados no seu estoque real.</p>

<h3>Atendimento em todas as regiões</h3>
<p>Seja na capital, no ABC Paulista, na região de Campinas, no litoral ou no interior, o XLata está pronto para atender seu depósito. Por ser 100% online, não importa sua localização – você terá acesso a todas as funcionalidades.</p>',
  '[
    {"icon": "Scale", "title": "Pesagem Precisa", "description": "Calcule valores com precisão, evitando erros e discussões com fornecedores."},
    {"icon": "Receipt", "title": "Comprovantes Profissionais", "description": "Imprima recibos completos que geram confiança nos seus fornecedores."},
    {"icon": "BarChart3", "title": "Relatórios Completos", "description": "Acompanhe compras, vendas e lucro de forma simples e visual."},
    {"icon": "Smartphone", "title": "100% Online", "description": "Acesse de qualquer lugar do estado de São Paulo."},
    {"icon": "ShieldCheck", "title": "Dados Seguros", "description": "Suas informações protegidas com criptografia bancária."},
    {"icon": "Headphones", "title": "Suporte WhatsApp", "description": "Atendimento rápido quando você precisar."}
  ]'::jsonb,
  '[
    {"question": "O XLata funciona em todas as cidades de São Paulo?", "answer": "Sim! O XLata é 100% online e funciona em qualquer cidade do estado, desde a capital até o interior mais distante."},
    {"question": "Preciso instalar algo no computador?", "answer": "Não, o XLata funciona direto no navegador. Basta acessar o site e fazer login. Funciona em computador, tablet e celular."},
    {"question": "Como funciona o suporte?", "answer": "Oferecemos suporte por WhatsApp para tirar dúvidas e ajudar na configuração. Atendimento rápido e humanizado."},
    {"question": "Posso testar antes de assinar?", "answer": "Sim! Você tem 7 dias grátis para testar todas as funções. Não precisa de cartão de crédito."}
  ]'::jsonb,
  'Sistema para Ferro Velho em São Paulo | XLata',
  'Sistema completo para depósitos de reciclagem e ferro velho em São Paulo. Controle de caixa, PDV de compra, relatórios. Teste grátis 7 dias.',
  'https://xlata.site/sistema-para-ferro-velho-em-sao-paulo',
  '{"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "XLata - Sistema para Ferro Velho em São Paulo", "applicationCategory": "BusinessApplication", "areaServed": {"@type": "State", "name": "São Paulo"}}'::jsonb,
  'published',
  true
FROM public.local_seo_states s WHERE s.abbreviation = 'SP';

-- Page 2: Cidade de São Paulo (capital)
INSERT INTO public.local_seo_pages (
  slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq,
  seo_title, seo_description, canonical_url, schema_data, status, allow_indexing
)
SELECT 
  'sistema-para-reciclagem-em-sao-paulo',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em São Paulo Capital',
  'Gerencie seu depósito de reciclagem na maior cidade do Brasil. Sistema online, simples e seguro.',
  '<h2>XLata: O sistema ideal para ferro velhos na cidade de São Paulo</h2>
<p>A capital paulista concentra uma enorme quantidade de depósitos de reciclagem, desde pequenos ferros velhos de bairro até grandes centros de processamento. O XLata foi criado para atender a todos, independente do tamanho da operação.</p>

<h3>Desafios específicos da capital</h3>
<p>Operar um depósito de reciclagem em São Paulo tem seus desafios: alta rotatividade de fornecedores, concorrência acirrada por preços, e a necessidade de ter controle financeiro rigoroso. O XLata ajuda você a enfrentar cada um desses desafios:</p>
<ul>
<li>Registro rápido de compras para não formar filas</li>
<li>Histórico de preços para acompanhar o mercado</li>
<li>Relatórios de lucro para saber exatamente quanto está ganhando</li>
</ul>

<h3>Funciona em qualquer zona da cidade</h3>
<p>Da Zona Leste à Zona Oeste, do Centro ao extremo Sul, o XLata atende depósitos em toda São Paulo. Por ser um sistema online, você só precisa de internet – sem necessidade de servidores locais ou instalações complexas.</p>

<h3>Suporte dedicado para a capital</h3>
<p>Entendemos a correria do dia a dia paulistano. Por isso, nosso suporte por WhatsApp é rápido e direto ao ponto. Precisa de ajuda? Envie uma mensagem e resolvemos.</p>',
  '[
    {"icon": "Scale", "title": "Operação Rápida", "description": "Sistema ágil para não formar filas no seu depósito."},
    {"icon": "Receipt", "title": "Recibos Automáticos", "description": "Comprovantes profissionais para todos os fornecedores."},
    {"icon": "BarChart3", "title": "Controle de Lucro", "description": "Saiba exatamente quanto está ganhando por material."},
    {"icon": "Smartphone", "title": "Acesso Mobile", "description": "Acompanhe seu depósito pelo celular de qualquer lugar."}
  ]'::jsonb,
  '[
    {"question": "O sistema funciona em todas as zonas de São Paulo?", "answer": "Sim! O XLata é online e funciona em qualquer bairro da cidade, da Zona Norte à Zona Sul, do Centro ao extremo Leste."},
    {"question": "Meu depósito é pequeno, o XLata serve para mim?", "answer": "Com certeza! O XLata foi feito para depósitos de todos os tamanhos. O plano básico atende perfeitamente operações menores."},
    {"question": "Como faço para começar a usar?", "answer": "É simples: crie sua conta, configure seus materiais e preços, e comece a usar. O teste de 7 dias é grátis."}
  ]'::jsonb,
  'Sistema para Reciclagem em São Paulo Capital | XLata',
  'Sistema para depósitos de reciclagem em São Paulo capital. Controle de caixa, compra de materiais, relatórios de lucro. 7 dias grátis.',
  'https://xlata.site/sistema-para-reciclagem-em-sao-paulo',
  '{"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "XLata - Sistema para Reciclagem em São Paulo", "applicationCategory": "BusinessApplication", "areaServed": {"@type": "City", "name": "São Paulo", "containedInPlace": {"@type": "State", "name": "São Paulo"}}}'::jsonb,
  'published',
  true
FROM public.local_seo_states s
JOIN public.local_seo_cities c ON c.state_id = s.id AND c.slug = 'sao-paulo'
WHERE s.abbreviation = 'SP';

-- Page 3: Belo Horizonte
INSERT INTO public.local_seo_pages (
  slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq,
  seo_title, seo_description, canonical_url, schema_data, status, allow_indexing
)
SELECT 
  'sistema-para-reciclagem-em-belo-horizonte',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Belo Horizonte',
  'Controle seu ferro velho na capital mineira com o sistema mais completo do Brasil. 100% online e seguro.',
  '<h2>XLata em Belo Horizonte: sistema feito para o jeito mineiro de trabalhar</h2>
<p>Belo Horizonte e região metropolitana formam um dos maiores polos de reciclagem de Minas Gerais. O XLata entende as particularidades do mercado mineiro e oferece um sistema que simplifica a gestão do seu depósito.</p>

<h3>Controle financeiro que faz sentido</h3>
<p>Mineiro é conhecido por ser bom de conta. O XLata combina com esse perfil: controle preciso de caixa, registro detalhado de cada compra, e relatórios que mostram exatamente onde está o lucro do seu negócio.</p>

<h3>Atendimento em toda a Grande BH</h3>
<p>Contagem, Betim, Ribeirão das Neves, Santa Luzia... não importa onde fica seu depósito na região metropolitana, o XLata atende. Por ser 100% online, você acessa de qualquer lugar com internet.</p>

<h3>Suporte que entende seu negócio</h3>
<p>Nosso time de suporte conhece a realidade dos depósitos de reciclagem. Quando você precisa de ajuda, falamos a sua língua e resolvemos rápido.</p>',
  '[
    {"icon": "Scale", "title": "Precisão nas Contas", "description": "Calcule valores exatos, do jeito que mineiro gosta."},
    {"icon": "Receipt", "title": "Comprovantes Claros", "description": "Recibos detalhados para fornecedores e clientes."},
    {"icon": "BarChart3", "title": "Relatórios de Lucro", "description": "Saiba exatamente quanto sobra no final do dia."},
    {"icon": "Smartphone", "title": "Acesso de Qualquer Lugar", "description": "Acompanhe seu depósito pelo celular."}
  ]'::jsonb,
  '[
    {"question": "O XLata atende também na região metropolitana de BH?", "answer": "Sim! O sistema é online e funciona em toda a Grande BH: Contagem, Betim, Ribeirão das Neves, Santa Luzia e demais cidades."},
    {"question": "O sistema é complicado de usar?", "answer": "Não! O XLata foi feito para ser simples. A maioria dos donos de ferro velho aprende a usar em menos de 1 hora."},
    {"question": "Posso testar antes de pagar?", "answer": "Claro! São 7 dias grátis para testar todas as funções, sem precisar colocar cartão de crédito."}
  ]'::jsonb,
  'Sistema para Reciclagem em Belo Horizonte | XLata',
  'Sistema para ferro velho e reciclagem em Belo Horizonte e região. Controle de caixa, PDV, relatórios. Teste grátis 7 dias.',
  'https://xlata.site/sistema-para-reciclagem-em-belo-horizonte',
  '{"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "XLata - Sistema para Reciclagem em Belo Horizonte", "applicationCategory": "BusinessApplication", "areaServed": {"@type": "City", "name": "Belo Horizonte", "containedInPlace": {"@type": "State", "name": "Minas Gerais"}}}'::jsonb,
  'published',
  true
FROM public.local_seo_states s
JOIN public.local_seo_cities c ON c.state_id = s.id AND c.slug = 'belo-horizonte'
WHERE s.abbreviation = 'MG';