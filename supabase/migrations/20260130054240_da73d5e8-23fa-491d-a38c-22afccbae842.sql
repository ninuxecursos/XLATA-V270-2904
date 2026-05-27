-- Páginas SEO para cidades importantes que ainda não têm conteúdo

-- Aparecida de Goiânia, GO
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-aparecida-de-goiania', 'city', s.id, c.id,
  'Sistema para Reciclagem em Aparecida de Goiânia', 'Gestão moderna para ferro velhos na região de Goiânia',
  '<h2>XLata em Aparecida de Goiânia: tecnologia para seu depósito</h2>
<p>Aparecida de Goiânia é a segunda maior cidade de Goiás e faz parte da região metropolitana de Goiânia. Os depósitos de ferro velho da cidade contam com o XLata para organizar suas operações de forma profissional.</p>
<h3>Recursos disponíveis</h3>
<ul><li>PDV de compra rápido e intuitivo</li><li>Controle de caixa em tempo real</li><li>Gestão de despesas organizada</li><li>Relatórios de lucro e desempenho</li></ul>
<h3>Toda a região metropolitana</h3>
<p>O XLata funciona em Aparecida de Goiânia, Goiânia e toda a região. Sistema 100% online.</p>
<h3>Teste grátis</h3>
<p>Cadastre-se e experimente o XLata.</p>',
  '[{"icon": "MapPin", "title": "Região Metropolitana", "description": "Funciona em toda a Grande Goiânia"}]'::jsonb,
  '[{"question": "Funciona em Aparecida de Goiânia?", "answer": "Sim! Atendemos toda a região metropolitana de Goiânia."}]'::jsonb,
  'Sistema para Ferro Velho em Aparecida de Goiânia | XLata', 'Sistema de gestão para depósitos de reciclagem em Aparecida de Goiânia. PDV, caixa e relatórios.',
  'https://xlata.site/sistema-para-reciclagem-em-aparecida-de-goiania', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'GO' AND c.slug = 'aparecida-de-goiania' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Anápolis, GO
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-anapolis', 'city', s.id, c.id,
  'Sistema para Reciclagem em Anápolis', 'Gestão profissional para ferro velhos no interior de Goiás',
  '<h2>XLata em Anápolis: organize seu depósito</h2>
<p>Anápolis é um importante polo industrial de Goiás, gerando grande volume de materiais recicláveis. O XLata ajuda os depósitos de ferro velho da cidade a trabalharem de forma organizada.</p>
<h3>Funcionalidades</h3>
<ul><li>PDV de compra simples e rápido</li><li>Controle financeiro completo</li><li>Gestão de despesas por categoria</li><li>Relatórios de desempenho</li></ul>
<h3>Polo industrial</h3>
<p>Com o DAIA e muitas indústrias, Anápolis movimenta muito material. O XLata organiza esse fluxo.</p>
<h3>Comece grátis</h3>
<p>Cadastre-se e teste o XLata.</p>',
  '[{"icon": "Factory", "title": "Polo Industrial", "description": "Ideal para alto volume de materiais"}]'::jsonb,
  '[{"question": "O XLata funciona em Anápolis?", "answer": "Sim! Sistema online, funciona perfeitamente."}]'::jsonb,
  'Sistema para Ferro Velho em Anápolis | XLata', 'Sistema de gestão para depósitos de reciclagem em Anápolis. Controle completo!',
  'https://xlata.site/sistema-para-reciclagem-em-anapolis', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'GO' AND c.slug = 'anapolis' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Contagem, MG
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-contagem', 'city', s.id, c.id,
  'Sistema para Reciclagem em Contagem', 'Gestão moderna para ferro velhos na Grande BH',
  '<h2>XLata em Contagem: tecnologia para seu depósito</h2>
