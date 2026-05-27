-- Inserir páginas SEO para todas as cidades que ainda não têm conteúdo
-- Cada página terá conteúdo único, humanizado e otimizado para SEO

-- Campinas, SP
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-campinas',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Campinas',
  'Gestão completa para seu depósito de ferro velho na região de Campinas',
  '<h2>XLata: O parceiro digital dos depósitos de reciclagem em Campinas</h2>
<p>Campinas é um dos principais polos industriais do interior paulista, e isso se reflete na quantidade de depósitos de reciclagem que movimentam a economia local. Se você tem um ferro velho na região, sabe que organização e controle financeiro fazem toda a diferença no final do mês.</p>

<h3>Por que escolher o XLata para seu depósito?</h3>
<p>O XLata foi desenvolvido por quem entende a rotina de um depósito de reciclagem. Não é um sistema genérico adaptado – é uma ferramenta criada especificamente para:</p>
<ul>
<li>Registrar compras de materiais de forma rápida e organizada</li>
<li>Controlar seu caixa com entradas, saídas e sangrias</li>
<li>Acompanhar despesas por categoria (combustível, manutenção, etc.)</li>
<li>Gerar relatórios de lucro baseados no seu estoque real</li>
</ul>

<h3>Atendimento em toda a RMC</h3>
<p>Seja em Campinas, Sumaré, Hortolândia, Indaiatuba ou qualquer cidade da região metropolitana, o XLata funciona perfeitamente. Por ser 100% online, você acessa de qualquer lugar – no escritório, no pátio ou até de casa.</p>

<h3>Tecnologia simples, resultados reais</h3>
<p>Você não precisa ser expert em tecnologia para usar o XLata. A interface foi pensada para ser intuitiva, com botões grandes e fluxos de trabalho que fazem sentido para quem trabalha no dia a dia de um depósito.</p>

<h3>Suporte humanizado</h3>
<p>Precisa de ajuda? Nossa equipe atende por WhatsApp e resolve suas dúvidas rapidamente. Nada de robôs ou filas de espera intermináveis.</p>',
  '[{"icon": "Scale", "title": "PDV de Compra Rápido", "description": "Registre materiais em segundos, sem travar seu atendimento"}, {"icon": "Wallet", "title": "Controle de Caixa", "description": "Acompanhe entradas, saídas e sangrias em tempo real"}, {"icon": "TrendingUp", "title": "Relatórios de Lucro", "description": "Saiba exatamente quanto está ganhando com cada material"}]'::jsonb,
  '[{"question": "O XLata funciona em Campinas?", "answer": "Sim! O XLata é 100% online e funciona perfeitamente em Campinas e toda a região metropolitana."}, {"question": "Preciso instalar algo no computador?", "answer": "Não. O XLata funciona direto no navegador, sem instalação. Você pode acessar pelo computador, tablet ou celular."}, {"question": "E se eu tiver dúvidas?", "answer": "Nosso suporte por WhatsApp está sempre disponível para ajudar você."}]'::jsonb,
  'Sistema para Ferro Velho em Campinas | XLata Gestão',
  'Sistema de gestão completo para depósitos de reciclagem em Campinas e região. PDV, controle de caixa e relatórios. Teste grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-campinas',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'SP' AND c.slug = 'campinas' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Guarulhos, SP
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-guarulhos',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Guarulhos',
  'Organize seu ferro velho com tecnologia que funciona',
  '<h2>Gestão profissional para depósitos de reciclagem em Guarulhos</h2>
<p>Guarulhos é a segunda maior cidade de São Paulo e tem uma economia industrial forte, o que gera grande volume de materiais recicláveis. Os depósitos de ferro velho da região precisam de ferramentas modernas para se manterem competitivos.</p>

<h3>O que o XLata oferece para seu depósito</h3>
<p>Com o XLata, você transforma a gestão do seu negócio. Chega de anotações em caderno ou planilhas confusas:</p>
<ul>
<li>PDV de compra com cálculo automático de valores</li>
<li>Cadastro organizado de materiais e preços</li>
<li>Controle financeiro com visão clara do seu caixa</li>
<li>Histórico completo de todas as operações</li>
</ul>

<h3>Ideal para a realidade de Guarulhos</h3>
<p>Sabemos que o ritmo em Guarulhos é intenso. Por isso, o XLata foi feito para ser rápido: você registra uma compra em menos de um minuto, sem complicação.</p>

<h3>Funciona em qualquer bairro</h3>
<p>Centro, Cumbica, Taboão, Bonsucesso, Pimentas... não importa onde fica seu depósito, o XLata é 100% online e funciona em qualquer lugar com internet.</p>

<h3>Teste gratuitamente</h3>
<p>Você pode experimentar o XLata sem compromisso. Crie sua conta, explore as funcionalidades e veja como o sistema pode ajudar seu negócio a crescer.</p>',
  '[{"icon": "Clock", "title": "Economia de Tempo", "description": "Registre compras em menos de 1 minuto"}, {"icon": "Shield", "title": "Dados Seguros", "description": "Suas informações ficam protegidas na nuvem"}, {"icon": "Smartphone", "title": "Acesso Mobile", "description": "Use no celular, tablet ou computador"}]'::jsonb,
  '[{"question": "O sistema funciona em Guarulhos?", "answer": "Sim! O XLata funciona em toda Guarulhos e região, basta ter internet."}, {"question": "Quanto custa o XLata?", "answer": "O plano completo custa apenas R$ 49,90/mês, com todas as funcionalidades inclusas."}, {"question": "Posso cancelar quando quiser?", "answer": "Sim, não há fidelidade. Você cancela quando quiser, sem multas."}]'::jsonb,
  'Sistema para Ferro Velho em Guarulhos | XLata',
  'Sistema de gestão para depósitos de reciclagem em Guarulhos. Controle compras, caixa e gere relatórios. Experimente grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-guarulhos',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'SP' AND c.slug = 'guarulhos' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Santos, SP
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-santos',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Santos',
  'Tecnologia para depósitos de ferro velho na Baixada Santista',
  '<h2>XLata: Sistema completo para ferro velhos em Santos e região</h2>
