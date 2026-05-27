-- Add new categories for better SEO organization
INSERT INTO blog_categories (name, slug, description, sort_order) VALUES
  ('Preço da Sucata', 'preco-da-sucata', 'Cotações, tabelas e valores atualizados de materiais recicláveis', 1),
  ('Lucro e Financeiro', 'lucro-e-financeiro', 'Gestão financeira, margens de lucro e controle de caixa', 3),
  ('Operação de Sucata', 'operacao-de-sucata', 'Processos operacionais, logística e gestão do dia a dia', 4),
  ('Sistema e Automação', 'sistema-e-automacao', 'Tecnologia, sistemas de gestão e automação para ferro velho', 5),
  ('Erros e Problemas', 'erros-e-problemas', 'Erros comuns, problemas frequentes e como evitá-los', 6),
  ('Mercado da Reciclagem', 'mercado-da-reciclagem', 'Tendências, oportunidades e panorama do setor', 8)
ON CONFLICT (slug) DO NOTHING;