<p>Contagem é a terceira maior cidade de Minas Gerais e um importante polo industrial da região metropolitana de Belo Horizonte. Os depósitos de ferro velho da cidade contam com o XLata.</p>
<h3>Recursos</h3>
<ul><li>PDV de compra ágil</li><li>Controle de caixa detalhado</li><li>Gestão de despesas</li><li>Relatórios de lucro</li></ul>
<h3>Cidade Industrial</h3>
<p>Com a Cidade Industrial, Contagem gera muito material. O XLata organiza seu negócio.</p>
<h3>Teste grátis</h3>
<p>Cadastre-se e experimente.</p>',
  '[{"icon": "Factory", "title": "Cidade Industrial", "description": "Perfeito para operações intensas"}]'::jsonb,
  '[{"question": "Funciona em Contagem?", "answer": "Sim! Atendemos Contagem e toda a Grande BH."}]'::jsonb,
  'Sistema para Ferro Velho em Contagem | XLata', 'Sistema de gestão para depósitos de reciclagem em Contagem. PDV e relatórios!',
  'https://xlata.site/sistema-para-reciclagem-em-contagem', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'MG' AND c.slug = 'contagem' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Betim, MG
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-betim', 'city', s.id, c.id,
  'Sistema para Reciclagem em Betim', 'Gestão profissional para ferro velhos no polo automotivo',
  '<h2>XLata em Betim: organize seu ferro velho</h2>
<p>Betim é sede da FIAT e um dos maiores polos industriais de Minas Gerais. Com tanta indústria, a cidade gera muito material reciclável, e o XLata ajuda a organizar.</p>
<h3>Funcionalidades</h3>
<ul><li>PDV de compra rápido</li><li>Controle financeiro</li><li>Gestão de despesas</li><li>Relatórios</li></ul>
<h3>Polo automotivo</h3>
<p>Com a FIAT e fornecedores, Betim é perfeita para reciclagem. O XLata acompanha seu ritmo.</p>
<h3>Comece grátis</h3>
<p>Cadastre-se e teste.</p>',
  '[{"icon": "Car", "title": "Polo Automotivo", "description": "Alto volume de materiais metálicos"}]'::jsonb,
  '[{"question": "O XLata funciona em Betim?", "answer": "Sim! Atendemos Betim e região."}]'::jsonb,
  'Sistema para Ferro Velho em Betim | XLata', 'Sistema de gestão para depósitos de reciclagem em Betim. Controle completo!',
  'https://xlata.site/sistema-para-reciclagem-em-betim', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'MG' AND c.slug = 'betim' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Juiz de Fora, MG
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-juiz-de-fora', 'city', s.id, c.id,
  'Sistema para Reciclagem em Juiz de Fora', 'Gestão moderna para ferro velhos na Zona da Mata',
  '<h2>XLata em Juiz de Fora: tecnologia para seu depósito</h2>
<p>Juiz de Fora é um importante polo industrial e universitário de Minas Gerais. Os depósitos de ferro velho da cidade contam com o XLata para organizar suas operações.</p>
<h3>Recursos</h3>
<ul><li>PDV intuitivo</li><li>Controle de caixa</li><li>Despesas organizadas</li><li>Relatórios claros</li></ul>
<h3>Zona da Mata</h3>
<p>O XLata funciona em Juiz de Fora e toda a região da Zona da Mata Mineira.</p>
<h3>Teste grátis</h3>
<p>Cadastre-se e experimente.</p>',
  '[{"icon": "MapPin", "title": "Zona da Mata", "description": "Atendemos toda a região"}]'::jsonb,
  '[{"question": "Funciona em Juiz de Fora?", "answer": "Sim! Sistema online, sem limitações."}]'::jsonb,
  'Sistema para Ferro Velho em Juiz de Fora | XLata', 'Sistema de gestão para depósitos de reciclagem em Juiz de Fora. PDV e relatórios!',
  'https://xlata.site/sistema-para-reciclagem-em-juiz-de-fora', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'MG' AND c.slug = 'juiz-de-fora' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Duque de Caxias, RJ
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-duque-de-caxias', 'city', s.id, c.id,
  'Sistema para Reciclagem em Duque de Caxias', 'Gestão profissional para ferro velhos na Baixada Fluminense',
  '<h2>XLata em Duque de Caxias: organize seu depósito</h2>