<p>A Baixada Santista, com seu porto e polo industrial, gera um grande volume de materiais recicláveis. Os depósitos de Santos precisam de um sistema que acompanhe esse ritmo e ajude a manter o negócio organizado.</p>

<h3>Funcionalidades pensadas para você</h3>
<p>O XLata reúne tudo que você precisa para gerenciar seu depósito:</p>
<ul>
<li>PDV de compra intuitivo e rápido</li>
<li>Controle de caixa com registro de todas as movimentações</li>
<li>Gestão de despesas categorizada</li>
<li>Relatórios automáticos de lucro e desempenho</li>
</ul>

<h3>Cobertura em toda a Baixada</h3>
<p>Santos, São Vicente, Praia Grande, Guarujá, Cubatão... o XLata atende depósitos em toda a região litorânea. Sistema 100% online, sem necessidade de instalação local.</p>

<h3>Adaptado ao clima da região</h3>
<p>Seus dados ficam seguros na nuvem, sem depender de equipamentos locais que podem sofrer com a maresia ou umidade. Você acessa de qualquer dispositivo, a qualquer momento.</p>

<h3>Comece hoje mesmo</h3>
<p>Cadastre-se gratuitamente e descubra como o XLata pode transformar a gestão do seu depósito de reciclagem em Santos.</p>',
  '[{"icon": "Cloud", "title": "100% na Nuvem", "description": "Seus dados sempre seguros e acessíveis"}, {"icon": "MapPin", "title": "Toda a Baixada", "description": "Funciona em Santos e cidades vizinhas"}, {"icon": "BarChart3", "title": "Relatórios Claros", "description": "Entenda seu negócio com gráficos simples"}]'::jsonb,
  '[{"question": "O XLata funciona na Baixada Santista?", "answer": "Sim! Atendemos Santos, São Vicente, Guarujá e toda a região."}, {"question": "Preciso de internet boa?", "answer": "O XLata é leve e funciona bem mesmo com conexões mais lentas."}, {"question": "Tem app para celular?", "answer": "O XLata funciona direto no navegador do celular, sem precisar baixar nada."}]'::jsonb,
  'Sistema para Ferro Velho em Santos | XLata',
  'Sistema de gestão para depósitos de reciclagem em Santos e Baixada Santista. PDV, caixa e relatórios. Teste grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-santos',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'SP' AND c.slug = 'santos' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- São Bernardo do Campo, SP
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-sao-bernardo-do-campo',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em São Bernardo do Campo',
  'Gestão moderna para ferro velhos no ABC Paulista',
  '<h2>XLata para depósitos de reciclagem no ABC Paulista</h2>
<p>São Bernardo do Campo está no coração do ABC Paulista, uma das regiões mais industrializadas do Brasil. Com tanta indústria por perto, os depósitos de ferro velho têm um fluxo intenso de materiais – e precisam de um sistema à altura.</p>

<h3>Feito para quem trabalha pesado</h3>
<p>O XLata entende o ritmo do ABC. O sistema é rápido, objetivo e vai direto ao ponto:</p>
<ul>
<li>Registre compras sem perder tempo</li>
<li>Acompanhe seu caixa em tempo real</li>
<li>Controle despesas por categoria</li>
<li>Veja seus lucros com clareza</li>
</ul>

<h3>Toda a região do ABC</h3>
<p>Santo André, São Caetano, Diadema, Mauá, Ribeirão Pires... o XLata atende todos os depósitos do Grande ABC. Sistema online, sem fronteiras.</p>

<h3>Competitividade para seu negócio</h3>
<p>Em uma região tão competitiva, ter informações precisas faz diferença. Com o XLata, você sabe exatamente quanto está pagando por cada material e qual seu lucro real.</p>

<h3>Experimente sem compromisso</h3>
<p>Faça um teste gratuito e veja como o XLata pode ajudar seu depósito a se destacar no ABC Paulista.</p>',
  '[{"icon": "Zap", "title": "Sistema Rápido", "description": "Desenvolvido para acompanhar seu ritmo de trabalho"}, {"icon": "Calculator", "title": "Cálculos Automáticos", "description": "Valores calculados instantaneamente"}, {"icon": "Users", "title": "Multi-usuário", "description": "Vários funcionários podem usar ao mesmo tempo"}]'::jsonb,
  '[{"question": "Funciona em todo o ABC?", "answer": "Sim! O XLata atende São Bernardo, Santo André, São Caetano e toda a região."}, {"question": "Posso usar em mais de um computador?", "answer": "Sim! Como é online, você acessa de quantos dispositivos quiser."}, {"question": "E se a internet cair?", "answer": "O sistema salva tudo automaticamente. Quando a internet voltar, você continua de onde parou."}]'::jsonb,
  'Sistema para Ferro Velho em São Bernardo do Campo | XLata',
  'Sistema de gestão para depósitos de reciclagem em São Bernardo do Campo e ABC Paulista. Controle total do seu negócio!',
  'https://xlata.site/sistema-para-reciclagem-em-sao-bernardo-do-campo',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'SP' AND c.slug = 'sao-bernardo-do-campo' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Rio de Janeiro, RJ
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-rio-de-janeiro',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem no Rio de Janeiro',
  'Gestão digital para ferro velhos cariocas',
  '<h2>XLata: O sistema que entende o jeitinho carioca de trabalhar</h2>
