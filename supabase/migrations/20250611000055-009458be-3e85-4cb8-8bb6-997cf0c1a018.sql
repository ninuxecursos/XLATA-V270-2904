
-- Criar tabela para configurações de sistema globais
CREATE TABLE IF NOT EXISTS public.admin_system_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  max_users INTEGER NOT NULL DEFAULT 1000,
  session_timeout INTEGER NOT NULL DEFAULT 30,
  backup_interval INTEGER NOT NULL DEFAULT 24,
  log_retention INTEGER NOT NULL DEFAULT 90,
  backup_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_update_enabled BOOLEAN NOT NULL DEFAULT false,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  system_version TEXT NOT NULL DEFAULT 'v2.1.319',
  server_uptime_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configuração inicial se não existir
INSERT INTO public.admin_system_config (id) 
SELECT gen_random_uuid() 
WHERE NOT EXISTS (SELECT 1 FROM public.admin_system_config);

-- Habilitar RLS
ALTER TABLE public.admin_system_config ENABLE ROW LEVEL SECURITY;

-- Política para admins apenas
CREATE POLICY "Only admins can manage system config" 
  ON public.admin_system_config 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND status = 'admin'
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_admin_system_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_system_config_updated_at
  BEFORE UPDATE ON public.admin_system_config
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_system_config_updated_at();