<p>Duque de Caxias é a terceira maior cidade do Rio de Janeiro e um importante polo industrial da Baixada Fluminense. Os depósitos de ferro velho da cidade contam com o XLata.</p>
<h3>Funcionalidades</h3>
<ul><li>PDV de compra ágil</li><li>Controle financeiro</li><li>Gestão de despesas</li><li>Relatórios de lucro</li></ul>
<h3>Baixada Fluminense</h3>
<p>O XLata funciona em toda a Baixada Fluminense: Caxias, Nova Iguaçu, São João de Meriti...</p>
<h3>Comece grátis</h3>
<p>Cadastre-se e teste.</p>',
  '[{"icon": "Factory", "title": "Polo Industrial", "description": "REDUC e muita indústria"}]'::jsonb,
  '[{"question": "Funciona em Duque de Caxias?", "answer": "Sim! Atendemos toda a Baixada Fluminense."}]'::jsonb,
  'Sistema para Ferro Velho em Duque de Caxias | XLata', 'Sistema de gestão para depósitos de reciclagem em Duque de Caxias. Controle completo!',
  'https://xlata.site/sistema-para-reciclagem-em-duque-de-caxias', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'RJ' AND c.slug = 'duque-de-caxias' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Nova Iguaçu, RJ
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-nova-iguacu', 'city', s.id, c.id,
  'Sistema para Reciclagem em Nova Iguaçu', 'Gestão moderna para ferro velhos na Baixada',
  '<h2>XLata em Nova Iguaçu: tecnologia para seu depósito</h2>
<p>Nova Iguaçu é uma das maiores cidades do Rio de Janeiro e um centro importante da Baixada Fluminense. Os depósitos de ferro velho da cidade agora contam com o XLata.</p>
<h3>Recursos</h3>
<ul><li>PDV rápido</li><li>Controle de caixa</li><li>Despesas organizadas</li><li>Relatórios</li></ul>
<h3>Baixada Fluminense</h3>
<p>O XLata funciona em Nova Iguaçu e toda a região.</p>
<h3>Teste grátis</h3>
<p>Cadastre-se e experimente.</p>',
  '[{"icon": "MapPin", "title": "Baixada Fluminense", "description": "Toda a região atendida"}]'::jsonb,
  '[{"question": "O XLata funciona em Nova Iguaçu?", "answer": "Sim! Sistema online, sem limitações."}]'::jsonb,
  'Sistema para Ferro Velho em Nova Iguaçu | XLata', 'Sistema de gestão para depósitos de reciclagem em Nova Iguaçu. PDV e relatórios!',
  'https://xlata.site/sistema-para-reciclagem-em-nova-iguacu', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'RJ' AND c.slug = 'nova-iguacu' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Niterói, RJ
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-niteroi', 'city', s.id, c.id,
  'Sistema para Reciclagem em Niterói', 'Gestão profissional para ferro velhos do outro lado da Baía',
  '<h2>XLata em Niterói: organize seu depósito</h2>
<p>Niterói tem um dos maiores PIBs per capita do Brasil e um setor de reciclagem em crescimento. Os depósitos de ferro velho da cidade contam com o XLata.</p>
<h3>Funcionalidades</h3>
<ul><li>PDV intuitivo</li><li>Controle financeiro</li><li>Gestão de despesas</li><li>Relatórios de lucro</li></ul>
<h3>Região oceânica e centro</h3>
<p>O XLata funciona em toda Niterói e São Gonçalo.</p>
<h3>Comece grátis</h3>
<p>Cadastre-se e teste.</p>',
  '[{"icon": "Waves", "title": "Do outro lado da Baía", "description": "Atendemos Niterói e região"}]'::jsonb,
  '[{"question": "Funciona em Niterói?", "answer": "Sim! Atendemos Niterói e São Gonçalo."}]'::jsonb,
  'Sistema para Ferro Velho em Niterói | XLata', 'Sistema de gestão para depósitos de reciclagem em Niterói. Controle completo!',
  'https://xlata.site/sistema-para-reciclagem-em-niteroi', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'RJ' AND c.slug = 'niteroi' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Londrina, PR
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-londrina', 'city', s.id, c.id,
  'Sistema para Reciclagem em Londrina', 'Gestão moderna para ferro velhos no Norte do Paraná',
  '<h2>XLata em Londrina: tecnologia para seu depósito</h2>
