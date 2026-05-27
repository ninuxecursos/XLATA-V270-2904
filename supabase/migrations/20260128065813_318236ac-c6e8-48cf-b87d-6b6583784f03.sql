-- Criar categoria "Gestão de Ferro Velho e Reciclagem" se não existir
INSERT INTO blog_categories (name, slug, description, icon, sort_order, is_featured)
VALUES (
  'Gestão de Ferro Velho e Reciclagem', 
  'gestao-ferro-velho-reciclagem', 
  'Conteúdos educacionais profundos sobre gestão, organização e profissionalização de ferro velho e depósitos de reciclagem',
  'Building2',
  5,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  is_featured = EXCLUDED.is_featured;