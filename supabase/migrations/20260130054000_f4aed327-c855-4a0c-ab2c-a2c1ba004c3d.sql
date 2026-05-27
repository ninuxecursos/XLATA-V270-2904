-- Continuação: Páginas SEO para capitais restantes

-- Natal, RN
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-natal',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Natal',
  'Gestão moderna para ferro velhos potiguares',
  '<h2>XLata em Natal: tecnologia para o RN</h2>
<p>Natal, a cidade do sol, também é um importante centro de reciclagem do Rio Grande do Norte. Os depósitos de ferro velho da capital potiguar agora contam com o XLata para modernizar sua gestão.</p>

<h3>O que oferecemos</h3>
<p>Sistema completo para seu depósito:</p>
<ul>
<li>PDV de compra rápido e intuitivo</li>
<li>Controle de caixa em tempo real</li>
<li>Gestão de despesas organizada</li>
<li>Relatórios de lucro e desempenho</li>
</ul>

<h3>Natal e região</h3>
<p>Zona Norte, Zona Sul, Parnamirim, Macaíba... o XLata funciona em toda a Grande Natal.</p>

<h3>Sistema leve e rápido</h3>
<p>O XLata foi desenvolvido para funcionar bem em qualquer conexão. Você não precisa de internet ultra-rápida.</p>

<h3>Teste grátis</h3>
<p>Cadastre-se e experimente o XLata em Natal.</p>',
  '[{"icon": "Sun", "title": "Cidade do Sol", "description": "Sistema que funciona o ano todo"}, {"icon": "Wifi", "title": "100% Online", "description": "Acesse de qualquer lugar"}, {"icon": "ThumbsUp", "title": "Fácil de Usar", "description": "Aprenda em minutos"}]'::jsonb,
  '[{"question": "O XLata funciona em Natal?", "answer": "Sim! Atendemos Natal e toda a região metropolitana."}, {"question": "É adequado para iniciantes?", "answer": "Sim! O sistema é muito fácil de aprender."}, {"question": "Tem custo de instalação?", "answer": "Não! Só paga a mensalidade, sem custos extras."}]'::jsonb,
  'Sistema para Ferro Velho em Natal | XLata',
  'Sistema de gestão para depósitos de reciclagem em Natal e RN. PDV, controle de caixa e relatórios. Experimente grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-natal',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'RN' AND c.slug = 'natal' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- João Pessoa, PB
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-joao-pessoa',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em João Pessoa',
  'Gestão profissional para ferro velhos paraibanos',
  '<h2>XLata em João Pessoa: organize seu depósito</h2>
<p>João Pessoa é a capital mais antiga do Brasil e tem um setor de reciclagem em crescimento. Os depósitos de ferro velho da cidade agora podem contar com tecnologia moderna para organizar suas operações.</p>

<h3>Funcionalidades completas</h3>
<p>O XLata oferece recursos essenciais:</p>
<ul>
<li>PDV de compra ágil e intuitivo</li>
<li>Controle financeiro detalhado</li>
<li>Gestão de despesas categorizada</li>
<li>Relatórios de performance e lucro</li>
</ul>

<h3>João Pessoa e região</h3>
<p>Mangabeira, Bancários, Cabedelo, Bayeux... o XLata atende toda a Grande João Pessoa.</p>

<h3>Tradição com modernidade</h3>
<p>Assim como a cidade, o XLata une tradição de confiabilidade com tecnologia de ponta.</p>

<h3>Comece agora</h3>
<p>Cadastre-se gratuitamente e teste o XLata.</p>',
  '[{"icon": "History", "title": "Confiável", "description": "Sistema sólido e estável"}, {"icon": "Smartphone", "title": "Mobile Friendly", "description": "Funciona no celular também"}, {"icon": "Award", "title": "Qualidade", "description": "Desenvolvido com excelência"}]'::jsonb,
  '[{"question": "Funciona em João Pessoa?", "answer": "Sim! Atendemos a capital e toda a região."}, {"question": "Posso usar no celular?", "answer": "Sim! O sistema funciona perfeitamente no navegador do celular."}, {"question": "O suporte é rápido?", "answer": "Sim! Atendimento via WhatsApp com resposta rápida."}]'::jsonb,
  'Sistema para Ferro Velho em João Pessoa | XLata',
  'Sistema de gestão para depósitos de reciclagem em João Pessoa e Paraíba. Controle total do seu negócio!',
  'https://xlata.site/sistema-para-reciclagem-em-joao-pessoa',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'PB' AND c.slug = 'joao-pessoa' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- São Luís, MA
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-sao-luis',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em São Luís',
  'Gestão moderna para ferro velhos maranhenses',
  '<h2>XLata em São Luís: tecnologia para o Maranhão</h2>