<p>Londrina é a segunda maior cidade do Paraná e um importante polo agroindustrial do Norte do estado. Os depósitos de ferro velho da cidade contam com o XLata.</p>
<h3>Recursos</h3>
<ul><li>PDV de compra rápido</li><li>Controle de caixa</li><li>Despesas organizadas</li><li>Relatórios de lucro</li></ul>
<h3>Norte do Paraná</h3>
<p>O XLata funciona em Londrina, Maringá e toda a região.</p>
<h3>Teste grátis</h3>
<p>Cadastre-se e experimente.</p>',
  '[{"icon": "Wheat", "title": "Polo Agroindustrial", "description": "Ideal para materiais do agro"}]'::jsonb,
  '[{"question": "O XLata funciona em Londrina?", "answer": "Sim! Sistema online, funciona perfeitamente."}]'::jsonb,
  'Sistema para Ferro Velho em Londrina | XLata', 'Sistema de gestão para depósitos de reciclagem em Londrina. PDV e relatórios!',
  'https://xlata.site/sistema-para-reciclagem-em-londrina', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'PR' AND c.slug = 'londrina' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Maringá, PR
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-maringa', 'city', s.id, c.id,
  'Sistema para Reciclagem em Maringá', 'Gestão profissional para ferro velhos na cidade canção',
  '<h2>XLata em Maringá: organize seu ferro velho</h2>
<p>Maringá é conhecida pela qualidade de vida e também é um importante centro econômico do Paraná. Os depósitos de ferro velho da cidade contam com o XLata.</p>
<h3>Funcionalidades</h3>
<ul><li>PDV ágil</li><li>Controle financeiro</li><li>Gestão de despesas</li><li>Relatórios</li></ul>
<h3>Cidade planejada</h3>
<p>Assim como Maringá, o XLata é bem planejado e organizado.</p>
<h3>Comece grátis</h3>
<p>Cadastre-se e teste.</p>',
  '[{"icon": "TreePine", "title": "Cidade Verde", "description": "Reciclagem que faz diferença"}]'::jsonb,
  '[{"question": "Funciona em Maringá?", "answer": "Sim! Atendemos Maringá e região."}]'::jsonb,
  'Sistema para Ferro Velho em Maringá | XLata', 'Sistema de gestão para depósitos de reciclagem em Maringá. Controle completo!',
  'https://xlata.site/sistema-para-reciclagem-em-maringa', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'PR' AND c.slug = 'maringa' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Cascavel, PR
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-cascavel', 'city', s.id, c.id,
  'Sistema para Reciclagem em Cascavel', 'Gestão moderna para ferro velhos no Oeste do Paraná',
  '<h2>XLata em Cascavel: tecnologia para seu depósito</h2>
<p>Cascavel é um polo importante do Oeste do Paraná, com forte presença do agronegócio. Os depósitos de ferro velho da cidade contam com o XLata.</p>
<h3>Recursos</h3>
<ul><li>PDV rápido</li><li>Controle de caixa</li><li>Despesas</li><li>Relatórios</li></ul>
<h3>Oeste paranaense</h3>
<p>O XLata funciona em Cascavel e toda a região oeste.</p>
<h3>Teste grátis</h3>
<p>Cadastre-se e experimente.</p>',
  '[{"icon": "Tractor", "title": "Polo Agrícola", "description": "Materiais do agronegócio"}]'::jsonb,
  '[{"question": "O XLata funciona em Cascavel?", "answer": "Sim! Sistema online, sem limitações."}]'::jsonb,
  'Sistema para Ferro Velho em Cascavel | XLata', 'Sistema de gestão para depósitos de reciclagem em Cascavel. PDV e relatórios!',
  'https://xlata.site/sistema-para-reciclagem-em-cascavel', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'PR' AND c.slug = 'cascavel' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Joinville, SC
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-joinville', 'city', s.id, c.id,
  'Sistema para Reciclagem em Joinville', 'Gestão profissional para ferro velhos na maior cidade de SC',
  '<h2>XLata em Joinville: organize seu depósito</h2>
