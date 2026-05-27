-- Insert 5 pillar pages with complete SEO-optimized content
INSERT INTO pillar_pages (
  slug, headline, subheadline, intro_text, 
  features, how_it_works, benefits, faq,
  seo_title, seo_description, canonical_url,
  sitemap_priority, sitemap_changefreq, allow_indexing, status
) VALUES 
-- Page 1: Sistema para Ferro Velho
(
  'sistema-para-ferro-velho',
  'Sistema para Ferro Velho - Pare de Perder Dinheiro com Conta Errada',
  'Pese, calcule e imprima em segundos. Sem erro. Sem fila. Sem discussão.',
  'Você ainda anota no caderno? Conta errada no fim do dia? Não sabe se está lucrando? O XLata é o sistema mais simples para ferro velho. Registre compras por kg, calcule automaticamente e imprima recibo pro fornecedor. Tudo no celular ou computador.',
  '["Registra compra por kg em 5 segundos", "Calcula o valor automaticamente pelo peso", "Imprime recibo pro fornecedor na hora", "Mostra lucro em tempo real", "Controle de caixa com abertura e fechamento", "Relatório de compras do dia e do mês", "Cadastro de materiais com preço por kg", "Funciona no celular e computador"]',
  '[{"title": "Abre o caixa", "description": "Informa quanto tem em dinheiro pra começar o dia"}, {"title": "Registra compras", "description": "Pesa o material, seleciona o tipo e pronto"}, {"title": "Imprime recibo", "description": "Fornecedor leva comprovante, você fica com registro"}, {"title": "Fecha o caixa", "description": "Confere o saldo e vê o resumo do dia"}]',
  '[{"title": "Sem Mais Conta Errada", "description": "O sistema calcula sozinho. Você só confere."}, {"title": "Recibo pro Fornecedor", "description": "Dá credibilidade e evita discussão depois."}, {"title": "Sabe Seu Lucro", "description": "Veja quanto está ganhando de verdade."}, {"title": "Funciona em Qualquer Lugar", "description": "Celular, tablet ou computador. Só precisa de internet."}]',
  '[{"question": "Funciona no celular?", "answer": "Sim, funciona em qualquer celular com internet. Pode usar Android ou iPhone."}, {"question": "Precisa instalar alguma coisa?", "answer": "Não. É só abrir no navegador e fazer login. Nada de instalar."}, {"question": "Quanto custa?", "answer": "R$ 49,90 por mês. Menos que um erro de balança. E você pode testar 7 dias grátis."}, {"question": "Meu funcionário consegue usar?", "answer": "Sim, é bem simples. A maioria aprende em 10 minutos."}, {"question": "Posso cancelar quando quiser?", "answer": "Pode sim. Sem multa, sem burocracia."}, {"question": "Tem suporte?", "answer": "Tem sim, por WhatsApp. A gente ajuda a configurar tudo."}]',
  'Sistema para Ferro Velho: Controle Compra, Venda e Caixa | XLata',
  'Sistema simples para ferro velho. Registre compras por kg, calcule automaticamente e imprima recibo. Controle seu caixa e saiba seu lucro. Teste grátis 7 dias.',
  'https://xlata.site/solucoes/sistema-para-ferro-velho',
  0.9, 'weekly', true, 'published'
),
-- Page 2: Sistema para Depósito de Reciclagem
(
  'sistema-para-deposito-de-reciclagem',
  'Sistema para Depósito de Reciclagem - Simples e Completo',
  'Controle compras, vendas e caixa do seu depósito em um só lugar. Sem complicação.',
  'O XLata foi feito pra quem trabalha com reciclagem de verdade. Compra alumínio, cobre, papelão, plástico? Registre tudo por kg, controle seu caixa e veja relatórios simples. Funciona no celular ou computador.',
  '["Compra de qualquer material por kg", "Venda por kg com cálculo automático", "Controle de caixa completo", "Relatório de compras e vendas", "Cadastro de materiais e preços", "Impressão de recibo", "Funciona em qualquer dispositivo", "Suporte por WhatsApp"]',
  '[{"title": "Cadastre seus materiais", "description": "Alumínio, cobre, ferro, papelão... coloque o preço de cada um"}, {"title": "Registre as compras", "description": "Quando chegar material, registra o peso e o tipo"}, {"title": "Controle o caixa", "description": "Veja quanto entrou e saiu de dinheiro"}, {"title": "Veja os relatórios", "description": "Acompanhe quanto comprou e vendeu por dia ou mês"}]',
  '[{"title": "Organização Total", "description": "Chega de papel, caderno e planilha confusa."}, {"title": "Sabe Quanto Comprou", "description": "Veja exatamente quanto gastou com cada material."}, {"title": "Controle do Dinheiro", "description": "Saiba onde foi parar cada centavo."}, {"title": "Decisões Melhores", "description": "Com dados claros, você decide melhor."}]',
  '[{"question": "Serve pra depósito pequeno?", "answer": "Sim! O XLata serve pra qualquer tamanho de depósito. Desde quem está começando até quem já tem volume."}, {"question": "Posso usar no celular?", "answer": "Pode sim. Funciona em qualquer celular com internet."}, {"question": "É difícil de usar?", "answer": "Não. O XLata é simples de propósito. Qualquer pessoa aprende rápido."}, {"question": "Tem teste grátis?", "answer": "Tem sim. 7 dias pra você testar tudo sem pagar nada."}, {"question": "Emite nota fiscal?", "answer": "O XLata não emite nota fiscal, mas imprime recibo de compra pro fornecedor."}]',
  'Sistema para Depósito de Reciclagem - Simples e Completo | XLata',
  'Sistema completo para depósito de reciclagem. Controle compras por kg, vendas, caixa e relatórios. Simples de usar, funciona no celular. Teste grátis.',
  'https://xlata.site/solucoes/sistema-para-deposito-de-reciclagem',
  0.9, 'weekly', true, 'published'
),
-- Page 3: Controle de Caixa Ferro Velho
(
  'controle-de-caixa-ferro-velho',
  'Controle de Caixa para Ferro Velho - Nunca Mais Perca Dinheiro',
  'Saiba exatamente quanto entrou e quanto saiu. Sem "sumir" dinheiro.',
  'Seu caixa fecha errado todo dia? Não sabe onde foi parar o dinheiro? O controle de caixa do XLata resolve isso. Registre cada entrada e saída, acompanhe o saldo em tempo real e feche o dia tranquilo.',
  '["Saldo do caixa atualizado em tempo real", "Registro automático de compras e vendas", "Lançamento de despesas por categoria", "Histórico completo de movimentações", "Abertura e fechamento de caixa", "Conferência de saldo no final do dia"]',
  '[{"title": "Abre o caixa", "description": "Coloca quanto tem de dinheiro pra começar"}, {"title": "Registra operações", "description": "Cada compra ou venda já atualiza o caixa"}, {"title": "Lança despesas", "description": "Combustível, manutenção, alimentação..."}, {"title": "Fecha o dia", "description": "Confere se o saldo bate e encerra"}]',
  '[{"title": "Saldo Sempre Certo", "description": "Não vai mais ter diferença no caixa."}, {"title": "Sabe Onde Foi o Dinheiro", "description": "Cada saída fica registrada."}, {"title": "Fecha Tranquilo", "description": "No fim do dia, é só conferir."}, {"title": "Histórico Completo", "description": "Consulte qualquer dia quando precisar."}]',
  '[{"question": "Posso registrar despesas?", "answer": "Sim! Você pode lançar combustível, manutenção, alimentação e outras despesas."}, {"question": "O sistema atualiza sozinho?", "answer": "Sim. Cada compra ou venda já entra no caixa automaticamente."}, {"question": "Consigo ver dias anteriores?", "answer": "Consegue sim. O histórico fica salvo e você consulta quando quiser."}, {"question": "E se eu errar um lançamento?", "answer": "Você pode corrigir ou excluir lançamentos errados."}]',
  'Controle de Caixa para Ferro Velho - Nunca Mais Perca Dinheiro | XLata',
  'Controle de caixa para ferro velho. Saiba quanto entrou e saiu, registre despesas e feche o dia tranquilo. Sistema simples. Teste grátis 7 dias.',
  'https://xlata.site/solucoes/controle-de-caixa-ferro-velho',
  0.85, 'weekly', true, 'published'
),
-- Page 4: PDV para Sucata
(
  'pdv-para-sucata',
  'PDV para Sucata: Registre Compras por KG em Segundos',
  'Escolhe o material, digita o peso, imprime o recibo. Simples assim.',
  'Chega de anotar no papel e fazer conta na calculadora. O PDV do XLata é direto ao ponto: seleciona o material, coloca o peso e pronto. O valor é calculado automático e você ainda imprime recibo pro fornecedor.',
  '["Registro de compra em menos de 10 segundos", "Cálculo automático pelo peso", "Impressão de recibo na hora", "Lista de materiais cadastrados", "Histórico de compras do dia", "Funciona no celular"]',
  '[{"title": "Seleciona o material", "description": "Alumínio, cobre, ferro... escolhe na lista"}, {"title": "Digita o peso", "description": "Coloca quantos kg comprou"}, {"title": "Confirma a compra", "description": "Valor calculado automático"}, {"title": "Imprime o recibo", "description": "Fornecedor leva o comprovante"}]',
  '[{"title": "Rapidez no Atendimento", "description": "Fornecedor não fica esperando."}, {"title": "Sem Erro de Conta", "description": "O sistema calcula, você só confere."}, {"title": "Comprovante na Hora", "description": "Dá credibilidade e evita problema."}, {"title": "Tudo Registrado", "description": "Cada compra fica no histórico."}]',
  '[{"question": "Funciona sem internet?", "answer": "Precisa de internet pra usar, mas funciona em qualquer conexão, até 3G."}, {"question": "Posso usar no celular?", "answer": "Pode sim. O PDV funciona em qualquer celular."}, {"question": "Como imprimir o recibo?", "answer": "Você pode imprimir em impressora térmica Bluetooth ou impressora normal."}, {"question": "Dá pra cadastrar qualquer material?", "answer": "Sim! Você cadastra os materiais que compra e coloca o preço de cada um."}]',
  'PDV para Sucata: Registre Compras por KG em Segundos | XLata',
  'PDV simples para sucata e ferro velho. Registre compras por kg, calcule automaticamente e imprima recibo. Funciona no celular. Teste grátis.',
  'https://xlata.site/solucoes/pdv-para-sucata',
  0.85, 'weekly', true, 'published'
),
-- Page 5: Controle de Estoque Reciclagem
(
  'controle-de-estoque-reciclagem',
  'Controle de Estoque para Reciclagem - Saiba Quanto Você Tem',
  'Veja quanto tem de cada material em kg e quanto vale em dinheiro.',
  'Não sabe quanto tem no depósito? O controle de estoque do XLata mostra em tempo real: quanto você tem de cada material em kg e quanto isso vale em dinheiro. Comprou, aumenta. Vendeu, diminui. Simples.',
  '["Estoque atualizado em tempo real", "Quantidade em kg de cada material", "Valor estimado do estoque", "Projeção de lucro na venda", "Histórico de movimentação", "Alertas de estoque baixo"]',
  '[{"title": "Registra compras", "description": "Cada compra aumenta o estoque do material"}, {"title": "Registra vendas", "description": "Cada venda diminui o estoque"}, {"title": "Acompanha em tempo real", "description": "Veja quanto tem a qualquer momento"}, {"title": "Projeta o lucro", "description": "Calcule quanto vai ganhar quando vender"}]',
  '[{"title": "Sabe Quanto Tem", "description": "Nada de chutar. Você sabe exato."}, {"title": "Valor do Estoque", "description": "Veja quanto seu estoque vale em dinheiro."}, {"title": "Projeção de Lucro", "description": "Calcule quanto vai ganhar na venda."}, {"title": "Controle por Material", "description": "Veja cada material separado."}]',
  '[{"question": "O estoque atualiza sozinho?", "answer": "Sim! Cada compra ou venda já atualiza automaticamente."}, {"question": "Posso ver estoque de um material específico?", "answer": "Pode sim. Você vê cada material separado."}, {"question": "Como funciona a projeção de lucro?", "answer": "O sistema calcula: preço de venda menos preço de compra, vezes a quantidade."}, {"question": "Consigo ver histórico?", "answer": "Consegue. Veja todas as movimentações de entrada e saída."}]',
  'Controle de Estoque para Reciclagem - Saiba Quanto Você Tem | XLata',
  'Controle de estoque para depósito de reciclagem. Veja quanto tem de cada material em kg e o valor estimado. Projeção de lucro automática. Teste grátis.',
  'https://xlata.site/solucoes/controle-de-estoque-reciclagem',
  0.8, 'weekly', true, 'published'
)
ON CONFLICT (slug) DO UPDATE SET
  headline = EXCLUDED.headline,
  subheadline = EXCLUDED.subheadline,
  intro_text = EXCLUDED.intro_text,
  features = EXCLUDED.features,
  how_it_works = EXCLUDED.how_it_works,
  benefits = EXCLUDED.benefits,
  faq = EXCLUDED.faq,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  canonical_url = EXCLUDED.canonical_url,
  sitemap_priority = EXCLUDED.sitemap_priority,
  sitemap_changefreq = EXCLUDED.sitemap_changefreq,
  allow_indexing = EXCLUDED.allow_indexing,
  status = EXCLUDED.status,
  updated_at = now();