<p>São Luís, a única capital brasileira fundada por franceses, é também um importante polo de reciclagem do Nordeste. O XLata chegou para ajudar os depósitos de ferro velho da ilha a organizarem suas operações.</p>

<h3>Recursos disponíveis</h3>
<p>Sistema completo para sua gestão:</p>
<ul>
<li>PDV de compra rápido e preciso</li>
<li>Controle de caixa em tempo real</li>
<li>Gestão de despesas organizada</li>
<li>Relatórios de lucro e análise</li>
</ul>

<h3>Ilha e continente</h3>
<p>O XLata funciona em toda São Luís e região, incluindo Paço do Lumiar, Raposa e São José de Ribamar.</p>

<h3>Patrimônio digital</h3>
<p>Assim como a cidade preserva seu patrimônio histórico, o XLata preserva os dados do seu negócio com segurança.</p>

<h3>Teste grátis</h3>
<p>Cadastre-se e experimente o XLata em São Luís.</p>',
  '[{"icon": "Castle", "title": "Tradição", "description": "Confiabilidade que você pode contar"}, {"icon": "Lock", "title": "Dados Seguros", "description": "Backup automático diário"}, {"icon": "Headphones", "title": "Suporte", "description": "Atendimento humanizado"}]'::jsonb,
  '[{"question": "O XLata funciona em São Luís?", "answer": "Sim! Atendemos toda a ilha e região."}, {"question": "Meus dados ficam seguros?", "answer": "Sim! Usamos criptografia e backup automático."}, {"question": "Quanto tempo para começar?", "answer": "Em minutos você já está usando o sistema."}]'::jsonb,
  'Sistema para Ferro Velho em São Luís | XLata',
  'Sistema de gestão para depósitos de reciclagem em São Luís e Maranhão. PDV, caixa e relatórios. Grátis para testar!',
  'https://xlata.site/sistema-para-reciclagem-em-sao-luis',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'MA' AND c.slug = 'sao-luis' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Teresina, PI
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-teresina',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Teresina',
  'Gestão profissional para ferro velhos piauienses',
  '<h2>XLata em Teresina: organização para seu depósito</h2>
<p>Teresina é a única capital do Nordeste que não está no litoral, e tem um mercado de reciclagem em crescimento. O XLata chegou para ajudar os depósitos de ferro velho da capital piauiense.</p>

<h3>O que oferecemos</h3>
<p>Ferramentas essenciais:</p>
<ul>
<li>PDV de compra simples e rápido</li>
<li>Controle financeiro completo</li>
<li>Gestão de despesas por categoria</li>
<li>Relatórios de desempenho</li>
</ul>

<h3>Teresina e região</h3>
<p>Centro, zonas da cidade e municípios próximos como Timon... o XLata funciona em toda a região.</p>

<h3>Resistente ao calor</h3>
<p>Sistema na nuvem significa menos equipamentos no local. Seus dados ficam seguros e frescos.</p>

<h3>Comece grátis</h3>
<p>Faça seu cadastro e teste o XLata em Teresina.</p>',
  '[{"icon": "Flame", "title": "Sistema Robusto", "description": "Aguenta o ritmo intenso"}, {"icon": "Cloud", "title": "Na Nuvem", "description": "Sem equipamentos locais"}, {"icon": "DollarSign", "title": "Preço Justo", "description": "R$ 49,90/mês, sem surpresas"}]'::jsonb,
  '[{"question": "Funciona em Teresina?", "answer": "Sim! O XLata é online e funciona perfeitamente na capital."}, {"question": "Atende Timon também?", "answer": "Sim! Funciona em qualquer lugar com internet."}, {"question": "É caro?", "answer": "Não! Apenas R$ 49,90/mês com tudo incluso."}]'::jsonb,
  'Sistema para Ferro Velho em Teresina | XLata',
  'Sistema de gestão para depósitos de reciclagem em Teresina e Piauí. Controle completo. Teste grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-teresina',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'PI' AND c.slug = 'teresina' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Maceió, AL
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-maceio',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Maceió',
  'Gestão moderna para ferro velhos alagoanos',
  '<h2>XLata em Maceió: tecnologia para Alagoas</h2>
