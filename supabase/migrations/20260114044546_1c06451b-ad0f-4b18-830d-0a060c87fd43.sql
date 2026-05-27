-- Corrigir RLS da tabela landing_page_settings para permitir leitura pública

-- Remover política antiga de SELECT (se existir)
DROP POLICY IF EXISTS "Users can view their own landing settings" ON landing_page_settings;
DROP POLICY IF EXISTS "Landing settings are publicly readable" ON landing_page_settings;
DROP POLICY IF EXISTS "Admins can manage landing settings" ON landing_page_settings;

-- Criar nova política de leitura pública (para a landing page funcionar)
CREATE POLICY "Landing settings are publicly readable" 
  ON landing_page_settings 
  FOR SELECT 
  USING (true);

-- Criar política para admins gerenciarem (inserir, atualizar, deletar)
CREATE POLICY "Admins can manage landing settings" 
  ON landing_page_settings 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.status = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.status = 'admin'
    )
  );