<p>Joinville é a maior cidade de Santa Catarina e um dos maiores polos industriais do Sul do Brasil. Os depósitos de ferro velho da cidade contam com o XLata.</p>
<h3>Funcionalidades</h3>
<ul><li>PDV ágil</li><li>Controle financeiro</li><li>Gestão de despesas</li><li>Relatórios de lucro</li></ul>
<h3>Polo industrial</h3>
<p>Com muita indústria, Joinville gera toneladas de material reciclável. O XLata organiza.</p>
<h3>Comece grátis</h3>
<p>Cadastre-se e teste.</p>',
  '[{"icon": "Factory", "title": "Polo Industrial", "description": "Maior cidade de SC"}]'::jsonb,
  '[{"question": "Funciona em Joinville?", "answer": "Sim! Atendemos Joinville e região."}]'::jsonb,
  'Sistema para Ferro Velho em Joinville | XLata', 'Sistema de gestão para depósitos de reciclagem em Joinville. Controle completo!',
  'https://xlata.site/sistema-para-reciclagem-em-joinville', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'SC' AND c.slug = 'joinville' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Blumenau, SC
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-blumenau', 'city', s.id, c.id,
  'Sistema para Reciclagem em Blumenau', 'Gestão moderna para ferro velhos no Vale do Itajaí',
  '<h2>XLata em Blumenau: tecnologia para seu depósito</h2>
<p>Blumenau é um importante polo têxtil e industrial do Vale do Itajaí. Os depósitos de ferro velho da cidade contam com o XLata para organizar suas operações.</p>
<h3>Recursos</h3>
<ul><li>PDV intuitivo</li><li>Controle de caixa</li><li>Despesas organizadas</li><li>Relatórios</li></ul>
<h3>Vale do Itajaí</h3>
<p>O XLata funciona em Blumenau, Gaspar, Indaial e região.</p>
<h3>Teste grátis</h3>
<p>Cadastre-se e experimente.</p>',
  '[{"icon": "Shirt", "title": "Polo Têxtil", "description": "Muita indústria na região"}]'::jsonb,
  '[{"question": "O XLata funciona em Blumenau?", "answer": "Sim! Sistema online, funciona perfeitamente."}]'::jsonb,
  'Sistema para Ferro Velho em Blumenau | XLata', 'Sistema de gestão para depósitos de reciclagem em Blumenau. PDV e relatórios!',
  'https://xlata.site/sistema-para-reciclagem-em-blumenau', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'SC' AND c.slug = 'blumenau' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Canoas, RS
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-canoas', 'city', s.id, c.id,
  'Sistema para Reciclagem em Canoas', 'Gestão profissional para ferro velhos na Grande POA',
  '<h2>XLata em Canoas: organize seu ferro velho</h2>
<p>Canoas é a segunda maior cidade do Rio Grande do Sul e parte da região metropolitana de Porto Alegre. Os depósitos de ferro velho da cidade contam com o XLata.</p>
<h3>Funcionalidades</h3>
<ul><li>PDV rápido</li><li>Controle financeiro</li><li>Gestão de despesas</li><li>Relatórios</li></ul>
<h3>Grande Porto Alegre</h3>
<p>O XLata funciona em Canoas e toda a região metropolitana.</p>
<h3>Comece grátis</h3>
<p>Cadastre-se e teste.</p>',
  '[{"icon": "MapPin", "title": "Grande POA", "description": "Toda a região atendida"}]'::jsonb,
  '[{"question": "Funciona em Canoas?", "answer": "Sim! Atendemos Canoas e região metropolitana."}]'::jsonb,
  'Sistema para Ferro Velho em Canoas | XLata', 'Sistema de gestão para depósitos de reciclagem em Canoas. Controle completo!',
  'https://xlata.site/sistema-para-reciclagem-em-canoas', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'RS' AND c.slug = 'canoas' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Caxias do Sul, RS
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-caxias-do-sul', 'city', s.id, c.id,
  'Sistema para Reciclagem em Caxias do Sul', 'Gestão moderna para ferro velhos na Serra Gaúcha',
  '<h2>XLata em Caxias do Sul: tecnologia para seu depósito</h2>
<p>Caxias do Sul é um dos maiores polos metalmecânicos do Brasil. Com tanta indústria, a cidade gera muito material reciclável, e o XLata ajuda a organizar.</p>
<h3>Recursos</h3>
<ul><li>PDV ágil</li><li>Controle de caixa</li><li>Despesas</li><li>Relatórios de lucro</li></ul>
<h3>Polo metalmecânico</h3>
<p>Ideal para quem trabalha com alto volume de material metálico.</p>
<h3>Teste grátis</h3>
<p>Cadastre-se e experimente.</p>',
  '[{"icon": "Cog", "title": "Polo Metalmecânico", "description": "Ideal para metais"}]'::jsonb,
  '[{"question": "O XLata funciona em Caxias do Sul?", "answer": "Sim! Perfeito para o polo metalmecânico."}]'::jsonb,
  'Sistema para Ferro Velho em Caxias do Sul | XLata', 'Sistema de gestão para depósitos de reciclagem em Caxias do Sul. PDV e relatórios!',
  'https://xlata.site/sistema-para-reciclagem-em-caxias-do-sul', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'RS' AND c.slug = 'caxias-do-sul' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Pelotas, RS
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-pelotas', 'city', s.id, c.id,
  'Sistema para Reciclagem em Pelotas', 'Gestão profissional para ferro velhos no Sul do RS',
  '<h2>XLata em Pelotas: organize seu depósito</h2>
