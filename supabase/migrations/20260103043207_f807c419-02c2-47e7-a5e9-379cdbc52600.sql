
-- =====================================================
-- FASE 1: SEGURANÇA E INFRAESTRUTURA DO CMS SAAS
-- =====================================================

-- 1. SISTEMA DE PERMISSÕES HIERÁRQUICO
-- =====================================================

-- Criar enum para roles administrativas
CREATE TYPE admin_role AS ENUM ('admin_master', 'admin_operacional', 'suporte', 'leitura');

-- Tabela de roles administrativas
CREATE TABLE admin_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role admin_role NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE admin_user_roles ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário tem role administrativa específica
CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id uuid, _role admin_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se usuário é admin master
CREATE OR REPLACE FUNCTION public.is_admin_master(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_admin_role(_user_id, 'admin_master')
$$;

-- Função para obter nível de acesso do admin (retorna a role mais alta)
CREATE OR REPLACE FUNCTION public.get_admin_access_level(_user_id uuid DEFAULT auth.uid())
RETURNS admin_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.admin_user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin_master' THEN 1
      WHEN 'admin_operacional' THEN 2
      WHEN 'suporte' THEN 3
      WHEN 'leitura' THEN 4
    END
  LIMIT 1
$$;

-- Políticas RLS para admin_user_roles
CREATE POLICY "Admin master pode gerenciar todas as roles"
ON admin_user_roles FOR ALL
USING (public.is_admin_master());

CREATE POLICY "Usuários podem ver suas próprias roles"
ON admin_user_roles FOR SELECT
USING (auth.uid() = user_id);

-- 2. LOGS COMPLETOS DE ACESSO
-- =====================================================

CREATE TABLE admin_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  action text NOT NULL,
  ip_address inet,
  user_agent text,
  device_type text,
  browser text,
  os text,
  country text,
  city text,
  success boolean DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_access_logs_user_id ON admin_access_logs(user_id);
CREATE INDEX idx_access_logs_created_at ON admin_access_logs(created_at DESC);
CREATE INDEX idx_access_logs_action ON admin_access_logs(action);
CREATE INDEX idx_access_logs_ip ON admin_access_logs(ip_address);

-- Habilitar RLS
ALTER TABLE admin_access_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem ver todos os logs de acesso"
ON admin_access_logs FOR SELECT
USING (
  public.is_admin() OR 
  public.has_admin_role(auth.uid(), 'suporte') OR
  public.has_admin_role(auth.uid(), 'leitura')
);

CREATE POLICY "Sistema pode inserir logs"
ON admin_access_logs FOR INSERT
WITH CHECK (true);

-- 3. AUDITORIA ADMINISTRATIVA EXPANDIDA
-- =====================================================

CREATE TABLE admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email text,
  action_type text NOT NULL,
  target_table text,
  target_record_id uuid,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  old_value jsonb,
  new_value jsonb,
  description text,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_target_user ON admin_audit_logs(target_user_id);
CREATE INDEX idx_audit_logs_action_type ON admin_audit_logs(action_type);
CREATE INDEX idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_target_table ON admin_audit_logs(target_table);

-- Habilitar RLS
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Apenas admin master pode ver todos os logs de auditoria"
ON admin_audit_logs FOR SELECT
USING (public.is_admin_master());

CREATE POLICY "Admins operacionais podem ver logs não sensíveis"
ON admin_audit_logs FOR SELECT
USING (
  public.has_admin_role(auth.uid(), 'admin_operacional') AND
  action_type NOT IN ('role_change', 'system_config', 'security_block')
);

CREATE POLICY "Sistema pode inserir logs de auditoria"
ON admin_audit_logs FOR INSERT
WITH CHECK (true);

-- 4. BLOQUEIOS DE SEGURANÇA
-- =====================================================

CREATE TYPE block_type AS ENUM ('ip', 'user', 'email', 'device');

CREATE TABLE security_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  block_type block_type NOT NULL,
  reason text NOT NULL,
  blocked_until timestamptz,
  is_permanent boolean DEFAULT false,
  auto_blocked boolean DEFAULT false,
  attempt_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_security_blocks_identifier ON security_blocks(identifier);
CREATE INDEX idx_security_blocks_type ON security_blocks(block_type);
CREATE INDEX idx_security_blocks_blocked_until ON security_blocks(blocked_until);

-- Habilitar RLS
ALTER TABLE security_blocks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem gerenciar bloqueios"
ON security_blocks FOR ALL
USING (
  public.is_admin() OR 
  public.has_admin_role(auth.uid(), 'admin_operacional')
);

CREATE POLICY "Suporte pode ver bloqueios"
ON security_blocks FOR SELECT
USING (public.has_admin_role(auth.uid(), 'suporte'));

-- Função para verificar se identificador está bloqueado
CREATE OR REPLACE FUNCTION public.is_blocked(p_identifier text, p_block_type block_type)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM security_blocks
    WHERE identifier = p_identifier
    AND block_type = p_block_type
    AND (is_permanent = true OR blocked_until > now())
  );
END;
$$;

-- 5. FEATURE FLAGS
-- =====================================================

