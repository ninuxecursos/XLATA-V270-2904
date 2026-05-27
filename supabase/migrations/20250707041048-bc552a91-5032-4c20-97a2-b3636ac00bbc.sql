
-- Criar tabela para relatórios de erro
CREATE TABLE public.error_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  user_email TEXT NOT NULL,
  user_whatsapp TEXT,
  error_type TEXT NOT NULL,
  error_title TEXT NOT NULL,
  error_description TEXT NOT NULL,
  reproduce_steps TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  read_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;

-- Política para usuários criarem seus próprios relatórios
CREATE POLICY "Users can create their own error reports"
  ON public.error_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários verem seus próprios relatórios
CREATE POLICY "Users can view their own error reports"
  ON public.error_reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para administradores verem todos os relatórios
CREATE POLICY "Admins can view all error reports"
  ON public.error_reports
  FOR SELECT
  USING (is_admin());

-- Política para administradores atualizarem relatórios (marcar como lido)
CREATE POLICY "Admins can update error reports"
  ON public.error_reports
  FOR UPDATE
  USING (is_admin());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_error_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.is_read = true AND OLD.is_read = false THEN
    NEW.read_at = now();
    NEW.read_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_error_reports_updated_at
  BEFORE UPDATE ON public.error_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_error_reports_updated_at();

-- Função para obter relatórios não lidos (para administradores)
CREATE OR REPLACE FUNCTION public.get_unread_error_reports()
RETURNS TABLE(
  id UUID,
  user_email TEXT,
  error_type TEXT,
  error_title TEXT,
  error_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    er.id,
    er.user_email,
    er.error_type,
    er.error_title,
    er.error_description,
    er.created_at
  FROM public.error_reports er
  WHERE er.is_read = false
  ORDER BY er.created_at DESC;
END;
$$;