<p>Pelotas é uma importante cidade do Sul do Rio Grande do Sul. Os depósitos de ferro velho da cidade contam com o XLata para organizar suas operações.</p>
<h3>Funcionalidades</h3>
<ul><li>PDV intuitivo</li><li>Controle financeiro</li><li>Gestão de despesas</li><li>Relatórios</li></ul>
<h3>Sul gaúcho</h3>
<p>O XLata funciona em Pelotas, Rio Grande e toda a região sul.</p>
<h3>Comece grátis</h3>
<p>Cadastre-se e teste.</p>',
  '[{"icon": "MapPin", "title": "Sul do RS", "description": "Toda a região atendida"}]'::jsonb,
  '[{"question": "Funciona em Pelotas?", "answer": "Sim! Atendemos Pelotas e região."}]'::jsonb,
  'Sistema para Ferro Velho em Pelotas | XLata', 'Sistema de gestão para depósitos de reciclagem em Pelotas. Controle completo!',
  'https://xlata.site/sistema-para-reciclagem-em-pelotas', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'RS' AND c.slug = 'pelotas' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Feira de Santana, BA
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-feira-de-santana', 'city', s.id, c.id,
  'Sistema para Reciclagem em Feira de Santana', 'Gestão moderna para ferro velhos no interior da Bahia',
  '<h2>XLata em Feira de Santana: tecnologia para seu depósito</h2>
<p>Feira de Santana é a segunda maior cidade da Bahia e um importante centro comercial do Nordeste. Os depósitos de ferro velho da cidade contam com o XLata.</p>
<h3>Recursos</h3>
<ul><li>PDV rápido</li><li>Controle de caixa</li><li>Despesas organizadas</li><li>Relatórios</li></ul>
<h3>Entroncamento rodoviário</h3>
<p>Feira é cruzamento de importantes rodovias, movimentando muito material.</p>
<h3>Teste grátis</h3>
<p>Cadastre-se e experimente.</p>',
  '[{"icon": "Truck", "title": "Polo Rodoviário", "description": "Muito material em movimento"}]'::jsonb,
  '[{"question": "O XLata funciona em Feira de Santana?", "answer": "Sim! Sistema online, funciona perfeitamente."}]'::jsonb,
  'Sistema para Ferro Velho em Feira de Santana | XLata', 'Sistema de gestão para depósitos de reciclagem em Feira de Santana. PDV e relatórios!',
  'https://xlata.site/sistema-para-reciclagem-em-feira-de-santana', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'BA' AND c.slug = 'feira-de-santana' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Camaçari, BA
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-camacari', 'city', s.id, c.id,
  'Sistema para Reciclagem em Camaçari', 'Gestão profissional para ferro velhos no polo petroquímico',
  '<h2>XLata em Camaçari: organize seu depósito</h2>
<p>Camaçari abriga o maior polo petroquímico do Hemisfério Sul e gera toneladas de materiais recicláveis. Os depósitos de ferro velho da cidade contam com o XLata.</p>
<h3>Funcionalidades</h3>
<ul><li>PDV ágil</li><li>Controle financeiro</li><li>Gestão de despesas</li><li>Relatórios</li></ul>
<h3>Polo petroquímico</h3>
<p>Muito material industrial para reciclar. O XLata organiza.</p>
<h3>Comece grátis</h3>
<p>Cadastre-se e teste.</p>',
  '[{"icon": "Factory", "title": "Polo Petroquímico", "description": "Alto volume industrial"}]'::jsonb,
  '[{"question": "Funciona em Camaçari?", "answer": "Sim! Perfeito para o polo industrial."}]'::jsonb,
  'Sistema para Ferro Velho em Camaçari | XLata', 'Sistema de gestão para depósitos de reciclagem em Camaçari. Controle completo!',
  'https://xlata.site/sistema-para-reciclagem-em-camacari', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'BA' AND c.slug = 'camacari' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Olinda, PE
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-olinda', 'city', s.id, c.id,
  'Sistema para Reciclagem em Olinda', 'Gestão moderna para ferro velhos na região metropolitana do Recife',
  '<h2>XLata em Olinda: tecnologia para seu depósito</h2>
