-- =====================================================
-- SISTEMA DE CATEGORIAS DE MATERIAIS (OPCIONAL)
-- =====================================================

-- 1. Tabela de Categorias de Materiais
CREATE TABLE public.material_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'blue',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para performance
CREATE INDEX idx_material_categories_user_id ON public.material_categories(user_id);
CREATE INDEX idx_material_categories_display_order ON public.material_categories(user_id, display_order);

-- RLS para material_categories
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories"
  ON public.material_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own categories"
  ON public.material_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON public.material_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON public.material_categories FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Tabela de Configurações de Materiais do Usuário
CREATE TABLE public.user_material_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  use_categories BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para user_material_settings
ALTER TABLE public.user_material_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own material settings"
  ON public.user_material_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own material settings"
  ON public.user_material_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own material settings"
  ON public.user_material_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. Adicionar coluna category_id na tabela materials
ALTER TABLE public.materials 
ADD COLUMN category_id UUID REFERENCES public.material_categories(id) ON DELETE SET NULL;

-- Índice para performance na busca por categoria
CREATE INDEX idx_materials_category_id ON public.materials(category_id);

-- 4. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_material_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_material_categories_updated_at
  BEFORE UPDATE ON public.material_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_material_categories_updated_at();

CREATE TRIGGER update_user_material_settings_updated_at
  BEFORE UPDATE ON public.user_material_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_material_categories_updated_at();