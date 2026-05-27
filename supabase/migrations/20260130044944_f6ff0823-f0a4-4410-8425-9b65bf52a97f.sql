-- Criar categorias padrão para loja de móveis e itens usados (estilo ML/OLX)
INSERT INTO shop_categories (name, slug, description, display_order, is_active) VALUES
  ('Móveis e Decoração', 'moveis-decoracao', 'Mesas, cadeiras, estantes, sofás e itens decorativos', 1, true),
  ('Máquinas e Ferramentas', 'maquinas-ferramentas', 'Equipamentos industriais, soldas, compressores', 2, true),
  ('Materiais de Construção', 'materiais-construcao', 'Estruturas metálicas, portas, escadas, vigas', 3, true),
  ('Eletrônicos e Informática', 'eletronicos-informatica', 'Computadores, placas, equipamentos eletrônicos', 4, true),
  ('Veículos e Peças', 'veiculos-pecas', 'Motos, carros, bicicletas e acessórios automotivos', 5, true),
  ('Esporte e Lazer', 'esporte-lazer', 'Equipamentos fitness, bicicletas, recreação', 6, true),
  ('Casa e Jardim', 'casa-jardim', 'Utilidades domésticas, caixas d''água, bombas', 7, true),
  ('Antiguidades e Coleções', 'antiguidades-colecoes', 'Itens vintage, colecionáveis, raridades', 8, true),
  ('Comercial e Escritório', 'comercial-escritorio', 'Equipamentos para comércio e escritório', 9, true),
  ('Outros', 'outros', 'Diversos itens que não se encaixam em outras categorias', 10, true)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- Atualizar produtos existentes com categorias apropriadas
-- Máquinas e Ferramentas
UPDATE shop_products SET category_id = (SELECT id FROM shop_categories WHERE slug = 'maquinas-ferramentas')
WHERE name ILIKE '%solda%' OR name ILIKE '%motor%' OR name ILIKE '%rampa%';

-- Materiais de Construção  
UPDATE shop_products SET category_id = (SELECT id FROM shop_categories WHERE slug = 'materiais-construcao')
WHERE name ILIKE '%escada%' OR name ILIKE '%vigamento%' OR name ILIKE '%tubo%' OR name ILIKE '%porta%';

-- Móveis e Decoração
UPDATE shop_products SET category_id = (SELECT id FROM shop_categories WHERE slug = 'moveis-decoracao')
WHERE name ILIKE '%mesa%' OR name ILIKE '%estante%' OR name ILIKE '%luminária%';

-- Veículos e Peças
UPDATE shop_products SET category_id = (SELECT id FROM shop_categories WHERE slug = 'veiculos-pecas')
WHERE name ILIKE '%moto%' OR name ILIKE '%triumph%';

-- Esporte e Lazer
UPDATE shop_products SET category_id = (SELECT id FROM shop_categories WHERE slug = 'esporte-lazer')
WHERE name ILIKE '%elíptico%' OR name ILIKE '%bicicleta%';

-- Casa e Jardim
UPDATE shop_products SET category_id = (SELECT id FROM shop_categories WHERE slug = 'casa-jardim')
WHERE name ILIKE '%caixa d%' OR name ILIKE '%roda d%';

-- Eletrônicos e Informática
UPDATE shop_products SET category_id = (SELECT id FROM shop_categories WHERE slug = 'eletronicos-informatica')
WHERE name ILIKE '%placa%' OR name ILIKE '%vídeo%';

-- Antiguidades e Coleções
UPDATE shop_products SET category_id = (SELECT id FROM shop_categories WHERE slug = 'antiguidades-colecoes')
WHERE name ILIKE '%antigo%' OR name ILIKE '%calculadora%' OR name ILIKE '%cofre%';

-- Comercial e Escritório
UPDATE shop_products SET category_id = (SELECT id FROM shop_categories WHERE slug = 'comercial-escritorio')
WHERE name ILIKE '%gaveta%' AND category_id IS NULL;

-- Qualquer produto sem categoria vai para "Outros"
UPDATE shop_products SET category_id = (SELECT id FROM shop_categories WHERE slug = 'outros')
WHERE category_id IS NULL;