<p>O Rio de Janeiro tem uma cultura própria, e os depósitos de reciclagem da cidade não são diferentes. Do Centro à Zona Oeste, do Méier à Barra, cada ferro velho tem suas particularidades – mas todos precisam de organização.</p>

<h3>Simplicidade é a chave</h3>
<p>O XLata foi desenhado para ser direto. Nada de menus complicados ou funcionalidades que ninguém usa:</p>
<ul>
<li>PDV de compra intuitivo</li>
<li>Controle de caixa simples e eficiente</li>
<li>Registro de despesas organizado</li>
<li>Relatórios que mostram o que importa</li>
</ul>

<h3>De ponta a ponta na cidade</h3>
<p>Zona Norte, Zona Sul, Zona Oeste, Centro... o XLata funciona em qualquer bairro do Rio. Sistema 100% online, sem depender de servidores locais.</p>

<h3>Suporte que fala sua língua</h3>
<p>Nosso atendimento por WhatsApp é rápido e humanizado. Sem robôs, sem espera. Você manda a dúvida e a gente resolve.</p>

<h3>Teste grátis</h3>
<p>Cadastre-se e experimente o XLata sem pagar nada. Descubra como um sistema bem feito pode facilitar sua vida.</p>',
  '[{"icon": "MapPin", "title": "Todo o Rio", "description": "Funciona em qualquer bairro da cidade"}, {"icon": "MessageCircle", "title": "Suporte Rápido", "description": "Atendimento humanizado por WhatsApp"}, {"icon": "DollarSign", "title": "Preço Justo", "description": "R$ 49,90/mês com tudo incluso"}]'::jsonb,
  '[{"question": "Funciona em todas as zonas do Rio?", "answer": "Sim! O XLata é online e funciona em qualquer lugar com internet."}, {"question": "Consigo acessar pelo celular?", "answer": "Sim! O sistema funciona perfeitamente no navegador do celular."}, {"question": "Tem período de teste?", "answer": "Sim, você pode testar todas as funcionalidades antes de assinar."}]'::jsonb,
  'Sistema para Ferro Velho no Rio de Janeiro | XLata',
  'Sistema de gestão para depósitos de reciclagem no Rio de Janeiro. PDV, controle de caixa e relatórios. Experimente grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-rio-de-janeiro',
  'published',
  true,
  0.8,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'RJ' AND c.slug = 'rio-de-janeiro' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Curitiba, PR
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-curitiba',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Curitiba',
  'Tecnologia paranaense para gestão de ferro velhos',
  '<h2>XLata em Curitiba: organização que faz a diferença</h2>
<p>Curitiba é referência em sustentabilidade e reciclagem no Brasil. Os depósitos de ferro velho da capital paranaense fazem parte dessa cultura, e merecem ferramentas modernas para trabalhar ainda melhor.</p>

<h3>Sistema completo para sua operação</h3>
<p>O XLata oferece tudo que você precisa para gerenciar seu depósito:</p>
<ul>
<li>PDV de compra com registro rápido de materiais</li>
<li>Controle financeiro com visão completa do caixa</li>
<li>Gestão de despesas por categoria</li>
<li>Relatórios de desempenho e lucratividade</li>
</ul>

<h3>Atendimento em toda a RMC</h3>
<p>Curitiba, São José dos Pinhais, Colombo, Araucária, Pinhais... o XLata atende depósitos em toda a região metropolitana.</p>

<h3>Preparado para o frio</h3>
<p>Como é 100% na nuvem, você não precisa se preocupar com computadores ou servidores locais. Seus dados ficam seguros e acessíveis de qualquer lugar.</p>

<h3>Comece agora</h3>
<p>Faça seu cadastro gratuito e veja como o XLata pode transformar a gestão do seu depósito em Curitiba.</p>',
  '[{"icon": "Leaf", "title": "Sustentabilidade", "description": "Contribua com a reciclagem de forma organizada"}, {"icon": "Lock", "title": "Dados Protegidos", "description": "Segurança de nível empresarial"}, {"icon": "RefreshCw", "title": "Atualizações Grátis", "description": "Sempre com as últimas melhorias"}]'::jsonb,
  '[{"question": "O XLata funciona em Curitiba?", "answer": "Sim! Atendemos Curitiba e toda a região metropolitana."}, {"question": "Preciso de computador novo?", "answer": "Não! O XLata funciona em qualquer computador com navegador e internet."}, {"question": "Quanto tempo leva para aprender?", "answer": "O sistema é intuitivo. A maioria dos usuários aprende em minutos."}]'::jsonb,
  'Sistema para Ferro Velho em Curitiba | XLata',
  'Sistema de gestão para depósitos de reciclagem em Curitiba e região. Controle completo do seu negócio. Teste grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-curitiba',
  'published',
  true,
  0.8,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'PR' AND c.slug = 'curitiba' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Porto Alegre, RS
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-porto-alegre',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Porto Alegre',
  'Gestão gaúcha para depósitos de ferro velho',
  '<h2>XLata: O sistema tchê para ferros velhos em Porto Alegre</h2>
<p>Porto Alegre e região metropolitana concentram uma grande quantidade de depósitos de reciclagem. O XLata chegou para ajudar os empresários gaúchos a organizarem suas operações de forma simples e eficiente.</p>

