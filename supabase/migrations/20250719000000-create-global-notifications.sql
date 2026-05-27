-- Criar tabela de notificações globais se não existir
CREATE TABLE IF NOT EXISTS global_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL DEFAULT 'Sistema',
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de destinatários das notificações se não existir
CREATE TABLE IF NOT EXISTS global_notification_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID REFERENCES global_notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(notification_id, user_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_global_notifications_active ON global_notifications(is_active, expires_at, created_at);
CREATE INDEX IF NOT EXISTS idx_global_notification_recipients_user ON global_notification_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_global_notification_recipients_notification ON global_notification_recipients(notification_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE global_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_notification_recipients ENABLE ROW LEVEL SECURITY;

-- Políticas para global_notifications
DROP POLICY IF EXISTS "Usuários podem ver notificações ativas" ON global_notifications;
CREATE POLICY "Usuários podem ver notificações ativas" 
ON global_notifications FOR SELECT 
TO authenticated 
USING (is_active = true AND expires_at > NOW());

DROP POLICY IF EXISTS "Apenas admins podem inserir notificações" ON global_notifications;
CREATE POLICY "Apenas admins podem inserir notificações" 
ON global_notifications FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Políticas para global_notification_recipients
DROP POLICY IF EXISTS "Usuários podem ver suas próprias notificações lidas" ON global_notification_recipients;
CREATE POLICY "Usuários podem ver suas próprias notificações lidas" 
ON global_notification_recipients FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem marcar suas notificações como lidas" ON global_notification_recipients;
CREATE POLICY "Usuários podem marcar suas notificações como lidas" 
ON global_notification_recipients FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());