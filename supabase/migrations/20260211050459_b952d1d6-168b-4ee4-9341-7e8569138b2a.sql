
-- Create table for Image Studio prompts
CREATE TABLE public.image_studio_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.image_studio_prompts ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (using admin_user_roles)
CREATE POLICY "Admins can view prompts" ON public.image_studio_prompts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can insert prompts" ON public.image_studio_prompts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update prompts" ON public.image_studio_prompts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can delete prompts" ON public.image_studio_prompts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM admin_user_roles WHERE user_id = auth.uid())
  );

-- Trigger for updated_at
CREATE TRIGGER update_image_studio_prompts_updated_at
  BEFORE UPDATE ON public.image_studio_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default prompt
INSERT INTO public.image_studio_prompts (name, prompt, is_active) VALUES (
  'Prompt Padrão - Foto Profissional',
  E'Use todas as imagens enviadas do produto como referência obrigatória e cruzada.\nO objetivo NÃO é recriar, redesenhar ou melhorar o produto.\nO objetivo é recortar exatamente o produto real das fotos e colocá-lo em um novo cenário profissional.\n\nÉ terminantemente proibido:\nAlterar formato, textura, cor, proporções, corrigir imperfeições, suavizar detalhes, estilizar ou recriar partes do produto.\n\nO produto final deve ser idêntico ao real, preservando cada detalhe exatamente como aparece nas fotos.\n\nTarefa permitida:\nRemover completamente o fundo original das fotos.\nUsar as múltiplas imagens para garantir fidelidade total aos detalhes reais.\nMontar uma nova imagem de apresentação profissional com o produto centralizado.\nCriar um fundo minimalista, elegante e clean, nas cores verde e branco sutis.\nAplicar iluminação suave de estúdio e uma sombra realista abaixo do produto.\nNão adicionar textos, logos, marcas, efeitos ou elementos gráficos.\n\nO resultado deve parecer uma fotografia profissional do produto real, não uma ilustração ou renderização.\n\nFormato final da imagem: 1:1 quadrado.\nManter 100% fiel qualquer texto ou nome encontrado nas fotos do produto.',
  true
);