<h3>Feito para facilitar sua vida</h3>
<p>O XLata reúne as ferramentas essenciais para gestão do seu depósito:</p>
<ul>
<li>PDV de compra rápido e intuitivo</li>
<li>Controle de caixa em tempo real</li>
<li>Registro organizado de despesas</li>
<li>Relatórios de lucro e desempenho</li>
</ul>

<h3>De Canoas a Viamão</h3>
<p>O XLata atende depósitos em toda a Grande Porto Alegre. Sistema online, sem limitações geográficas.</p>

<h3>Suporte que entende você</h3>
<p>Nossa equipe conhece a realidade dos ferros velhos. Quando você precisa de ajuda, falamos a mesma língua.</p>

<h3>Experimente grátis</h3>
<p>Cadastre-se e teste o XLata sem compromisso. Descubra por que é o sistema preferido dos depósitos do Sul.</p>',
  '[{"icon": "Award", "title": "Qualidade Gaúcha", "description": "Sistema robusto e confiável"}, {"icon": "HeartHandshake", "title": "Parceria Real", "description": "Suporte que realmente ajuda"}, {"icon": "TrendingUp", "title": "Crescimento", "description": "Ferramentas para expandir seu negócio"}]'::jsonb,
  '[{"question": "Funciona em toda a região metropolitana?", "answer": "Sim! Porto Alegre, Canoas, Gravataí, Viamão e toda a região."}, {"question": "O sistema é difícil de usar?", "answer": "Não! Foi feito para ser simples e intuitivo."}, {"question": "Posso importar meus dados?", "answer": "Sim, podemos ajudar você a migrar suas informações."}]'::jsonb,
  'Sistema para Ferro Velho em Porto Alegre | XLata',
  'Sistema de gestão para depósitos de reciclagem em Porto Alegre e RS. PDV, caixa e relatórios. Comece grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-porto-alegre',
  'published',
  true,
  0.8,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'RS' AND c.slug = 'porto-alegre' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Salvador, BA
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-salvador',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Salvador',
  'Gestão moderna para ferro velhos na capital baiana',
  '<h2>XLata em Salvador: tecnologia que acompanha seu ritmo</h2>
<p>Salvador é a maior cidade do Nordeste e tem um setor de reciclagem vibrante. Os depósitos de ferro velho soteropolitanos movimentam toneladas de materiais todos os dias, e precisam de organização para crescer.</p>

<h3>O que o XLata oferece</h3>
<p>Sistema completo para gestão do seu depósito:</p>
<ul>
<li>PDV de compra simples e rápido</li>
<li>Controle financeiro detalhado</li>
<li>Gestão de despesas por categoria</li>
<li>Relatórios claros de lucro e desempenho</li>
</ul>

<h3>Toda Salvador e RMS</h3>
<p>Do Comércio à Boca do Rio, de Camaçari a Lauro de Freitas, o XLata funciona em toda a região metropolitana.</p>

<h3>Funciona até no Carnaval</h3>
<p>Por ser 100% online, o XLata está sempre disponível. Seus dados ficam seguros na nuvem, acessíveis a qualquer momento.</p>

<h3>Comece sua jornada digital</h3>
<p>Cadastre-se gratuitamente e veja como é fácil modernizar a gestão do seu ferro velho em Salvador.</p>',
  '[{"icon": "Sun", "title": "Sempre Disponível", "description": "Sistema online 24 horas por dia"}, {"icon": "Globe", "title": "Toda a RMS", "description": "Atende Salvador e região metropolitana"}, {"icon": "Sparkles", "title": "Interface Moderna", "description": "Design intuitivo e agradável"}]'::jsonb,
  '[{"question": "O XLata funciona em Salvador?", "answer": "Sim! Atendemos Salvador e toda a região metropolitana."}, {"question": "Preciso de equipamento especial?", "answer": "Não! Funciona em qualquer computador ou celular com internet."}, {"question": "O suporte atende minha região?", "answer": "Sim! Nosso suporte por WhatsApp atende todo o Brasil."}]'::jsonb,
  'Sistema para Ferro Velho em Salvador | XLata',
  'Sistema de gestão para depósitos de reciclagem em Salvador e Bahia. Controle compras, caixa e lucros. Teste grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-salvador',
  'published',
  true,
  0.8,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'BA' AND c.slug = 'salvador' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Fortaleza, CE
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-fortaleza',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Fortaleza',
  'Organize seu ferro velho com tecnologia de ponta',
  '<h2>XLata em Fortaleza: gestão simplificada para seu depósito</h2>
<p>Fortaleza é um polo econômico importante do Nordeste, e o setor de reciclagem acompanha esse crescimento. Se você tem um ferro velho na capital cearense, o XLata é a ferramenta certa para organizar seu negócio.</p>

<h3>Recursos essenciais</h3>
<p>Tudo que você precisa em um só lugar:</p>
<ul>
<li>PDV de compra otimizado para agilidade</li>
<li>Controle de caixa com histórico completo</li>
<li>Categorização de despesas</li>
<li>Relatórios de lucro e análise de desempenho</li>
</ul>

<h3>Fortaleza e região</h3>
<p>Aldeota, Montese, Messejana, Caucaia, Maracanaú... o XLata funciona em toda a Grande Fortaleza.</p>

<h3>Sem preocupação com calor</h3>
<p>Sistema na nuvem significa menos equipamentos esquentando no seu escritório. Acesse de qualquer lugar, com qualquer dispositivo.</p>