<p>Maceió, com suas praias paradisíacas, também abriga um setor de reciclagem importante. Os depósitos de ferro velho da capital alagoana agora contam com o XLata para organizar seus negócios.</p>

<h3>Funcionalidades disponíveis</h3>
<p>Sistema completo:</p>
<ul>
<li>PDV de compra intuitivo</li>
<li>Controle de caixa detalhado</li>
<li>Gestão de despesas categorizada</li>
<li>Relatórios de lucro e performance</li>
</ul>

<h3>Maceió e região</h3>
<p>Centro, Pajuçara, Ponta Verde, Benedito Bentes... o XLata funciona em toda a capital e arredores.</p>

<h3>Mar de possibilidades</h3>
<p>Com organização, seu depósito pode crescer muito mais. O XLata ajuda você nessa jornada.</p>

<h3>Experimente grátis</h3>
<p>Cadastre-se e teste o XLata em Maceió.</p>',
  '[{"icon": "Waves", "title": "Sistema Fluido", "description": "Navegação simples e intuitiva"}, {"icon": "TrendingUp", "title": "Crescimento", "description": "Ferramentas para expandir"}, {"icon": "HeartHandshake", "title": "Parceria", "description": "Suporte que ajuda de verdade"}]'::jsonb,
  '[{"question": "O XLata funciona em Maceió?", "answer": "Sim! Atendemos Maceió e todo Alagoas."}, {"question": "É complicado de usar?", "answer": "Não! O sistema é muito intuitivo."}, {"question": "Posso cancelar quando quiser?", "answer": "Sim! Sem fidelidade ou multas."}]'::jsonb,
  'Sistema para Ferro Velho em Maceió | XLata',
  'Sistema de gestão para depósitos de reciclagem em Maceió e Alagoas. PDV, caixa e relatórios. Grátis para testar!',
  'https://xlata.site/sistema-para-reciclagem-em-maceio',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'AL' AND c.slug = 'maceio' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Aracaju, SE
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-aracaju',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Aracaju',
  'Gestão profissional para ferro velhos sergipanos',
  '<h2>XLata em Aracaju: organize seu depósito</h2>
<p>Aracaju é a menor capital do Nordeste em extensão, mas tem um setor de reciclagem ativo. O XLata chegou para ajudar os depósitos de ferro velho sergipanos a crescerem de forma organizada.</p>

<h3>Recursos disponíveis</h3>
<p>Tudo que você precisa:</p>
<ul>
<li>PDV de compra rápido</li>
<li>Controle de caixa completo</li>
<li>Gestão de despesas</li>
<li>Relatórios de lucro</li>
</ul>

<h3>Aracaju e região</h3>
<p>Centro, Jardins, Nossa Senhora do Socorro, São Cristóvão... o XLata funciona em toda a região.</p>

<h3>Tamanho não é documento</h3>
<p>O XLata atende desde pequenos depósitos até grandes operações. O que importa é organização.</p>

<h3>Teste grátis</h3>
<p>Cadastre-se e experimente o XLata em Aracaju.</p>',
  '[{"icon": "Scaling", "title": "Para Todos os Tamanhos", "description": "Pequeno ou grande depósito"}, {"icon": "MapPin", "title": "Todo Sergipe", "description": "Capital e interior"}, {"icon": "CheckCircle", "title": "Simples", "description": "Sem complicação"}]'::jsonb,
  '[{"question": "O sistema funciona em Aracaju?", "answer": "Sim! Atendemos Aracaju e todo Sergipe."}, {"question": "Serve para depósito pequeno?", "answer": "Sim! O XLata atende todos os tamanhos."}, {"question": "Tem taxa de adesão?", "answer": "Não! Só paga a mensalidade."}]'::jsonb,
  'Sistema para Ferro Velho em Aracaju | XLata',
  'Sistema de gestão para depósitos de reciclagem em Aracaju e Sergipe. Controle completo. Experimente grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-aracaju',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'SE' AND c.slug = 'aracaju' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Porto Velho, RO
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-porto-velho',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Porto Velho',
  'Gestão moderna para ferro velhos rondonienses',
  '<h2>XLata em Porto Velho: tecnologia para Rondônia</h2>
