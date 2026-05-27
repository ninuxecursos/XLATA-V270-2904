-- Inserir categorias de ajuda com módulos válidos
INSERT INTO help_categories (name, slug, description, icon, sort_order, module) VALUES
('Primeiros Passos', 'primeiros-passos', 'Aprenda o básico do XLata e comece a usar o sistema rapidamente', 'PlayCircle', 1, 'geral'),
('PDV e Vendas', 'pdv-vendas', 'Guias completos sobre o ponto de venda, compras e vendas de materiais', 'ShoppingCart', 2, 'compra'),
('Estoque e Materiais', 'estoque-materiais', 'Como gerenciar seu estoque, materiais e precificação', 'Package', 3, 'estoque'),
('Financeiro e Caixa', 'financeiro-caixa', 'Controle de caixa, despesas, sangrias e suprimentos', 'DollarSign', 4, 'caixa'),
('Relatórios', 'relatorios', 'Análise de dados, relatórios financeiros e de vendas', 'BarChart3', 5, 'relatorios'),
('Configurações', 'configuracoes', 'Personalize o sistema de acordo com suas necessidades', 'Settings', 6, 'geral'),
('Solução de Problemas', 'solucao-problemas', 'Resolva problemas comuns e tire suas dúvidas', 'HelpCircle', 7, 'geral')
ON CONFLICT (slug) DO NOTHING;