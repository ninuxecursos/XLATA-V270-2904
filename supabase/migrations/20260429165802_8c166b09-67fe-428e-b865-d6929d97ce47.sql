-- Bloco 1 — PREÇO (priority 10)
INSERT INTO public.seo_topic_bank (topic, keywords, category, priority) VALUES
('Preço do cobre kg hoje 2026 — tabela atualizada', ARRAY['preço cobre kg 2026','cobre queimado preço','sucata cobre','preço do cobre hoje'], 'comercial', 10),
('Preço do alumínio kg sucata 2026 — tabela completa', ARRAY['preço alumínio kg sucata 2026','latinha alumínio preço','sucata alumínio'], 'comercial', 10),
('Preço do ferro kg sucata 2026 — atualizado hoje', ARRAY['preço ferro kg 2026','preço ferro velho kg 2026','sucata ferro preço'], 'comercial', 10),
('Preço do latão kg 2026 — tabela por tipo', ARRAY['latão preço kg 2026','sucata latão valor','preço latão hoje'], 'comercial', 10),
('Cobre queimado: quanto vale o kg em 2026', ARRAY['valor cobre queimado','preço cobre queimado','cobre queimado kg'], 'comercial', 10),
('Tabela de preços da reciclagem 2026 atualizada', ARRAY['tabela preços reciclagem 2026','tabela reciclagem 2026','preços reciclagem'], 'comercial', 10),
('Preço da sucata por kg hoje — guia 2026 completo', ARRAY['preço sucata kg hoje','preço sucata 2026','sucata por kg'], 'comercial', 10),
('Preço dos materiais recicláveis 2026 — lista completa', ARRAY['preço materiais recicláveis','valor reciclagem','tabela materiais recicláveis'], 'comercial', 10),
('Variação do preço da sucata: por que muda toda semana', ARRAY['variação preço sucata','oscilação cobre alumínio','preço sucata muda'], 'educacional', 9),
('Como vender sucata mais cara em 2026 (5 técnicas)', ARRAY['vender sucata mais caro','dicas vender sucata','como vender sucata'], 'comercial', 10),
-- Bloco 2 — SISTEMA / SOFTWARE (priority 10)
('Sistema para ferro velho: o guia completo 2026', ARRAY['sistema para ferro velho','sistema ferro velho','sistema ferro velho 2026'], 'comercial', 10),
('Software para ferro velho: qual escolher em 2026', ARRAY['software para ferro velho','programa ferro velho','software sucata'], 'comercial', 10),
('Programa para ferro velho grátis vs pago — comparação real', ARRAY['programa ferro velho grátis','sistema gratuito sucata','programa pago ferro velho'], 'comercial', 10),
('Como controlar um ferro velho sem sistema (e por que perde dinheiro)', ARRAY['controle ferro velho','organização ferro velho','controlar ferro velho'], 'comercial', 10),
('Controle de estoque de sucata: guia prático 2026', ARRAY['controle estoque sucata','estoque ferro velho','estoque sucata'], 'comercial', 10),
('Como calcular lucro real no ferro velho (passo a passo)', ARRAY['lucro ferro velho','calcular lucro sucata','lucro real ferro velho'], 'comercial', 10),
('Fechamento de caixa no ferro velho: como fazer certo', ARRAY['fechamento caixa ferro velho','caixa sucata','fechar caixa ferro velho'], 'educacional', 9),
('7 erros que fazem você perder dinheiro no ferro velho', ARRAY['erros ferro velho','perder dinheiro sucata','erros sucata'], 'comercial', 10),
('Como organizar um ferro velho pequeno (do zero)', ARRAY['organizar ferro velho pequeno','abrir ferro velho','ferro velho pequeno'], 'educacional', 9),
('Sistema de balança integrado para depósito de sucata', ARRAY['sistema balança ferro velho','balança integrada sucata','balança ferro velho'], 'comercial', 10),
-- Bloco 3 — OPERAÇÃO (priority 9)
('Como agilizar o atendimento na balança do ferro velho', ARRAY['atendimento balança ferro velho','agilizar pesagem','balança rápida'], 'educacional', 9),
('Como evitar filas no ferro velho em dias de pico', ARRAY['filas ferro velho','atender mais rápido sucata','evitar filas sucata'], 'educacional', 9),
('Rotina ideal de um ferro velho organizado (do abrir ao fechar)', ARRAY['rotina ferro velho','dia a dia ferro velho','organização ferro velho'], 'educacional', 9),
('Como evitar prejuízo comprando sucata (checklist)', ARRAY['prejuízo comprar sucata','fraude sucata','evitar prejuízo sucata'], 'educacional', 9),
('Entrada e saída de material no ferro velho: passo a passo', ARRAY['entrada saída material ferro velho','controle entrada sucata','saída material sucata'], 'educacional', 9),
('Como precificar sucata com base no mercado real', ARRAY['precificar sucata','preço de compra sucata','formar preço sucata'], 'educacional', 9),
('CNAE para ferro velho: qual usar e como abrir empresa', ARRAY['cnae ferro velho','abrir empresa sucata','cnae sucata'], 'educacional', 9),
('Depósito de reciclagem: como montar do zero em 2026', ARRAY['depósito reciclagem','montar depósito sucata','abrir depósito reciclagem'], 'educacional', 9),
('Como atender mais clientes por dia no ferro velho', ARRAY['atender mais clientes ferro velho','produtividade sucata','aumentar clientes ferro velho'], 'educacional', 9),
('Manual vs sistema: o impacto financeiro real em 12 meses', ARRAY['manual vs sistema ferro velho','automação sucata','sistema vs caderno'], 'comercial', 10);

-- Atualização dos 2 posts pilares (CTR fix)
UPDATE public.blog_posts SET
  title = '💰 Preço da Sucata Hoje (2026) — Tabela Atualizada por KG',
  seo_title = '💰 Preço da Sucata Hoje (2026) — Tabela Atualizada por KG',
  seo_description = 'Veja o preço da sucata por kg em 2026: cobre, alumínio, ferro, latão e mais. Tabela completa atualizada + dicas para vender mais caro.'
WHERE slug = 'preco-sucata-hoje-tabela-atualizada';

UPDATE public.blog_posts SET
  title = '📊 Materiais Recicláveis 2026: Valores Atualizados por KG',
  seo_title = '📊 Materiais Recicláveis 2026: Valores Atualizados por KG',
  seo_description = 'Tabela 2026 com valores atualizados de cada material reciclável: alumínio, cobre, ferro, papelão, plástico. Confira preços por kg hoje.'
WHERE slug = 'tipos-materiais-reciclaveis-valores';