<p>Porto Velho é a capital de Rondônia e um importante polo econômico do Norte. Os depósitos de ferro velho da cidade agora contam com o XLata para modernizar suas operações.</p>

<h3>O que oferecemos</h3>
<p>Sistema completo:</p>
<ul>
<li>PDV de compra intuitivo</li>
<li>Controle financeiro detalhado</li>
<li>Gestão de despesas organizada</li>
<li>Relatórios de performance</li>
</ul>

<h3>Porto Velho e região</h3>
<p>O XLata funciona em toda a capital e interior de Rondônia.</p>

<h3>Fronteira digital</h3>
<p>Não importa a distância – o XLata é online e funciona em qualquer lugar com internet.</p>

<h3>Comece grátis</h3>
<p>Cadastre-se e teste o XLata em Porto Velho.</p>',
  '[{"icon": "Globe", "title": "Sem Fronteiras", "description": "Funciona em qualquer lugar"}, {"icon": "Shield", "title": "Seguro", "description": "Dados protegidos na nuvem"}, {"icon": "Zap", "title": "Rápido", "description": "Sistema leve e ágil"}]'::jsonb,
  '[{"question": "Funciona em Porto Velho?", "answer": "Sim! O XLata é online e funciona perfeitamente."}, {"question": "Mesmo distante, tem suporte?", "answer": "Sim! Suporte via WhatsApp para todo o Brasil."}, {"question": "Precisa de internet boa?", "answer": "Não! O sistema é leve e funciona em qualquer conexão."}]'::jsonb,
  'Sistema para Ferro Velho em Porto Velho | XLata',
  'Sistema de gestão para depósitos de reciclagem em Porto Velho e Rondônia. PDV, caixa e relatórios. Teste grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-porto-velho',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'RO' AND c.slug = 'porto-velho' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Rio Branco, AC
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-rio-branco',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Rio Branco',
  'Gestão profissional para ferro velhos acreanos',
  '<h2>XLata em Rio Branco: tecnologia para o Acre</h2>
<p>Rio Branco é a capital do Acre e, apesar da distância dos grandes centros, tem um setor de reciclagem em funcionamento. O XLata traz tecnologia de ponta para os depósitos de ferro velho acreanos.</p>

<h3>Recursos disponíveis</h3>
<p>Sistema completo:</p>
<ul>
<li>PDV de compra rápido</li>
<li>Controle de caixa completo</li>
<li>Gestão de despesas</li>
<li>Relatórios de lucro</li>
</ul>

<h3>Rio Branco e região</h3>
<p>O XLata funciona em toda a capital e interior do Acre.</p>

<h3>Tecnologia sem fronteiras</h3>
<p>O XLata é 100% online e funciona em qualquer lugar do Brasil.</p>

<h3>Experimente grátis</h3>
<p>Cadastre-se e teste o XLata em Rio Branco.</p>',
  '[{"icon": "MapPinned", "title": "Todo o Acre", "description": "Capital e interior"}, {"icon": "Wifi", "title": "100% Online", "description": "Funciona com internet"}, {"icon": "Heart", "title": "Suporte Dedicado", "description": "Atendimento humanizado"}]'::jsonb,
  '[{"question": "O XLata funciona no Acre?", "answer": "Sim! Sistema online, funciona em qualquer lugar."}, {"question": "O suporte atende minha região?", "answer": "Sim! Atendemos todo o Brasil via WhatsApp."}, {"question": "É fácil de usar?", "answer": "Sim! Sistema intuitivo, aprenda em minutos."}]'::jsonb,
  'Sistema para Ferro Velho em Rio Branco | XLata',
  'Sistema de gestão para depósitos de reciclagem em Rio Branco e Acre. Controle completo. Experimente grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-rio-branco',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'AC' AND c.slug = 'rio-branco' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Macapá, AP
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-macapa',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Macapá',
  'Gestão moderna para ferro velhos amapaenses',
  '<h2>XLata em Macapá: tecnologia para o Amapá</h2>
