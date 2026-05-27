
-- Create fiscal_settings table
CREATE TABLE public.fiscal_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cnpj TEXT,
  razao_social TEXT,
  nome_fantasia TEXT,
  inscricao_estadual TEXT,
  logradouro TEXT,
  numero TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  regime_tributario TEXT DEFAULT 'simples_nacional',
  certificado_url TEXT,
  certificado_senha TEXT,
  ambiente TEXT DEFAULT 'homologacao',
  proximo_numero_nfe INTEGER DEFAULT 1,
  serie_nfe INTEGER DEFAULT 1,
  api_empresa_id TEXT,
  api_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.fiscal_settings ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage all fiscal settings"
ON public.fiscal_settings
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_user_roles WHERE user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_user_roles WHERE user_id = auth.uid()));

-- Users can read own
CREATE POLICY "Users can view own fiscal settings"
ON public.fiscal_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_fiscal_settings_updated_at
BEFORE UPDATE ON public.fiscal_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create private certificates bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', false);

-- Storage policies for certificates bucket
CREATE POLICY "Admins can upload certificates"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'certificates' 
  AND EXISTS (SELECT 1 FROM public.admin_user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view certificates"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificates' 
  AND EXISTS (SELECT 1 FROM public.admin_user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can delete certificates"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'certificates' 
  AND EXISTS (SELECT 1 FROM public.admin_user_roles WHERE user_id = auth.uid())
);