<h3>Teste agora</h3>
<p>Faça seu cadastro gratuito e comece a usar o XLata hoje mesmo em Fortaleza.</p>',
  '[{"icon": "Thermometer", "title": "Sistema Leve", "description": "Funciona rápido mesmo em conexões simples"}, {"icon": "Shield", "title": "Backup Automático", "description": "Seus dados sempre seguros"}, {"icon": "Clock", "title": "Economia de Tempo", "description": "Mais agilidade no dia a dia"}]'::jsonb,
  '[{"question": "O sistema funciona em Fortaleza?", "answer": "Sim! Atendemos Fortaleza e toda a região metropolitana."}, {"question": "Preciso de internet rápida?", "answer": "Não! O XLata é leve e funciona bem em qualquer conexão."}, {"question": "Tem suporte em português?", "answer": "Sim! Suporte 100% em português via WhatsApp."}]'::jsonb,
  'Sistema para Ferro Velho em Fortaleza | XLata',
  'Sistema de gestão para depósitos de reciclagem em Fortaleza e Ceará. PDV, controle financeiro e relatórios. Grátis para testar!',
  'https://xlata.site/sistema-para-reciclagem-em-fortaleza',
  'published',
  true,
  0.8,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'CE' AND c.slug = 'fortaleza' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Recife, PE
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-recife',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Recife',
  'Gestão inteligente para ferro velhos pernambucanos',
  '<h2>XLata no Recife: tecnologia que trabalha por você</h2>
<p>O Recife e sua região metropolitana formam um importante centro de reciclagem do Nordeste. Os depósitos de ferro velho da capital pernambucana agora contam com o XLata para modernizar suas operações.</p>

<h3>Funcionalidades completas</h3>
<p>O XLata oferece tudo para sua gestão:</p>
<ul>
<li>PDV de compra rápido e preciso</li>
<li>Controle de caixa detalhado</li>
<li>Gestão de despesas organizada</li>
<li>Relatórios de performance e lucro</li>
</ul>

<h3>Recife e arredores</h3>
<p>Boa Viagem, Casa Amarela, Olinda, Jaboatão, Paulista... o XLata atende toda a RMR.</p>

<h3>Tecnologia acessível</h3>
<p>Não precisa de computador novo ou conhecimento técnico. O XLata é simples e funciona em qualquer dispositivo.</p>

<h3>Cadastre-se grátis</h3>
<p>Experimente o XLata sem compromisso e veja a diferença na organização do seu depósito.</p>',
  '[{"icon": "Lightbulb", "title": "Fácil de Usar", "description": "Aprenda em minutos, use para sempre"}, {"icon": "Landmark", "title": "Todo Pernambuco", "description": "Funciona no Recife e interior"}, {"icon": "HeadphonesIcon", "title": "Suporte Dedicado", "description": "Ajuda sempre que precisar"}]'::jsonb,
  '[{"question": "Funciona na região metropolitana?", "answer": "Sim! Recife, Olinda, Jaboatão e todas as cidades da RMR."}, {"question": "O preço é acessível?", "answer": "Sim! Apenas R$ 49,90/mês com todas as funcionalidades."}, {"question": "Posso testar antes de pagar?", "answer": "Sim! Oferecemos período de teste gratuito."}]'::jsonb,
  'Sistema para Ferro Velho em Recife | XLata',
  'Sistema de gestão para depósitos de reciclagem em Recife e Pernambuco. Controle total do seu negócio. Experimente!',
  'https://xlata.site/sistema-para-reciclagem-em-recife',
  'published',
  true,
  0.8,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'PE' AND c.slug = 'recife' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Goiânia, GO
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-goiania',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Goiânia',
  'Organize seu ferro velho no coração do Brasil',
  '<h2>XLata em Goiânia: gestão profissional para seu depósito</h2>
<p>Goiânia cresce a cada ano e o setor de reciclagem acompanha essa expansão. Os depósitos de ferro velho goianienses precisam de ferramentas modernas para se manterem competitivos.</p>

<h3>Sistema completo</h3>
<p>O XLata oferece recursos pensados para seu dia a dia:</p>
<ul>
<li>PDV de compra ágil e intuitivo</li>
<li>Controle financeiro em tempo real</li>
<li>Gestão de despesas categorizada</li>
<li>Relatórios de lucro e desempenho</li>
</ul>

<h3>Goiânia e região</h3>
<p>Aparecida de Goiânia, Senador Canedo, Trindade, Anápolis... o XLata atende todo o entorno.</p>

<h3>Localização estratégica</h3>
<p>No centro do Brasil, Goiânia recebe materiais de todas as regiões. O XLata ajuda você a organizar esse fluxo intenso.</p>

<h3>Comece gratuitamente</h3>
<p>Cadastre-se e teste o XLata sem pagar nada. Veja como é fácil organizar seu depósito.</p>',
  '[{"icon": "Target", "title": "Foco no Resultado", "description": "Ferramentas que geram lucro real"}, {"icon": "Map", "title": "Centro-Oeste", "description": "Atendemos todo Goiás"}, {"icon": "Rocket", "title": "Crescimento", "description": "Escale seu negócio com tecnologia"}]'::jsonb,
  '[{"question": "O XLata funciona em Goiânia?", "answer": "Sim! Atendemos Goiânia, Aparecida e toda a região."}, {"question": "É complicado de usar?", "answer": "Não! O sistema foi feito para ser simples e intuitivo."}, {"question": "Preciso de treinamento?", "answer": "O XLata é fácil, mas oferecemos suporte se precisar de ajuda."}]'::jsonb,
  'Sistema para Ferro Velho em Goiânia | XLata',
  'Sistema de gestão para depósitos de reciclagem em Goiânia e Goiás. PDV, caixa e relatórios completos. Teste grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-goiania',
  'published',
  true,
  0.8,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'GO' AND c.slug = 'goiania' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Brasília, DF
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-brasilia',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Brasília',
  'Gestão de ferro velhos na capital federal',
  '<h2>XLata em Brasília: organização de nível federal</h2>