<p>Macapá é a única capital brasileira cortada pela linha do Equador. Os depósitos de ferro velho da cidade agora contam com o XLata para organizar suas operações de forma profissional.</p>

<h3>O que oferecemos</h3>
<p>Ferramentas essenciais:</p>
<ul>
<li>PDV de compra intuitivo</li>
<li>Controle financeiro completo</li>
<li>Gestão de despesas por categoria</li>
<li>Relatórios de desempenho</li>
</ul>

<h3>Macapá e região</h3>
<p>O XLata funciona em toda a capital e municípios vizinhos.</p>

<h3>Cruzando fronteiras</h3>
<p>Assim como a cidade está em dois hemisférios, o XLata cruza barreiras para levar tecnologia a você.</p>

<h3>Teste grátis</h3>
<p>Cadastre-se e experimente o XLata em Macapá.</p>',
  '[{"icon": "Compass", "title": "Sem Limites", "description": "Tecnologia para qualquer lugar"}, {"icon": "Cloud", "title": "Na Nuvem", "description": "Dados seguros e acessíveis"}, {"icon": "Smile", "title": "Fácil", "description": "Sistema simples de usar"}]'::jsonb,
  '[{"question": "O XLata funciona em Macapá?", "answer": "Sim! Sistema online, funciona em todo o Amapá."}, {"question": "Preciso de equipamento especial?", "answer": "Não! Qualquer computador ou celular com internet."}, {"question": "Quanto custa?", "answer": "Apenas R$ 49,90/mês, tudo incluso."}]'::jsonb,
  'Sistema para Ferro Velho em Macapá | XLata',
  'Sistema de gestão para depósitos de reciclagem em Macapá e Amapá. PDV, caixa e relatórios. Grátis para testar!',
  'https://xlata.site/sistema-para-reciclagem-em-macapa',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'AP' AND c.slug = 'macapa' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Boa Vista, RR
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-boa-vista',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Boa Vista',
  'Gestão profissional para ferro velhos roraimenses',
  '<h2>XLata em Boa Vista: tecnologia para Roraima</h2>
<p>Boa Vista é a capital mais setentrional do Brasil e, mesmo distante dos grandes centros, merece tecnologia de qualidade. O XLata chegou para ajudar os depósitos de ferro velho roraimenses.</p>

<h3>Recursos disponíveis</h3>
<p>Sistema completo:</p>
<ul>
<li>PDV de compra rápido</li>
<li>Controle de caixa detalhado</li>
<li>Gestão de despesas organizada</li>
<li>Relatórios de lucro e performance</li>
</ul>

<h3>Boa Vista e região</h3>
<p>O XLata funciona em toda a capital e interior de Roraima.</p>

<h3>Norte conectado</h3>
<p>O XLata é 100% online e leva tecnologia para qualquer lugar do Brasil.</p>

<h3>Comece grátis</h3>
<p>Cadastre-se e teste o XLata em Boa Vista.</p>',
  '[{"icon": "Star", "title": "Estrela do Norte", "description": "Tecnologia que chega a você"}, {"icon": "Wifi", "title": "Online", "description": "Funciona com internet"}, {"icon": "ThumbsUp", "title": "Simples", "description": "Fácil de aprender e usar"}]'::jsonb,
  '[{"question": "O XLata funciona em Boa Vista?", "answer": "Sim! Sistema online, funciona perfeitamente."}, {"question": "O suporte atende o Norte?", "answer": "Sim! Atendemos todo o Brasil via WhatsApp."}, {"question": "É complicado?", "answer": "Não! O sistema é muito simples de usar."}]'::jsonb,
  'Sistema para Ferro Velho em Boa Vista | XLata',
  'Sistema de gestão para depósitos de reciclagem em Boa Vista e Roraima. Controle completo. Teste grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-boa-vista',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'RR' AND c.slug = 'boa-vista' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Palmas, TO
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-palmas',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Palmas',
  'Gestão moderna para ferro velhos tocantinenses',
  '<h2>XLata em Palmas: tecnologia para o Tocantins</h2>