<p>Olinda, patrimônio histórico da humanidade, também abriga depósitos de reciclagem importantes. O XLata está pronto para ajudar a organizar seu negócio.</p>
<h3>Recursos</h3>
<ul><li>PDV intuitivo</li><li>Controle de caixa</li><li>Despesas</li><li>Relatórios</li></ul>
<h3>Região metropolitana</h3>
<p>O XLata funciona em Olinda, Recife e toda a RMR.</p>
<h3>Teste grátis</h3>
<p>Cadastre-se e experimente.</p>',
  '[{"icon": "Landmark", "title": "Patrimônio Histórico", "description": "Modernidade com tradição"}]'::jsonb,
  '[{"question": "O XLata funciona em Olinda?", "answer": "Sim! Atendemos toda a RMR."}]'::jsonb,
  'Sistema para Ferro Velho em Olinda | XLata', 'Sistema de gestão para depósitos de reciclagem em Olinda. PDV e relatórios!',
  'https://xlata.site/sistema-para-reciclagem-em-olinda', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'PE' AND c.slug = 'olinda' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Caucaia, CE
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-caucaia', 'city', s.id, c.id,
  'Sistema para Reciclagem em Caucaia', 'Gestão profissional para ferro velhos na Grande Fortaleza',
  '<h2>XLata em Caucaia: organize seu depósito</h2>
<p>Caucaia é a segunda maior cidade do Ceará e parte da região metropolitana de Fortaleza. Os depósitos de ferro velho da cidade contam com o XLata.</p>
<h3>Funcionalidades</h3>
<ul><li>PDV rápido</li><li>Controle financeiro</li><li>Gestão de despesas</li><li>Relatórios</li></ul>
<h3>Grande Fortaleza</h3>
<p>O XLata funciona em Caucaia e toda a região metropolitana.</p>
<h3>Comece grátis</h3>
<p>Cadastre-se e teste.</p>',
  '[{"icon": "MapPin", "title": "Grande Fortaleza", "description": "Toda a região atendida"}]'::jsonb,
  '[{"question": "Funciona em Caucaia?", "answer": "Sim! Atendemos Caucaia e região metropolitana."}]'::jsonb,
  'Sistema para Ferro Velho em Caucaia | XLata', 'Sistema de gestão para depósitos de reciclagem em Caucaia. Controle completo!',
  'https://xlata.site/sistema-para-reciclagem-em-caucaia', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'CE' AND c.slug = 'caucaia' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Maracanaú, CE
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-maracanau', 'city', s.id, c.id,
  'Sistema para Reciclagem em Maracanaú', 'Gestão moderna para ferro velhos no distrito industrial',
  '<h2>XLata em Maracanaú: tecnologia para seu depósito</h2>
<p>Maracanaú abriga o principal distrito industrial do Ceará. Com muita indústria, a cidade gera grande volume de materiais recicláveis.</p>
<h3>Recursos</h3>
<ul><li>PDV ágil</li><li>Controle de caixa</li><li>Despesas organizadas</li><li>Relatórios</li></ul>
<h3>Distrito industrial</h3>
<p>Perfeito para quem trabalha com volume industrial.</p>
<h3>Teste grátis</h3>
<p>Cadastre-se e experimente.</p>',
  '[{"icon": "Factory", "title": "Distrito Industrial", "description": "Alto volume de materiais"}]'::jsonb,
  '[{"question": "O XLata funciona em Maracanaú?", "answer": "Sim! Ideal para o polo industrial."}]'::jsonb,
  'Sistema para Ferro Velho em Maracanaú | XLata', 'Sistema de gestão para depósitos de reciclagem em Maracanaú. PDV e relatórios!',
  'https://xlata.site/sistema-para-reciclagem-em-maracanau', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'CE' AND c.slug = 'maracanau' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Ananindeua, PA
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-ananindeua', 'city', s.id, c.id,
  'Sistema para Reciclagem em Ananindeua', 'Gestão profissional para ferro velhos na Grande Belém',
  '<h2>XLata em Ananindeua: organize seu depósito</h2>