<p>Brasília e suas cidades satélites formam um mercado único para reciclagem. Com uma população que não para de crescer, os depósitos de ferro velho do DF precisam de tecnologia para acompanhar a demanda.</p>

<h3>Recursos profissionais</h3>
<p>O XLata entrega tudo que você precisa:</p>
<ul>
<li>PDV de compra otimizado</li>
<li>Controle de caixa completo</li>
<li>Gestão de despesas por categoria</li>
<li>Relatórios gerenciais detalhados</li>
</ul>

<h3>Todo o Distrito Federal</h3>
<p>Plano Piloto, Taguatinga, Ceilândia, Samambaia, Gama... o XLata funciona em todas as regiões administrativas.</p>

<h3>Padrão de qualidade</h3>
<p>Na capital do país, você merece um sistema à altura. O XLata oferece segurança, confiabilidade e suporte dedicado.</p>

<h3>Experimente</h3>
<p>Faça seu cadastro gratuito e conheça o XLata. Veja por que é a escolha certa para seu depósito em Brasília.</p>',
  '[{"icon": "Building2", "title": "Padrão Federal", "description": "Sistema profissional e confiável"}, {"icon": "MapPinned", "title": "Todo o DF", "description": "Funciona em todas as RAs"}, {"icon": "BadgeCheck", "title": "Qualidade", "description": "Desenvolvido com excelência"}]'::jsonb,
  '[{"question": "Funciona em todas as cidades satélites?", "answer": "Sim! O XLata atende todo o Distrito Federal."}, {"question": "O sistema é seguro?", "answer": "Sim! Usamos criptografia e backups automáticos."}, {"question": "Posso acessar de diferentes locais?", "answer": "Sim! Como é online, você acessa de qualquer lugar."}]'::jsonb,
  'Sistema para Ferro Velho em Brasília | XLata',
  'Sistema de gestão para depósitos de reciclagem em Brasília e DF. Controle profissional para seu negócio. Teste grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-brasilia',
  'published',
  true,
  0.8,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'DF' AND c.slug = 'brasilia' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Florianópolis, SC
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-florianopolis',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Florianópolis',
  'Gestão moderna para ferro velhos na Ilha',
  '<h2>XLata em Florianópolis: tecnologia catarinense</h2>
<p>Florianópolis é conhecida pela qualidade de vida e consciência ambiental. Os depósitos de reciclagem da capital catarinense fazem parte dessa cultura, e o XLata veio para ajudar a profissionalizar ainda mais o setor.</p>

<h3>Funcionalidades completas</h3>
<p>O XLata oferece recursos essenciais:</p>
<ul>
<li>PDV de compra rápido e preciso</li>
<li>Controle de caixa em tempo real</li>
<li>Gestão organizada de despesas</li>
<li>Relatórios de lucro e performance</li>
</ul>

<h3>Ilha e Continente</h3>
<p>Centro, Norte, Sul da Ilha, São José, Palhoça, Biguaçu... o XLata atende toda a Grande Florianópolis.</p>

<h3>Qualidade catarinense</h3>
<p>Sistema robusto, interface limpa e suporte que realmente resolve. É assim que trabalhamos.</p>

<h3>Comece agora</h3>
<p>Cadastre-se gratuitamente e veja como o XLata pode transformar seu depósito em Florianópolis.</p>',
  '[{"icon": "Waves", "title": "Na Ilha e Continente", "description": "Funciona em toda a Grande Florianópolis"}, {"icon": "Leaf", "title": "Sustentabilidade", "description": "Contribua para um mundo melhor"}, {"icon": "Gem", "title": "Qualidade Premium", "description": "O melhor sistema do mercado"}]'::jsonb,
  '[{"question": "O sistema funciona em Florianópolis?", "answer": "Sim! Atendemos a Ilha, continente e toda a região."}, {"question": "É adequado para pequenos depósitos?", "answer": "Sim! O XLata atende desde pequenos até grandes depósitos."}, {"question": "Oferece relatórios?", "answer": "Sim! Relatórios completos de compras, despesas e lucros."}]'::jsonb,
  'Sistema para Ferro Velho em Florianópolis | XLata',
  'Sistema de gestão para depósitos de reciclagem em Florianópolis e SC. PDV, controle financeiro e mais. Teste grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-florianopolis',
  'published',
  true,
  0.8,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'SC' AND c.slug = 'florianopolis' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Vitória, ES
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-vitoria',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Vitória',
  'Gestão profissional para ferro velhos capixabas',
  '<h2>XLata em Vitória: organize seu depósito de reciclagem</h2>
<p>Vitória e a Grande Vitória formam um importante polo de reciclagem do Espírito Santo. Com o porto de Tubarão movimentando milhões de toneladas, a região tem grande potencial para o setor de ferro velho.</p>

<h3>Sistema completo</h3>
<p>O XLata oferece tudo para seu dia a dia:</p>
<ul>
<li>PDV de compra ágil e intuitivo</li>
<li>Controle financeiro detalhado</li>
<li>Gestão de despesas categorizada</li>
<li>Relatórios de lucro e desempenho</li>
</ul>