<p>Palmas é a capital mais jovem do Brasil, planejada e moderna. Os depósitos de ferro velho da cidade merecem ferramentas igualmente modernas para sua gestão.</p>

<h3>O que oferecemos</h3>
<p>Ferramentas completas:</p>
<ul>
<li>PDV de compra intuitivo</li>
<li>Controle financeiro detalhado</li>
<li>Gestão de despesas categorizada</li>
<li>Relatórios de performance e lucro</li>
</ul>

<h3>Palmas e região</h3>
<p>O XLata funciona em toda a capital e municípios do Tocantins.</p>

<h3>Capital planejada, gestão planejada</h3>
<p>O XLata ajuda você a planejar e organizar seu depósito de forma profissional.</p>

<h3>Experimente grátis</h3>
<p>Cadastre-se e teste o XLata em Palmas.</p>',
  '[{"icon": "Building2", "title": "Capital Moderna", "description": "Sistema à altura da cidade"}, {"icon": "Target", "title": "Foco em Resultados", "description": "Ferramentas que geram lucro"}, {"icon": "Rocket", "title": "Inovação", "description": "Tecnologia de ponta"}]'::jsonb,
  '[{"question": "O XLata funciona em Palmas?", "answer": "Sim! Sistema online, funciona perfeitamente."}, {"question": "Atende o interior do TO?", "answer": "Sim! Funciona em qualquer cidade com internet."}, {"question": "É moderno?", "answer": "Sim! Interface atual e funcionalidades completas."}]'::jsonb,
  'Sistema para Ferro Velho em Palmas | XLata',
  'Sistema de gestão para depósitos de reciclagem em Palmas e Tocantins. PDV, caixa e relatórios. Grátis para testar!',
  'https://xlata.site/sistema-para-reciclagem-em-palmas',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'TO' AND c.slug = 'palmas' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Uberlândia, MG (cidade importante, não capital)
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-uberlandia',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Uberlândia',
  'Gestão profissional para ferro velhos no Triângulo Mineiro',
  '<h2>XLata em Uberlândia: tecnologia para o Triângulo</h2>
<p>Uberlândia é a segunda maior cidade de Minas Gerais e um importante polo econômico do Triângulo Mineiro. Os depósitos de ferro velho da região contam com o XLata para organizar suas operações.</p>

<h3>Funcionalidades completas</h3>
<p>Sistema pensado para você:</p>
<ul>
<li>PDV de compra rápido e preciso</li>
<li>Controle de caixa em tempo real</li>
<li>Gestão de despesas organizada</li>
<li>Relatórios de lucro e desempenho</li>
</ul>

<h3>Uberlândia e região</h3>
<p>O XLata funciona em Uberlândia, Uberaba, Araguari e todo o Triângulo Mineiro.</p>

<h3>Hub logístico</h3>
<p>Uberlândia é um centro de distribuição importante. O XLata ajuda você a organizar o fluxo intenso de materiais.</p>

<h3>Comece grátis</h3>
<p>Cadastre-se e teste o XLata em Uberlândia.</p>',
  '[{"icon": "Truck", "title": "Hub Logístico", "description": "Ideal para alto volume"}, {"icon": "BarChart3", "title": "Relatórios", "description": "Dados para decisões"}, {"icon": "Users", "title": "Multi-usuário", "description": "Toda equipe pode usar"}]'::jsonb,
  '[{"question": "Funciona em Uberlândia?", "answer": "Sim! Atendemos Uberlândia e todo o Triângulo."}, {"question": "É bom para grandes operações?", "answer": "Sim! O XLata foi feito para agilidade."}, {"question": "Posso usar em várias unidades?", "answer": "Sim! Gerencie múltiplas unidades."}]'::jsonb,
  'Sistema para Ferro Velho em Uberlândia | XLata',
  'Sistema de gestão para depósitos de reciclagem em Uberlândia e Triângulo Mineiro. PDV, caixa e relatórios!',
  'https://xlata.site/sistema-para-reciclagem-em-uberlandia',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'MG' AND c.slug = 'uberlandia' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Jaboatão dos Guararapes, PE
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-jaboatao-dos-guararapes',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Jaboatão dos Guararapes',
  'Gestão moderna para ferro velhos na RMR',
  '<h2>XLata em Jaboatão: tecnologia para a Grande Recife</h2>