<p>Ananindeua é a segunda maior cidade do Pará e parte da região metropolitana de Belém. Os depósitos de ferro velho da cidade contam com o XLata.</p>
<h3>Funcionalidades</h3>
<ul><li>PDV intuitivo</li><li>Controle financeiro</li><li>Gestão de despesas</li><li>Relatórios</li></ul>
<h3>Grande Belém</h3>
<p>O XLata funciona em Ananindeua, Belém e toda a região metropolitana.</p>
<h3>Comece grátis</h3>
<p>Cadastre-se e teste.</p>',
  '[{"icon": "MapPin", "title": "Grande Belém", "description": "Toda a região atendida"}]'::jsonb,
  '[{"question": "Funciona em Ananindeua?", "answer": "Sim! Atendemos toda a Grande Belém."}]'::jsonb,
  'Sistema para Ferro Velho em Ananindeua | XLata', 'Sistema de gestão para depósitos de reciclagem em Ananindeua. Controle completo!',
  'https://xlata.site/sistema-para-reciclagem-em-ananindeua', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'PA' AND c.slug = 'ananindeua' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Cariacica, ES
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-cariacica', 'city', s.id, c.id,
  'Sistema para Reciclagem em Cariacica', 'Gestão moderna para ferro velhos na Grande Vitória',
  '<h2>XLata em Cariacica: tecnologia para seu depósito</h2>
<p>Cariacica é uma das maiores cidades do Espírito Santo e parte da região metropolitana de Vitória. Os depósitos de ferro velho da cidade contam com o XLata.</p>
<h3>Recursos</h3>
<ul><li>PDV rápido</li><li>Controle de caixa</li><li>Despesas</li><li>Relatórios</li></ul>
<h3>Grande Vitória</h3>
<p>O XLata funciona em Cariacica, Vitória, Vila Velha e Serra.</p>
<h3>Teste grátis</h3>
<p>Cadastre-se e experimente.</p>',
  '[{"icon": "MapPin", "title": "Grande Vitória", "description": "Toda a região atendida"}]'::jsonb,
  '[{"question": "O XLata funciona em Cariacica?", "answer": "Sim! Atendemos toda a Grande Vitória."}]'::jsonb,
  'Sistema para Ferro Velho em Cariacica | XLata', 'Sistema de gestão para depósitos de reciclagem em Cariacica. PDV e relatórios!',
  'https://xlata.site/sistema-para-reciclagem-em-cariacica', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'ES' AND c.slug = 'cariacica' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Dourados, MS
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 'sistema-para-reciclagem-em-dourados', 'city', s.id, c.id,
  'Sistema para Reciclagem em Dourados', 'Gestão profissional para ferro velhos no interior do MS',
  '<h2>XLata em Dourados: organize seu depósito</h2>
<p>Dourados é a segunda maior cidade do Mato Grosso do Sul e um importante polo agroindustrial. Os depósitos de ferro velho da cidade contam com o XLata.</p>
<h3>Funcionalidades</h3>
<ul><li>PDV ágil</li><li>Controle financeiro</li><li>Gestão de despesas</li><li>Relatórios</li></ul>
<h3>Polo agroindustrial</h3>
<p>Muita indústria agrícola gera material reciclável. O XLata organiza.</p>
<h3>Comece grátis</h3>
<p>Cadastre-se e teste.</p>',
  '[{"icon": "Wheat", "title": "Polo Agrícola", "description": "Materiais do agronegócio"}]'::jsonb,
  '[{"question": "Funciona em Dourados?", "answer": "Sim! Sistema online, funciona perfeitamente."}]'::jsonb,
  'Sistema para Ferro Velho em Dourados | XLata', 'Sistema de gestão para depósitos de reciclagem em Dourados. Controle completo!',
  'https://xlata.site/sistema-para-reciclagem-em-dourados', 'published', true, 0.6, 'monthly', 0
FROM local_seo_states s, local_seo_cities c WHERE s.abbreviation = 'MS' AND c.slug = 'dourados' AND c.state_id = s.id AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);