CREATE TABLE feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  is_enabled boolean DEFAULT false,
  enabled_for_users uuid[] DEFAULT '{}',
  enabled_percentage integer DEFAULT 0 CHECK (enabled_percentage >= 0 AND enabled_percentage <= 100),
  metadata jsonb DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem gerenciar feature flags"
ON feature_flags FOR ALL
USING (public.is_admin() OR public.is_admin_master());

CREATE POLICY "Todos podem ver feature flags ativas"
ON feature_flags FOR SELECT
USING (true);

-- Função para verificar se feature está habilitada para usuário
CREATE OR REPLACE FUNCTION public.is_feature_enabled(p_feature_name text, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flag feature_flags%ROWTYPE;
BEGIN
  SELECT * INTO v_flag FROM feature_flags WHERE name = p_feature_name;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Se está globalmente habilitada
  IF v_flag.is_enabled THEN
    RETURN true;
  END IF;
  
  -- Se usuário está na lista de habilitados
  IF p_user_id = ANY(v_flag.enabled_for_users) THEN
    RETURN true;
  END IF;
  
  -- Rollout por porcentagem (baseado no hash do user_id)
  IF v_flag.enabled_percentage > 0 AND p_user_id IS NOT NULL THEN
    RETURN (abs(hashtext(p_user_id::text)) % 100) < v_flag.enabled_percentage;
  END IF;
  
  RETURN false;
END;
$$;

-- 6. VERSIONAMENTO DE CONTEÚDO
-- =====================================================

CREATE TABLE content_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid,
  version_number integer NOT NULL,
  data jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  is_published boolean DEFAULT false,
  published_at timestamptz,
  publish_note text
);

-- Índices
CREATE INDEX idx_content_versions_type_id ON content_versions(content_type, content_id);
CREATE INDEX idx_content_versions_published ON content_versions(is_published);

-- Habilitar RLS
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem gerenciar versões de conteúdo"
ON content_versions FOR ALL
USING (
  public.is_admin() OR 
  public.has_admin_role(auth.uid(), 'admin_operacional')
);

CREATE POLICY "Leitura pode ver versões"
ON content_versions FOR SELECT
USING (public.has_admin_role(auth.uid(), 'leitura'));

-- 7. ANALYTICS/EVENTOS INTERNOS
-- =====================================================

CREATE TABLE analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  page_path text,
  referrer text,
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_page ON analytics_events(page_path);

-- Habilitar RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem ver analytics"
ON analytics_events FOR SELECT
USING (
  public.is_admin() OR 
  public.has_admin_role(auth.uid(), 'admin_operacional') OR
  public.has_admin_role(auth.uid(), 'leitura')
);

CREATE POLICY "Sistema pode inserir eventos"
ON analytics_events FOR INSERT
WITH CHECK (true);

-- 8. SESSÕES ATIVAS DE USUÁRIOS
-- =====================================================

CREATE TABLE active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token text NOT NULL,
  ip_address inet,
  user_agent text,
  device_type text,
  browser text,
  os text,
  country text,
  city text,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Índices
CREATE INDEX idx_active_sessions_user ON active_sessions(user_id);
CREATE INDEX idx_active_sessions_active ON active_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_active_sessions_last_activity ON active_sessions(last_activity);

-- Habilitar RLS
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver suas próprias sessões"
ON active_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem encerrar suas próprias sessões"
ON active_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins podem gerenciar todas as sessões"
ON active_sessions FOR ALL
USING (public.is_admin() OR public.has_admin_role(auth.uid(), 'admin_operacional'));

-- 9. FUNÇÃO PARA REGISTRAR AÇÃO DE AUDITORIA
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action_type text,
  p_target_table text DEFAULT NULL,
  p_target_record_id uuid DEFAULT NULL,
  p_target_user_id uuid DEFAULT NULL,
  p_old_value jsonb DEFAULT NULL,
  p_new_value jsonb DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_email text;
  v_log_id uuid;
BEGIN
  SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();
  
  INSERT INTO admin_audit_logs (
    admin_id,
    admin_email,
    action_type,
    target_table,
    target_record_id,
    target_user_id,
    old_value,
    new_value,
    description
  ) VALUES (
    auth.uid(),
    v_admin_email,
    p_action_type,
    p_target_table,
    p_target_record_id,
    p_target_user_id,
    p_old_value,
    p_new_value,
    p_description
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 10. FUNÇÃO PARA REGISTRAR ACESSO
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_access(
  p_action text,
  p_success boolean DEFAULT true,
  p_error_message text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO admin_access_logs (
    user_id,
    action,
    success,
    error_message,
    metadata
  ) VALUES (
    auth.uid(),
    p_action,
    p_success,
    p_error_message,
    p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 11. MIGRAR ADMINS EXISTENTES PARA NOVO SISTEMA
-- =====================================================

-- Inserir admin_master para usuários que já são admin
INSERT INTO admin_user_roles (user_id, role, granted_at)
SELECT p.id, 'admin_master'::admin_role, now()
FROM profiles p
WHERE p.status = 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

-- 12. TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE TRIGGER update_security_blocks_updated_at
BEFORE UPDATE ON security_blocks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON feature_flags
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