<h3>Grande Vitória</h3>
<p>Vitória, Vila Velha, Cariacica, Serra, Viana... o XLata atende toda a região metropolitana.</p>

<h3>Potencial portuário</h3>
<p>Próximo a um dos maiores portos do país, os depósitos capixabas movimentam muito material. O XLata ajuda você a organizar esse volume.</p>

<h3>Teste grátis</h3>
<p>Cadastre-se e experimente o XLata sem compromisso. Veja a diferença na gestão do seu depósito.</p>',
  '[{"icon": "Anchor", "title": "Região Portuária", "description": "Ideal para alto volume de materiais"}, {"icon": "BarChart", "title": "Controle Total", "description": "Visão completa do seu negócio"}, {"icon": "Phone", "title": "Suporte Rápido", "description": "Atendimento por WhatsApp"}]'::jsonb,
  '[{"question": "Funciona em toda a Grande Vitória?", "answer": "Sim! Vitória, Vila Velha, Serra e toda a região."}, {"question": "É bom para quem trabalha com volume alto?", "answer": "Sim! O XLata foi feito para agilizar operações intensas."}, {"question": "Quanto custa?", "answer": "Apenas R$ 49,90/mês com tudo incluso."}]'::jsonb,
  'Sistema para Ferro Velho em Vitória | XLata',
  'Sistema de gestão para depósitos de reciclagem em Vitória e ES. Controle compras, caixa e lucros. Experimente grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-vitoria',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'ES' AND c.slug = 'vitoria-es' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Manaus, AM
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-manaus',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Manaus',
  'Tecnologia para ferro velhos no coração da Amazônia',
  '<h2>XLata em Manaus: gestão que chega ao Norte</h2>
<p>Manaus é o maior polo industrial do Norte do Brasil, e isso gera uma quantidade enorme de materiais recicláveis. Os depósitos de ferro velho da capital amazonense precisam de ferramentas modernas para acompanhar esse ritmo.</p>

<h3>Funcionalidades essenciais</h3>
<p>O XLata oferece o que você precisa:</p>
<ul>
<li>PDV de compra rápido e intuitivo</li>
<li>Controle de caixa completo</li>
<li>Gestão de despesas organizada</li>
<li>Relatórios de lucro e desempenho</li>
</ul>

<h3>Zona Franca e além</h3>
<p>Com a Zona Franca de Manaus, a cidade recebe materiais de todo o país. O XLata ajuda você a organizar esse fluxo intenso.</p>

<h3>Funciona em qualquer zona</h3>
<p>Centro, Zona Leste, Zona Norte, Zona Sul... o XLata é online e funciona em toda Manaus.</p>

<h3>Comece grátis</h3>
<p>Faça seu cadastro e teste o XLata. Descubra como é fácil organizar seu depósito em Manaus.</p>',
  '[{"icon": "Factory", "title": "Zona Industrial", "description": "Ideal para o polo de Manaus"}, {"icon": "Wifi", "title": "100% Online", "description": "Funciona em qualquer lugar com internet"}, {"icon": "UserCheck", "title": "Suporte Nacional", "description": "Atendimento dedicado para o Norte"}]'::jsonb,
  '[{"question": "O XLata funciona em Manaus?", "answer": "Sim! O sistema é online e funciona perfeitamente em Manaus."}, {"question": "Mesmo longe, tem suporte?", "answer": "Sim! Nosso suporte por WhatsApp atende todo o Brasil."}, {"question": "O sistema é leve?", "answer": "Sim! Funciona bem mesmo em conexões mais lentas."}]'::jsonb,
  'Sistema para Ferro Velho em Manaus | XLata',
  'Sistema de gestão para depósitos de reciclagem em Manaus e Amazonas. PDV, caixa e relatórios. Teste grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-manaus',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'AM' AND c.slug = 'manaus' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Belém, PA
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-belem',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Belém',
  'Gestão moderna para ferro velhos paraenses',
  '<h2>XLata em Belém: tecnologia para o Pará</h2>
<p>Belém é a porta de entrada da Amazônia e um importante centro comercial do Norte. Os depósitos de reciclagem da capital paraense movimentam materiais de toda a região e precisam de organização profissional.</p>

<h3>O que oferecemos</h3>
<p>Sistema completo para sua gestão:</p>
<ul>
<li>PDV de compra simples e rápido</li>
<li>Controle financeiro detalhado</li>
<li>Gestão de despesas por categoria</li>
<li>Relatórios claros de desempenho</li>
</ul>

<h3>Belém e região</h3>
<p>Ananindeua, Marituba, Benevides, Castanhal... o XLata atende toda a região metropolitana de Belém.</p>

<h3>Na nuvem, sem problemas</h3>
<p>Seus dados ficam seguros na nuvem, longe de umidade e calor. Acesse de qualquer dispositivo, a qualquer hora.</p>

<h3>Experimente grátis</h3>
<p>Cadastre-se e teste o XLata sem compromisso em Belém.</p>',
  '[{"icon": "CloudSun", "title": "Sistema na Nuvem", "description": "Dados seguros, longe do calor"}, {"icon": "TreePine", "title": "Norte do Brasil", "description": "Atendemos toda a região amazônica"}, {"icon": "Zap", "title": "Rápido e Leve", "description": "Funciona bem em qualquer conexão"}]'::jsonb,
  '[{"question": "Funciona em Belém e região?", "answer": "Sim! Atendemos Belém e toda a região metropolitana."}, {"question": "Preciso de internet rápida?", "answer": "Não! O XLata é leve e funciona em conexões simples."}, {"question": "O suporte atende o Norte?", "answer": "Sim! Nosso suporte via WhatsApp atende todo o Brasil."}]'::jsonb,
  'Sistema para Ferro Velho em Belém | XLata',
  'Sistema de gestão para depósitos de reciclagem em Belém e Pará. Controle completo do seu negócio. Teste grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-belem',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'PA' AND c.slug = 'belem' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Campo Grande, MS
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-campo-grande',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Campo Grande',
  'Gestão profissional para ferro velhos sul-mato-grossenses',
  '<h2>XLata em Campo Grande: organize seu depósito</h2>
