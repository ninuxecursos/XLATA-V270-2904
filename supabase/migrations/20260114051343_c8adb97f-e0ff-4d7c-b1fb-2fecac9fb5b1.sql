-- =============================================
-- FASE 1: Adicionar campos de Social Proof ao Hero
-- =============================================

-- Adicionar novos campos na tabela landing_page_settings para social proof editável
ALTER TABLE landing_page_settings 
ADD COLUMN IF NOT EXISTS hero_highlight_text TEXT DEFAULT '3 Minutos',
ADD COLUMN IF NOT EXISTS hero_social_proof_users TEXT DEFAULT '130+',
ADD COLUMN IF NOT EXISTS hero_social_proof_users_label TEXT DEFAULT 'depósitos ativos',
ADD COLUMN IF NOT EXISTS hero_social_proof_rating TEXT DEFAULT '4.9',
ADD COLUMN IF NOT EXISTS hero_social_proof_rating_label TEXT DEFAULT 'de satisfação',
ADD COLUMN IF NOT EXISTS hero_security_label TEXT DEFAULT 'Dados 100% seguros',
ADD COLUMN IF NOT EXISTS hero_secondary_button_text TEXT DEFAULT 'Ver Como Funciona',
ADD COLUMN IF NOT EXISTS hero_video_inline BOOLEAN DEFAULT false;

-- =============================================
-- FASE 3: Criar bucket para imagens da landing
-- =============================================

-- Verificar se o bucket já existe antes de criar
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'landing-images', 
  'landing-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir leitura pública das imagens
CREATE POLICY "Imagens da landing são públicas"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'landing-images');

-- Política para admins fazerem upload (usando roles corretas: admin_master, admin_operacional)
CREATE POLICY "Admins podem fazer upload de imagens da landing"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'landing-images' 
  AND EXISTS (
    SELECT 1 FROM admin_user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_master', 'admin_operacional')
  )
);

-- Política para admins atualizarem imagens
CREATE POLICY "Admins podem atualizar imagens da landing"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'landing-images' 
  AND EXISTS (
    SELECT 1 FROM admin_user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_master', 'admin_operacional')
  )
);

-- Política para admins deletarem imagens
CREATE POLICY "Admins podem deletar imagens da landing"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'landing-images' 
  AND EXISTS (
    SELECT 1 FROM admin_user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_master', 'admin_operacional')
  )
);

-- =============================================
-- FASE 5: Adicionar campos extras aos planos
-- =============================================

-- Adicionar campo de features aos planos
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS badge_text TEXT;

-- =============================================
-- FASE 6: Criar tabela para configurações do footer
-- =============================================

CREATE TABLE IF NOT EXISTS landing_footer_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  copyright_text TEXT DEFAULT '© 2025 XLata.site • Sistema para Depósitos de Reciclagem',
  links JSONB DEFAULT '[
    {"label": "Termos de Uso", "url": "/termos-de-uso", "is_visible": true},
    {"label": "Guia Completo", "url": "/guia-completo", "is_visible": true},
    {"label": "Planos", "url": "/planos", "is_visible": true},
    {"label": "Área do Cliente", "url": "/login", "is_visible": true}
  ]'::jsonb,
  show_social_links BOOLEAN DEFAULT false,
  social_links JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE landing_footer_settings ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Footer settings são públicos para leitura"
ON landing_footer_settings
FOR SELECT
TO public
USING (true);

-- Política de escrita para admins
CREATE POLICY "Admins podem gerenciar footer settings"
ON landing_footer_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_master', 'admin_operacional')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_master', 'admin_operacional')
  )
);

-- Inserir configuração padrão do footer
INSERT INTO landing_footer_settings (id, copyright_text)
VALUES (gen_random_uuid(), '© 2025 XLata.site • Sistema para Depósitos de Reciclagem')
ON CONFLICT DO NOTHING;

-- =============================================
-- Atualizar dados padrão das seções
-- =============================================

-- Atualizar copy do Hero na landing_page_settings
UPDATE landing_page_settings
SET 
  hero_main_title = 'Pese, Calcule e Imprima em',
  hero_highlight_text = '3 Minutos',
  hero_subtitle = 'Sem erro. Sem fila. Sem discussão.',
  hero_description = 'Sistema completo para depósitos de sucata que querem parar de perder dinheiro com conta errada e cliente desconfiado.',
  hero_button_text = 'Começar Teste Grátis',
  hero_secondary_button_text = 'Ver Como Funciona',
  hero_social_proof_users = '130+',
  hero_social_proof_users_label = 'depósitos ativos',
  hero_social_proof_rating = '4.9',
  hero_social_proof_rating_label = 'de satisfação',
  hero_security_label = 'Dados 100% seguros',
  updated_at = now()
WHERE id = (SELECT id FROM landing_page_settings ORDER BY created_at DESC LIMIT 1);