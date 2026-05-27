-- Tabela para permissões padrão por cargo
CREATE TABLE public.role_default_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role, permission)
);

-- Enable RLS
ALTER TABLE public.role_default_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own role permissions
CREATE POLICY "Users can manage own role permissions" 
ON public.role_default_permissions 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_role_default_permissions_user_role ON public.role_default_permissions(user_id, role);