<p>Campo Grande é a capital do Mato Grosso do Sul e um importante centro econômico do Centro-Oeste. Os depósitos de ferro velho da cidade precisam de ferramentas modernas para crescer de forma organizada.</p>

<h3>Recursos completos</h3>
<p>O XLata entrega o essencial:</p>
<ul>
<li>PDV de compra ágil e intuitivo</li>
<li>Controle de caixa em tempo real</li>
<li>Gestão de despesas organizada</li>
<li>Relatórios de lucro e análise</li>
</ul>

<h3>Capital e interior</h3>
<p>O XLata funciona em Campo Grande e em qualquer cidade do Mato Grosso do Sul. Sistema 100% online.</p>

<h3>Agronegócio e reciclagem</h3>
<p>A região tem forte ligação com o agronegócio, que gera muito material metálico. O XLata ajuda você a organizar esse fluxo.</p>

<h3>Teste agora</h3>
<p>Cadastre-se gratuitamente e veja como o XLata funciona.</p>',
  '[{"icon": "Tractor", "title": "Região Agro", "description": "Ideal para materiais do campo"}, {"icon": "Globe2", "title": "Todo o MS", "description": "Funciona na capital e interior"}, {"icon": "Briefcase", "title": "Profissional", "description": "Gestão de verdade para seu negócio"}]'::jsonb,
  '[{"question": "Funciona em Campo Grande?", "answer": "Sim! O XLata é online e funciona perfeitamente na capital."}, {"question": "Atende o interior do MS?", "answer": "Sim! Funciona em qualquer cidade com internet."}, {"question": "É difícil de aprender?", "answer": "Não! O sistema é simples e intuitivo."}]'::jsonb,
  'Sistema para Ferro Velho em Campo Grande | XLata',
  'Sistema de gestão para depósitos de reciclagem em Campo Grande e MS. PDV, controle financeiro e relatórios. Grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-campo-grande',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'MS' AND c.slug = 'campo-grande' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);

-- Cuiabá, MT
INSERT INTO local_seo_pages (slug, page_type, state_id, city_id, headline, subheadline, content_html, features, faq, seo_title, seo_description, canonical_url, status, allow_indexing, sitemap_priority, sitemap_changefreq, view_count)
SELECT 
  'sistema-para-reciclagem-em-cuiaba',
  'city',
  s.id,
  c.id,
  'Sistema para Reciclagem em Cuiabá',
  'Tecnologia para ferro velhos mato-grossenses',
  '<h2>XLata em Cuiabá: gestão que aguenta o calor</h2>
<p>Cuiabá é uma das cidades mais quentes do Brasil, e os depósitos de ferro velho da capital mato-grossense trabalham sob condições intensas. O XLata chegou para facilitar a gestão, com tecnologia que funciona em qualquer ambiente.</p>

<h3>Funcionalidades essenciais</h3>
<p>Tudo que você precisa:</p>
<ul>
<li>PDV de compra rápido e preciso</li>
<li>Controle de caixa detalhado</li>
<li>Gestão de despesas por categoria</li>
<li>Relatórios de lucro e desempenho</li>
</ul>

<h3>Cuiabá e Várzea Grande</h3>
<p>O XLata atende a capital, Várzea Grande e toda a região do Mato Grosso.</p>

<h3>Sistema na nuvem</h3>
<p>Seus dados ficam na nuvem, sem depender de equipamentos locais. Mais segurança, menos preocupação.</p>

<h3>Comece grátis</h3>
<p>Faça seu cadastro e teste o XLata em Cuiabá.</p>',
  '[{"icon": "Flame", "title": "Aguenta o Ritmo", "description": "Sistema robusto para trabalho intenso"}, {"icon": "Server", "title": "Na Nuvem", "description": "Dados seguros sem equipamentos locais"}, {"icon": "Truck", "title": "Logística", "description": "Ideal para regiões de grande extensão"}]'::jsonb,
  '[{"question": "O XLata funciona em Cuiabá?", "answer": "Sim! Atendemos Cuiabá, Várzea Grande e todo o MT."}, {"question": "O sistema é pesado?", "answer": "Não! É leve e funciona bem em qualquer conexão."}, {"question": "Tem suporte para o Centro-Oeste?", "answer": "Sim! Nosso suporte atende todo o Brasil via WhatsApp."}]'::jsonb,
  'Sistema para Ferro Velho em Cuiabá | XLata',
  'Sistema de gestão para depósitos de reciclagem em Cuiabá e Mato Grosso. Controle total do seu negócio. Teste grátis!',
  'https://xlata.site/sistema-para-reciclagem-em-cuiaba',
  'published',
  true,
  0.7,
  'monthly',
  0
FROM local_seo_states s, local_seo_cities c
WHERE s.abbreviation = 'MT' AND c.slug = 'cuiaba' AND c.state_id = s.id
AND NOT EXISTS (SELECT 1 FROM local_seo_pages WHERE city_id = c.id);