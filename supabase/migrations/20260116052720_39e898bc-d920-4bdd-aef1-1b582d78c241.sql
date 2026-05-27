-- Parte 1: Adicionar campos de vídeo no Hero
ALTER TABLE landing_page_settings
ADD COLUMN IF NOT EXISTS hero_video_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS hero_video_type text DEFAULT 'url',
ADD COLUMN IF NOT EXISTS hero_media_type text DEFAULT 'image';

-- Parte 2: Criar tabela de configuração de indicações
CREATE TABLE IF NOT EXISTS referral_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type text NOT NULL UNIQUE,
  plan_label text NOT NULL DEFAULT '',
  bonus_days integer NOT NULL DEFAULT 7,
  renewal_percentage integer NOT NULL DEFAULT 50,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inserir valores padrão
INSERT INTO referral_settings (plan_type, plan_label, bonus_days, renewal_percentage, display_order) VALUES
  ('trial', 'Trial', 3, 50, 1),
  ('promotional', 'Promocional', 5, 50, 2),
  ('monthly', 'Mensal', 7, 50, 3),
  ('quarterly', 'Trimestral', 15, 50, 4),
  ('biannual', 'Semestral', 30, 50, 5),
  ('annual', 'Anual', 45, 50, 6),
  ('triennial', 'Trienal', 90, 50, 7)
ON CONFLICT (plan_type) DO NOTHING;

-- RLS para referral_settings
ALTER TABLE referral_settings ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar
CREATE POLICY "Admins can manage referral settings" ON referral_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Usuários autenticados podem ler
CREATE POLICY "Authenticated users can read referral settings" ON referral_settings
  FOR SELECT TO authenticated USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_referral_settings_updated_at
  BEFORE UPDATE ON referral_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();