<p>Jaboatão dos Guararapes é a segunda maior cidade de Pernambuco e um importante polo industrial da região metropolitana do Recife. Os depósitos de ferro velho da cidade contam com o XLata.</p>

<h3>O que oferecemos</h3>
<p>Sistema completo:</p>
<ul>
<li>PDV de compra rápido</li>
<li>Controle de caixa completo</li>
<li>Gestão de despesas</li>
<li>Relatórios de lucro</li>
</ul>

<h3>Jaboatão e região</h3>
<p>O XLata funciona em toda Jaboatão e região metropolitana do Recife.</p>

<h3>Polo industrial</h3>
<p>Com muita indústria por perto, o volume de material reciclável é alto. O XLata ajuda você a organizar.</p>

<h3>Teste grátis</h3>
<p>Cadastre-se e experimente o XLata em Jaboatão.</p>',
  '[{"icon": "Factory", "title": "Polo Industrial", "description": "Ideal para alto volume"}, {"icon": "Clock", "title": "Economia de Tempo", "description": "Sistema rápido e ágil"}, {"icon": "Shield", "title": "Confiável", "description": "Dados sempre seguros"}]'::jsonb,
  '[{"question": "Funciona em Jaboatão?", "answer": "Sim! Atendemos Jaboatão e toda a RMR."}, {"question": "É bom para volume alto?", "answer": "Sim! O XLata foi feito para agilidade."}, {"question": "Tem suporte?", "answer": "Sim! Atendimento via WhatsApp."}]'::jsonb,
  'Sistema para Ferro Velho em Jaboatão dos Guararapes | XLata',
  'Sistema de gestão para depósitos de reciclagem em Jaboatão dos Guararapes e PE. Controle completo!',
  'https://xlata.site/sistema-para-reciclagem-em-jaboatao-dos-guararapes',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'PE' AND c.slug = 'jaboatao-dos-guararapes' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Várzea Grande, MT
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-varzea-grande',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Várzea Grande',
  'Gestão profissional para ferro velhos na Grande Cuiabá',
  '<h2>XLata em Várzea Grande: tecnologia para o MT</h2>
<p>Várzea Grande faz parte da região metropolitana de Cuiabá e tem um setor de reciclagem ativo. Os depósitos de ferro velho da cidade contam com o XLata para organizar suas operações.</p>

<h3>Funcionalidades</h3>
<p>Sistema completo:</p>
<ul>
<li>PDV de compra intuitivo</li>
<li>Controle de caixa detalhado</li>
<li>Gestão de despesas categorizada</li>
<li>Relatórios de performance</li>
</ul>

<h3>Várzea Grande e Cuiabá</h3>
<p>O XLata funciona em toda a região metropolitana de Cuiabá.</p>

<h3>Integração regional</h3>
<p>Gerencie seu negócio de forma integrada com as melhores ferramentas.</p>

<h3>Comece grátis</h3>
<p>Cadastre-se e teste o XLata em Várzea Grande.</p>',
  '[{"icon": "MapPin", "title": "Grande Cuiabá", "description": "Atendemos toda a região"}, {"icon": "TrendingUp", "title": "Crescimento", "description": "Ferramentas para expandir"}, {"icon": "Smartphone", "title": "Mobile", "description": "Acesse pelo celular"}]'::jsonb,
  '[{"question": "Funciona em Várzea Grande?", "answer": "Sim! Atendemos toda a Grande Cuiabá."}, {"question": "O sistema é pesado?", "answer": "Não! É leve e rápido."}, {"question": "Posso usar no celular?", "answer": "Sim! Funciona em qualquer dispositivo."}]'::jsonb,
  'Sistema para Ferro Velho em Várzea Grande | XLata',
  'Sistema de gestão para depósitos de reciclagem em Várzea Grande e MT. PDV, caixa e relatórios. Teste grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-varzea-grande',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'MT' AND c.slug = 'varzea-grande' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);